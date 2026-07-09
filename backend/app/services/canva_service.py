"""
FikirBiz Backend — Canva Service.

Canva Connect API OAuth 2.0 Authorization Code Flow with PKCE.
Token exchange, refresh, revocation və API call-lar.

Rəsmi sənədlər: https://www.canva.dev/docs/connect/authentication/
"""

import base64
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from cryptography.fernet import Fernet
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.canva_connection import CanvaConnection
from app.utils.pkce import generate_code_verifier, generate_code_challenge, generate_state

logger = logging.getLogger(__name__)

# Canva API URLs (rəsmi sənədlərə uyğun)
CANVA_AUTH_URL = "https://www.canva.com/api/oauth/authorize"
CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"
CANVA_REVOKE_URL = "https://api.canva.com/rest/v1/oauth/revoke"
CANVA_API_BASE = "https://api.canva.com/rest"

# OAuth scope-ları (Canva Connect API rəsmi scope-ları)
CANVA_SCOPES = [
    "profile:read",
    "design:content:write",
    "design:content:read",
    "design:meta:read",
    "asset:read",
    "asset:write",
]

# Token encryption key (JWT_SECRET-dən törədilmiş)
_fernet_key: Optional[Fernet] = None


def _get_fernet() -> Fernet:
    """Fernet şifrələmə instansiyası (lazy init)."""
    global _fernet_key
    if _fernet_key is None:
        import hashlib
        key = hashlib.sha256(settings.JWT_SECRET.encode()).digest()
        _fernet_key = Fernet(base64.urlsafe_b64encode(key))
    return _fernet_key


def encrypt_token(token: str) -> str:
    """Token-ı Fernet ilə şifrələyir."""
    return _get_fernet().encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    """Şifrələnmiş token-ı deşifrə edir."""
    return _get_fernet().decrypt(encrypted_token.encode()).decode()


def _basic_auth_header() -> str:
    """Canva API üçün Basic Auth header hazırlayır.

    Canva sənədləri: Base64 encoded value of {client id}:{client secret}
    """
    credentials = f"{settings.CANVA_CLIENT_ID}:{settings.CANVA_CLIENT_SECRET}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return f"Basic {encoded}"


def build_authorization_url(redirect_uri: str) -> dict:
    """
    Canva OAuth authorization URL hazırlayır.

    Canva rəsmi sənədlərinə uyğun PKCE parametrləri:
    - code_challenge: SHA-256 hash of code_verifier, base64url encoded
    - code_challenge_method: S256
    - scope: space-separated list
    - response_type: code
    - state: high-entropy random string (CSRF qorunması)

    Return: {url, code_verifier, state}
    """
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    state = generate_state()

    scope_string = " ".join(CANVA_SCOPES)

    params = {
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "scope": scope_string,
        "response_type": "code",
        "client_id": settings.CANVA_CLIENT_ID,
        "state": state,
        "redirect_uri": redirect_uri,
    }

    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    auth_url = f"{CANVA_AUTH_URL}?{query_string}"

    return {
        "url": auth_url,
        "code_verifier": code_verifier,
        "state": state,
    }


async def exchange_code(
    code: str,
    code_verifier: str,
    redirect_uri: str,
) -> dict:
    """
    Canva authorization code-u access token-ə dəyişir.

    Canva rəsmi sənədləri:
    - POST https://api.canva.com/rest/v1/oauth/token
    - Grant type: authorization_code
    - Basic auth with client_id:client_secret
    - Content-Type: application/x-www-form-urlencoded

    Return: {access_token, refresh_token, expires_in, scope}
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            CANVA_TOKEN_URL,
            headers={
                "Authorization": _basic_auth_header(),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "authorization_code",
                "code": code,
                "code_verifier": code_verifier,
                "redirect_uri": redirect_uri,
            },
            timeout=30.0,
        )

        if response.status_code != 200:
            error_data = response.json()
            logger.error(
                "Canva token exchange failed: %s - %s",
                error_data.get("code"),
                error_data.get("message"),
            )
            raise CanvaAPIError(
                code=error_data.get("code", "token_exchange_failed"),
                message=error_data.get("message", "Token exchange failed"),
                status_code=response.status_code,
            )

        return response.json()


async def refresh_access_token(refresh_token: str) -> dict:
    """
    Refresh token ilə yeni access token alır.

    Canva rəsmi sənədləri:
    - POST https://api.canva.com/rest/v1/oauth/token
    - Grant type: refresh_token
    - Basic auth with client_id:client_secret
    - Hər refresh token yalnız bir dəfə istifadə oluna bilər

    Return: {access_token, refresh_token, expires_in, scope}
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            CANVA_TOKEN_URL,
            headers={
                "Authorization": _basic_auth_header(),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            timeout=30.0,
        )

        if response.status_code != 200:
            error_data = response.json()
            logger.error(
                "Canva token refresh failed: %s - %s",
                error_data.get("code"),
                error_data.get("message"),
            )
            raise CanvaAPIError(
                code=error_data.get("code", "token_refresh_failed"),
                message=error_data.get("message", "Token refresh failed"),
                status_code=response.status_code,
            )

        return response.json()


async def revoke_token(token: str) -> None:
    """
    Canva token-ı ləğv edir.

    Canva rəsmi sənədləri:
    - POST https://api.canva.com/rest/v1/oauth/revoke
    - Basic auth with client_id:client_secret
    - Refresh token ləğv edildikdə, bütün lineage ləğv olunur
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            CANVA_REVOKE_URL,
            headers={
                "Authorization": _basic_auth_header(),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "token": token,
            },
            timeout=30.0,
        )

        if response.status_code != 200:
            logger.warning(
                "Canva token revoke returned %d: %s",
                response.status_code,
                response.text,
            )


async def get_user_id(access_token: str) -> str:
    """
    Canva user ID-ni access token ilə alır.

    Canva API: GET /v1/users/me
    Response: {team_user: {user_id, team_id}}
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CANVA_API_BASE}/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30.0,
        )

        if response.status_code != 200:
            raise CanvaAPIError(
                code="failed_to_get_user",
                message="Failed to get Canva user info",
                status_code=response.status_code,
            )

        data = response.json()
        return data["team_user"]["user_id"]


async def get_user_profile(access_token: str) -> dict:
    """
    Canva istifadəçi profilini access token ilə alır.

    Canva API: GET /v1/users/me/profile
    Response: {profile: {display_name}}
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CANVA_API_BASE}/v1/users/me/profile",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30.0,
        )

        if response.status_code != 200:
            raise CanvaAPIError(
                code="failed_to_get_profile",
                message="Failed to get Canva user profile",
                status_code=response.status_code,
            )

        data = response.json()
        return data["profile"]


async def get_valid_token(user_id: str, db: AsyncSession) -> str:
    """
    İstifadəçi üçün etibarlı access token qaytarır.
    Token vaxtı keçmişsə avtomatik olaraq yeniləyir.

    Return: valid access token (plaintext)
    """
    result = await db.execute(
        select(CanvaConnection).where(CanvaConnection.user_id == user_id)
    )
    connection = result.scalar_one_or_none()

    if not connection:
        raise CanvaNotConnectedError("Canva hesabı bağlı deyil")

    now = datetime.now(timezone.utc)
    # Token 5 dəqiqə ərzində bitəcəksə, refresh et
    if connection.expires_at <= now + timedelta(minutes=5):
        try:
            refresh_token = decrypt_token(connection.encrypted_refresh_token)
            token_data = await refresh_access_token(refresh_token)

            connection.encrypted_access_token = encrypt_token(token_data["access_token"])
            connection.encrypted_refresh_token = encrypt_token(token_data["refresh_token"])
            connection.expires_at = now + timedelta(seconds=token_data["expires_in"])
            await db.flush()

            logger.info("Canva token refreshed for user %s", user_id)
            return token_data["access_token"]

        except CanvaAPIError as e:
            # Refresh token etibarsızdırsa, connection-ı sil
            logger.error("Canva token refresh failed, disconnecting: %s", e.message)
            await db.delete(connection)
            await db.flush()
            raise CanvaNotConnectedError("Canva token yenilənə bilmədi, yenidən bağlanın")

    return decrypt_token(connection.encrypted_access_token)


async def save_connection(
    user_id: str,
    token_data: dict,
    db: AsyncSession,
) -> CanvaConnection:
    """
    Canva OAuth token-larını verilənlər bazasına saxlayır.
    Mövcud connection varsa yeniləyir, yoxsa yeni hazırlayır.
    """
    now = datetime.now(timezone.utc)

    # Canva user ID-ni al
    access_token = token_data["access_token"]
    canva_user_id = await get_user_id(access_token)

    # Display name-i al
    try:
        profile = await get_user_profile(access_token)
        canva_username = profile.get("display_name")
    except CanvaAPIError:
        canva_username = None

    # Mövcud connection-ı tap
    result = await db.execute(
        select(CanvaConnection).where(CanvaConnection.user_id == user_id)
    )
    connection = result.scalar_one_or_none()

    if connection:
        connection.canva_user_id = canva_user_id
        connection.canva_username = canva_username
        connection.encrypted_access_token = encrypt_token(access_token)
        connection.encrypted_refresh_token = encrypt_token(token_data["refresh_token"])
        connection.expires_at = now + timedelta(seconds=token_data["expires_in"])
    else:
        connection = CanvaConnection(
            user_id=user_id,
            canva_user_id=canva_user_id,
            canva_username=canva_username,
            encrypted_access_token=encrypt_token(access_token),
            encrypted_refresh_token=encrypt_token(token_data["refresh_token"]),
            expires_at=now + timedelta(seconds=token_data["expires_in"]),
        )
        db.add(connection)

    await db.flush()
    logger.info("Canva connection saved for user %s", user_id)
    return connection


async def disconnect_user(user_id: str, db: AsyncSession) -> None:
    """
    İstifadəçinin Canva bağlantısını kəsir.
    Token-ları ləğv edir və DB-dən silir.
    """
    result = await db.execute(
        select(CanvaConnection).where(CanvaConnection.user_id == user_id)
    )
    connection = result.scalar_one_or_none()

    if not connection:
        return

    # Token-ı Canva-da ləğv et
    try:
        refresh_token = decrypt_token(connection.encrypted_refresh_token)
        await revoke_token(refresh_token)
    except Exception as e:
        logger.warning("Failed to revoke Canva token: %s", str(e))

    await db.delete(connection)
    await db.flush()
    logger.info("Canva connection deleted for user %s", user_id)


async def get_connection_status(user_id: str, db: AsyncSession) -> Optional[dict]:
    """
    İstifadəçinin Canva bağlantı statusunu qaytarır.
    Bağlantı yoxdursa None qaytarır.
    """
    result = await db.execute(
        select(CanvaConnection).where(CanvaConnection.user_id == user_id)
    )
    connection = result.scalar_one_or_none()

    if not connection:
        return None

    return {
        "connected": True,
        "canva_user_id": connection.canva_user_id,
        "canva_username": connection.canva_username,
        "expires_at": connection.expires_at.isoformat(),
    }


async def canva_api_request(
    method: str,
    path: str,
    user_id: str,
    db: AsyncSession,
    **kwargs,
) -> dict:
    """
    Canva API-yə autentifikasiyalı sorğu göndərir.
    Token avtomatik olaraq yenilənir.

    Args:
        method: HTTP method (GET, POST, etc.)
        path: API path (məs: /v1/designs)
        user_id: FikirBiz user ID
        db: Database session
        **kwargs: httpx-ə ötürülən əlavə parametrlər
    """
    token = await get_valid_token(user_id, db)

    async with httpx.AsyncClient() as client:
        response = await client.request(
            method,
            f"{CANVA_API_BASE}{path}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=60.0,
            **kwargs,
        )

        if response.status_code >= 400:
            error_data = response.json() if response.content else {}
            logger.error(
                "Canva API error %d: %s - %s",
                response.status_code,
                error_data.get("code"),
                error_data.get("message"),
            )
            raise CanvaAPIError(
                code=error_data.get("code", "api_error"),
                message=error_data.get("message", f"Canva API returned {response.status_code}"),
                status_code=response.status_code,
            )

        return response.json()


async def upload_asset_binary(
    user_id: str,
    db: AsyncSession,
    file_bytes: bytes,
    name: str,
) -> dict:
    """
    Binary faylı Canva-ya yükləyir.

    Canva API: POST /v1/asset-uploads
    - Content-Type: application/octet-stream
    - Asset-Upload-Metadata header: {name_base64: base64(name)}

    Return: {job: {id, status, asset?}}
    """
    token = await get_valid_token(user_id, db)
    name_base64 = base64.b64encode(name.encode("utf-8")).decode("utf-8")
    metadata = json.dumps({"name_base64": name_base64})

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CANVA_API_BASE}/v1/asset-uploads",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/octet-stream",
                "Asset-Upload-Metadata": metadata,
            },
            content=file_bytes,
            timeout=120.0,
        )

        if response.status_code >= 400:
            error_data = response.json() if response.content else {}
            logger.error(
                "Canva asset upload failed %d: %s - %s",
                response.status_code,
                error_data.get("code"),
                error_data.get("message"),
            )
            raise CanvaAPIError(
                code=error_data.get("code", "asset_upload_failed"),
                message=error_data.get("message", "Asset upload failed"),
                status_code=response.status_code,
            )

        return response.json()


async def upload_asset_from_url(
    user_id: str,
    db: AsyncSession,
    url: str,
    name: Optional[str] = None,
) -> dict:
    """
    URL-dən faylı Canva-ya yükləyir.

    Canva API: POST /v1/url-asset-uploads (Preview API)
    - Content-Type: application/json
    - Body: {url: "...", name: "..."}

    Return: {job: {id, status, asset?}}
    """
    token = await get_valid_token(user_id, db)

    body = {"url": url}
    if name:
        body["name"] = name

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CANVA_API_BASE}/v1/url-asset-uploads",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=60.0,
        )

        if response.status_code >= 400:
            error_data = response.json() if response.content else {}
            logger.error(
                "Canva URL asset upload failed %d: %s - %s",
                response.status_code,
                error_data.get("code"),
                error_data.get("message"),
            )
            raise CanvaAPIError(
                code=error_data.get("code", "url_asset_upload_failed"),
                message=error_data.get("message", "URL asset upload failed"),
                status_code=response.status_code,
            )

        return response.json()


async def get_asset_upload_job(
    user_id: str,
    db: AsyncSession,
    job_id: str,
) -> dict:
    """
    Asset upload job statusunu alır.

    Canva API: GET /v1/asset-uploads/{jobId}
    Scope: asset:read

    Return: {job: {id, status, asset?}}
    """
    return await canva_api_request(
        method="GET",
        path=f"/v1/asset-uploads/{job_id}",
        user_id=user_id,
        db=db,
    )


async def get_url_asset_upload_job(
    user_id: str,
    db: AsyncSession,
    job_id: str,
) -> dict:
    """
    URL asset upload job statusunu alır.

    Canva API: GET /v1/url-asset-uploads/{jobId}
    Scope: asset:read

    Return: {job: {id, status, asset?}}
    """
    return await canva_api_request(
        method="GET",
        path=f"/v1/url-asset-uploads/{job_id}",
        user_id=user_id,
        db=db,
    )


async def get_asset(
    user_id: str,
    db: AsyncSession,
    asset_id: str,
) -> dict:
    """
    Asset metadata-sını alır.

    Canva API: GET /v1/assets/{assetId}
    Scope: asset:read

    Return: {asset: {id, type, name, tags, ...}}
    """
    return await canva_api_request(
        method="GET",
        path=f"/v1/assets/{asset_id}",
        user_id=user_id,
        db=db,
    )


async def update_asset(
    user_id: str,
    db: AsyncSession,
    asset_id: str,
    name: Optional[str] = None,
    tags: Optional[list[str]] = None,
) -> dict:
    """
    Asset metadata-sını yeniləyir.

    Canva API: PATCH /v1/assets/{assetId}
    Scope: asset:write

    Return: {asset: {id, type, name, tags, ...}}
    """
    body = {}
    if name is not None:
        body["name"] = name
    if tags is not None:
        body["tags"] = tags

    return await canva_api_request(
        method="PATCH",
        path=f"/v1/assets/{asset_id}",
        user_id=user_id,
        db=db,
        json=body,
    )


async def delete_asset(
    user_id: str,
    db: AsyncSession,
    asset_id: str,
) -> None:
    """
    Asset-i silir.

    Canva API: DELETE /v1/assets/{assetId}
    Scope: asset:write
    """
    token = await get_valid_token(user_id, db)

    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{CANVA_API_BASE}/v1/assets/{asset_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30.0,
        )

        if response.status_code >= 400:
            error_data = response.json() if response.content else {}
            raise CanvaAPIError(
                code=error_data.get("code", "delete_failed"),
                message=error_data.get("message", "Asset deletion failed"),
                status_code=response.status_code,
            )


class CanvaAPIError(Exception):
    """Canva API xətası."""

    def __init__(self, code: str, message: str, status_code: int = 500):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class CanvaNotConnectedError(Exception):
    """Canva hesabı bağlı deyil."""
    pass
