"""
FikirBiz Backend — Canva OAuth Router.

Canva Connect API OAuth 2.0 Authorization Code Flow with PKCE.
Rəsmi sənədlər: https://www.canva.dev/docs/connect/authentication/

Endpoint-lər:
- GET  /login       — OAuth authorization URL hazırlayır, Canva-ya yönləndirir
- GET  /callback    — Canva-dan redirect, token exchange, DB-yə saxlama
- POST /disconnect  — Canva bağlantısını kəsir
- POST /refresh     — Token-ları yeniləyir
- GET  /status      — Bağlantı statusunu qaytarır
"""

import json
import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.dependencies.auth import get_current_active_user, require_role, verify_token, JWTPayload
from app.models.user import User
from app.services.canva_service import (
    CanvaAPIError,
    CanvaNotConnectedError,
    build_authorization_url,
    disconnect_user,
    exchange_code,
    get_connection_status,
    save_connection,
)
from app.services.canva_service import encrypt_token as _encrypt
from app.services.canva_service import decrypt_token as _decrypt

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/auth/canva",
    tags=["canva_auth"],
)

# OAuth session cookie adı (PKCE data üçün)
_OAUTH_SESSION_COOKIE = "_canva_oauth_session"
# Cookie müddəti (dəqiqə)
_OAUTH_SESSION_TTL_MINUTES = 10


def _encrypt_pkce_data(code_verifier: str, state: str, user_id: str) -> str:
    """PKCE data-nı (code_verifier + state + user_id) şifrələyir cookie üçün."""
    payload = json.dumps({"v": code_verifier, "s": state, "u": user_id})
    return _encrypt(payload)


def _decrypt_pkce_data(encrypted: str) -> dict:
    """Şifrələnmiş PKCE data-nı deşifrə edir."""
    payload = _decrypt(encrypted)
    return json.loads(payload)


@router.get("/login")
async def canva_login(
    payload: Annotated[JWTPayload, Depends(verify_token)],
):
    """
    Canva OAuth login endpoint-i.

    Canva rəsmi sənədlərinə uyğun:
    1. code_verifier generasiya edir (43-128 simvol, high-entropy)
    2. code_challenge generasiya edir (SHA-256 + base64url)
    3. state generasiya edir (CSRF qorunması)
    4. PKCE data-nı signed cookie-da saxlayır
    5. İstifadəçini Canva authorization URL-ə yönləndirir
    """
    redirect_uri = settings.CANVA_REDIRECT_URI
    auth_data = build_authorization_url(redirect_uri)

    # PKCE data-nı şifrələyib cookie-ya yaz (user_id də daxildir)
    encrypted_pkce = _encrypt_pkce_data(
        auth_data["code_verifier"],
        auth_data["state"],
        payload.sub,
    )

    response = RedirectResponse(url=auth_data["url"], status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key=_OAUTH_SESSION_COOKIE,
        value=encrypted_pkce,
        max_age=_OAUTH_SESSION_TTL_MINUTES * 60,
        httponly=True,
        secure=not settings.DEBUG,  # Development-də HTTP, production-da HTTPS
        samesite="lax",
    )

    logger.info("Canva OAuth login initiated for user %s", payload.sub)
    return response


@router.get("/callback")
async def canva_callback(
    db: Annotated[AsyncSession, Depends(get_db)],
    code: str = Query(...),
    state: str = Query(None),
    _canva_oauth_session: str = Cookie(None, alias=_OAUTH_SESSION_COOKIE),
):
    """
    Canva OAuth callback endpoint-i.

    Canva rəsmi sənədlərinə uyğun:
    1. State parametrini yoxlayır (CSRF qorunması)
    2. PKCE code_verifier-i cookie-dan oxuyur
    3. Authorization code-u access token-ə dəyişir
    4. Token-ları DB-da saxlayır
    5. İstifadəçini frontend dashboard-a yönləndirir
    """
    # Cookie-dan PKCE data-nı oxu
    if not _canva_oauth_session:
        logger.warning("Canva callback: missing OAuth session cookie")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/customer/chat?canva_error=no_session",
            status_code=status.HTTP_302_FOUND,
        )

    try:
        pkce_data = _decrypt_pkce_data(_canva_oauth_session)
    except Exception:
        logger.warning("Canva callback: invalid OAuth session cookie")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/customer/chat?canva_error=invalid_session",
            status_code=status.HTTP_302_FOUND,
        )

    # State yoxlaması (CSRF qorunması)
    expected_state = pkce_data.get("s")
    if expected_state and state and state != expected_state:
        logger.warning(
            "Canva callback: state mismatch. expected=%s received=%s",
            expected_state,
            state,
        )
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/customer/chat?canva_error=invalid_state",
            status_code=status.HTTP_302_FOUND,
        )

    code_verifier = pkce_data["v"]
    user_id = pkce_data.get("u")

    if not user_id:
        logger.warning("Canva callback: missing user_id in session")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/customer/chat?canva_error=no_user",
            status_code=status.HTTP_302_FOUND,
        )

    # Cookie-ı sil
    response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}/customer/chat?canva_error=token_exchange_failed",
        status_code=status.HTTP_302_FOUND,
    )
    response.delete_cookie(_OAUTH_SESSION_COOKIE)

    try:
        # Authorization code-u token-ə dəyiş
        token_data = await exchange_code(
            code=code,
            code_verifier=code_verifier,
            redirect_uri=settings.CANVA_REDIRECT_URI,
        )

        # Token-ları DB-da saxla
        await save_connection(user_id, token_data, db)

        logger.info("Canva connection established for user %s", user_id)

        # Başarılı message ilə redirect et
        success_response = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/customer/chat?canva_success=true",
            status_code=status.HTTP_302_FOUND,
        )
        success_response.delete_cookie(_OAUTH_SESSION_COOKIE)
        return success_response

    except CanvaAPIError as e:
        logger.error("Canva token exchange failed: %s", e.message)
        return response


@router.get("/status")
async def canva_status(
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Canva bağlantı statusunu qaytarır."""
    status_data = await get_connection_status(user.id, db)
    if status_data:
        return {"connected": True, **status_data}
    return {"connected": False}


@router.post("/disconnect")
async def canva_disconnect(
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Canva bağlantısını kəsir."""
    try:
        await disconnect_user(user.id, db)
    except Exception as e:
        logger.error("Canva disconnect error: %s", str(e))

    return {"message": "Canva bağlantısı kəsildi"}


@router.post("/refresh")
async def canva_refresh(
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Canva token-larını yeniləyir."""
    try:
        from app.services.canva_service import get_valid_token
        await get_valid_token(user.id, db)
        return {"message": "Token yeniləndi"}
    except CanvaNotConnectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NOT_CONNECTED", "message": "Canva hesabı bağlı deyil"},
        )
    except CanvaAPIError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"code": e.code, "message": e.message},
        )
