"""
FikirBiz Backend — Admin Auth Routers.

Admin paneli üçün ayrıca giriş/çıxış endpoint-ləri.
Adi istifadəçi girişindən (auth.py) tamamilə müstəqildir və yalnız
rolu 'admin' olan istifadəçilərə icazə verir.
"""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.dependencies.auth import JWTPayload, verify_token
from app.models.user import User
from app.schemas import AdminLoginResponse, LoginRequest, MessageResponse
from app.services.password_service import PasswordService
from app.services.token_service import TokenService

router = APIRouter(prefix="/api/admin", tags=["admin-auth"])


def _set_admin_cookies(response: Response, access_token: str) -> None:
    """Admin access token-i HttpOnly cookie olaraq təyin edir."""
    secure = not settings.DEBUG
    samesite = "none" if not settings.DEBUG else "lax"
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=AdminLoginResponse)
@limiter.limit("10/15minutes")
async def admin_login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin panelinə giriş. Yalnız rolu 'admin' olan istifadəçilər daxil ola bilər."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    # Timing attack mühafizəsi üçün dummy hash (istifadəçi tapılmadıqda)
    dummy_hash = "$2b$10$1EGCYWb4gRM2jrhgxEldduWpCO3oK3a/Dk11Gb7Jd9l9z0FulSZMa"
    is_valid = PasswordService.verify_password(
        body.password, user.password_hash if user else dummy_hash
    )

    if not user or not is_valid:
        if user:
            user.failed_attempts += 1
            if user.failed_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "E-poçt ünvanı və ya şifrə yanlışdır"},
        )

    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=423,
            detail={
                "code": "ACCOUNT_LOCKED",
                "message": "Hesab kilidli, bir müddət sonra yenidən cəhd edin",
            },
        )

    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ADMIN_ONLY", "message": "Bu panelə yalnız sistem adminləri daxil ola bilər."},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_INACTIVE", "message": "Hesabınız deaktiv edilib, admin ilə əlaqə saxlayın"},
        )

    # Uğurlu giriş
    user.failed_attempts = 0
    user.last_login_at = datetime.now(timezone.utc)
    user.locked_until = None
    await db.flush()

    access_token = TokenService.create_access_token(
        user.id, user.role, user.email, user.plan
    )
    _set_admin_cookies(response, access_token)

    return AdminLoginResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        plan=user.plan,
        access_token=access_token,
    )


@router.post("/logout", response_model=MessageResponse)
async def admin_logout(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: Annotated[JWTPayload, Depends(verify_token)],
):
    """Admin panelindən çıxış."""
    await TokenService.revoke_all_user_tokens(db, payload.sub)

    secure = not settings.DEBUG
    samesite = "none" if not settings.DEBUG else "lax"
    response.delete_cookie("auth_token", secure=secure, httponly=True, samesite=samesite)
    response.delete_cookie("refresh_token", secure=secure, httponly=True, samesite=samesite)

    return MessageResponse(message="Uğurla çıxış edildi")
