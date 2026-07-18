"""
FikirBiz Backend — Auth Routers.

Müştəri qeydiyyatı, giriş, token yeniləmə, çıxış və şifrə sıfırlama.
"""

import time as _time
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.dependencies.auth import JWTPayload, get_current_active_user, verify_token
from app.models.password_reset import PasswordReset
from app.models.user import User
from app.schemas import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.services.email_service import EmailService
from app.services.password_service import PasswordService
from app.services.token_service import TokenService

router = APIRouter(prefix="/api/auth", tags=["auth"])

# --- Helper function for setting cookies ---
def set_auth_cookies(response: Response, access_token: str, refresh_token: str, remember_me: bool = False):
    """Tokenləri HttpOnly cookie olaraq təyin edir."""
    secure = not settings.DEBUG
    samesite = "none" if not settings.DEBUG else "lax"

    # Access token (1 saat)
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    
    # Refresh token
    refresh_max_age = (
        settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 if remember_me else None
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=refresh_max_age,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
@limiter.limit("5/10minutes")
async def register(
    request: Request,
    body: RegisterRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Yeni müştəri qeydiyyatı."""
    # E-poçt unikallığını yoxla
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_TAKEN", "message": "Bu e-poçt ünvanı artıq qeydiyyatdadır"},
        )
    
    # Şifrə validasiyası
    errors = PasswordService.validate_password_strength(body.password)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Şifrə tələblərə cavab vermir", "errors": errors},
        )
        
    # Yeni istifadəçi hazırla (role='customer')
    user = User(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        password_hash=PasswordService.hash_password(body.password),
        role="customer",
        plan=body.plan,
    )
    db.add(user)
    await db.flush()
    
    # Email göndər (uğursuz olsa belə davam et - tenacity 3 retry edir, amma xəta atsa qeydiyyatı dayandırmırıq)
    try:
        await EmailService.send_welcome_email(user.email, user.first_name)
    except Exception:
        pass # Req 1.8: göndərmə uğursuz olsada qeydiyyat prosesi ləğv edilməməlidir
        
    # Tokenləri hazırla
    access_token = TokenService.create_access_token(user.id, user.role, user.email)
    raw_refresh, token_hash = TokenService.create_refresh_token()
    await TokenService.save_refresh_token(db, user.id, token_hash)
    
    set_auth_cookies(response, access_token, raw_refresh, remember_me=False)
    
    return AuthResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        plan=user.plan,
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("20/15minutes")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Giriş endpointi."""
    _t0 = _time.perf_counter()
    
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    _t1 = _time.perf_counter()
    
    # Dummy hash for timing attack protection if user not found
    dummy_hash = "$2b$10$1EGCYWb4gRM2jrhgxEldduWpCO3oK3a/Dk11Gb7Jd9l9z0FulSZMa"
    is_valid = PasswordService.verify_password(body.password, user.password_hash if user else dummy_hash)
    _t2 = _time.perf_counter()
    
    if not user or not is_valid:
        if user:
            user.failed_attempts += 1
            if user.failed_attempts >= 5:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        print(f"[TIMING] login fail | db={_t1-_t0:.3f}s bcrypt={_t2-_t1:.3f}s")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "E-poçt ünvanı və ya şifrə yanlışdır"},
        )
        
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=423,
            detail={
                "code": "ACCOUNT_LOCKED", 
                "message": f"Hesab kilidli. Qalan vaxt: {int((user.locked_until - datetime.now(timezone.utc)).total_seconds() // 60)} dəqiqə",
                "locked_until": user.locked_until.isoformat()
            },
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
    _t3 = _time.perf_counter()
    
    access_token = TokenService.create_access_token(user.id, user.role, user.email, user.plan)
    raw_refresh, token_hash = TokenService.create_refresh_token()
    await TokenService.save_refresh_token(
        db, 
        user.id, 
        token_hash, 
        expires_days=settings.REFRESH_TOKEN_EXPIRE_DAYS if body.remember_me else 1
    )
    _t4 = _time.perf_counter()
    
    set_auth_cookies(response, access_token, raw_refresh, remember_me=body.remember_me)
    
    print(f"[TIMING] login ok | db={_t1-_t0:.3f}s bcrypt={_t2-_t1:.3f}s user={_t3-_t2:.3f}s token={_t4-_t3:.3f}s total={_t4-_t0:.3f}s")
    
    return AuthResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        plan=user.plan,
    )


@router.post("/refresh", response_model=MessageResponse)
async def refresh_token(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie()] = None,
):
    """Token yeniləmə."""
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "NO_TOKEN", "message": "Token tapılmadı"})
        
    token_hash = TokenService.hash_token(refresh_token)
    
    # Rotation
    new_tokens = await TokenService.rotate_refresh_token(db, token_hash)
    if not new_tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "INVALID_TOKEN", "message": "Etibarsız və ya vaxtı keçmiş token"})
        
    new_raw_refresh, new_hash = new_tokens
    
    # Retrieve user to generate access token
    rt_model = await TokenService.get_valid_refresh_token(db, new_hash)
    if not rt_model:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "INVALID_TOKEN", "message": "Etibarsız və ya vaxtı keçmiş token"})
        
    result = await db.execute(select(User).where(User.id == rt_model.user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "INVALID_TOKEN", "message": "İstifadəçi aktiv deyil"})
        
    new_access = TokenService.create_access_token(user.id, user.role, user.email, user.plan)
    
    # Determine remember_me based on remaining time of the new RT
    remaining_days = (rt_model.expires_at - datetime.now(timezone.utc)).days
    remember_me = remaining_days > 2
    
    set_auth_cookies(response, new_access, new_raw_refresh, remember_me=remember_me)
    
    return MessageResponse(message="Token yeniləndi")


@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: Annotated[JWTPayload, Depends(verify_token)],
):
    """Sistemdən çıxış."""
    await TokenService.revoke_all_user_tokens(db, payload.sub)
    
    secure = not settings.DEBUG
    samesite = "none" if not settings.DEBUG else "lax"
    response.delete_cookie("auth_token", secure=secure, httponly=True, samesite=samesite)
    response.delete_cookie("refresh_token", secure=secure, httponly=True, samesite=samesite)
    
    return MessageResponse(message="Uğurla çıxış edildi")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Şifrə sıfırlama sorğusu."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    
    # Always return the same message regardless of whether the email exists
    success_msg = "Əgər bu e-poçt ünvanı qeydiyyatdadırsa, sıfırlama linki göndəriləcəkdir"
    
    if user and user.is_active:
        raw_token, token_hash = TokenService.create_refresh_token()
        reset = PasswordReset(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        db.add(reset)
        await db.flush()
        
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{raw_token}"
        try:
            await EmailService.send_password_reset_email(user.email, reset_link)
        except Exception:
            pass # Suppress error
            
    return MessageResponse(message=success_msg)


@router.get("/reset-password/{token}", response_model=MessageResponse)
async def verify_reset_token(token: str, db: Annotated[AsyncSession, Depends(get_db)]):
    """Şifrə sıfırlama tokeninin yoxlanılması."""
    token_hash = TokenService.hash_token(token)
    result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.token_hash == token_hash,
            PasswordReset.used_at.is_(None),
            PasswordReset.expires_at > datetime.now(timezone.utc),
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "RESET_TOKEN_INVALID", "message": "Bu link artıq etibarsızdır"},
        )
    return MessageResponse(message="Token etibarlıdır")


@router.post("/reset-password/{token}", response_model=MessageResponse)
async def reset_password(
    token: str,
    body: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Şifrənin yenilənməsi."""
    token_hash = TokenService.hash_token(token)
    result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.token_hash == token_hash,
            PasswordReset.used_at.is_(None),
            PasswordReset.expires_at > datetime.now(timezone.utc),
        )
    )
    reset = result.scalar_one_or_none()
    
    if not reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "RESET_TOKEN_INVALID", "message": "Bu link artıq etibarsızdır"},
        )
        
    errors = PasswordService.validate_password_strength(body.new_password)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Şifrə tələblərə cavab vermir", "errors": errors},
        )
        
    result_user = await db.execute(select(User).where(User.id == reset.user_id))
    user = result_user.scalar_one()
    
    user.password_hash = PasswordService.hash_password(body.new_password)
    reset.used_at = datetime.now(timezone.utc)
    
    # Bütün aktiv sessionları bitir
    await TokenService.revoke_all_user_tokens(db, user.id)
    
    return MessageResponse(message="Şifrəniz uğurla yeniləndi")


@router.get("/me", response_model=AuthResponse)
async def get_current_user(
    user: Annotated[User, Depends(get_current_active_user)],
):
    """JWT token əsasında cari istifadəçinin məlumatlarını qaytarır."""
    return AuthResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        plan=user.plan,
    )
