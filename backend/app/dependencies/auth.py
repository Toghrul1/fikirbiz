"""
FikirBiz Backend — Auth Dependencies.

verify_token və require_role FastAPI dependency-ləri.
"""

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.services.token_service import TokenService


class JWTPayload(BaseModel):
    sub: str
    role: str
    email: str
    plan: str = "basic"
    iat: float
    exp: float


async def verify_token(
    auth_token: Annotated[str | None, Cookie()] = None,
) -> JWTPayload:
    """JWT-ni yoxlayır və payload qaytarır."""
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_TOKEN", "message": "Autentifikasiya tələb olunur"},
        )
    
    try:
        payload_dict = TokenService.decode_access_token(auth_token)
        return JWTPayload(**payload_dict)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Etibarsız və ya vaxtı keçmiş token"},
        )


async def get_current_active_user(
    payload: Annotated[JWTPayload, Depends(verify_token)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """DB-dən istifadəçini gətirir və is_active yoxlayır."""
    result = await db.execute(select(User).where(User.id == payload.sub))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_NOT_FOUND", "message": "İstifadəçi tapılmadı"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_INACTIVE", "message": "Hesabınız deaktiv edilib, admin ilə əlaqə saxlayın"},
        )
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_NOT_APPROVED", "message": "Hesabınız hələ admin tərəfindən təsdiqlənməyib"},
        )
        
    return user


def require_role(*roles: str):
    """Rol əsaslı giriş nəzarəti (RBAC)."""
    async def role_checker(payload: Annotated[JWTPayload, Depends(verify_token)]) -> JWTPayload:
        if payload.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "Bu əməliyyat üçün icazəniz yoxdur"},
            )
        return payload
    return role_checker


async def get_current_admin(
    payload: Annotated[JWTPayload, Depends(verify_token)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Bütün /admin/* route-larını qoruyan dependency.

    Token-i yoxlayır, istifadəçinin həm token payload-da, həm də
    bazada rolunun 'admin' olduğunu təsdiq edir (stale token-lərə qarşı).
    """
    if payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ADMIN_ONLY", "message": "Bu panelə yalnız sistem adminləri daxil ola bilər."},
        )

    result = await db.execute(select(User).where(User.id == payload.sub))
    user = result.scalar_one_or_none()

    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ADMIN_ONLY", "message": "Bu panelə yalnız sistem adminləri daxil ola bilər."},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_INACTIVE", "message": "Hesabınız deaktiv edilib, admin ilə əlaqə saxlayın"},
        )

    return user
