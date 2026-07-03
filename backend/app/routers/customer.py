"""
FikirBiz Backend — Customer Routers.

Müştərinin öz profilini idarə etməsi, şifrə dəyişmə, hesabı silmə.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import JWTPayload, get_current_active_user, require_role, verify_token
from app.models.user import User
from app.schemas import (
    ChangePasswordRequest,
    CustomerProfile,
    DeleteAccountRequest,
    MessageResponse,
    UpdateProfileRequest,
)
from app.services.password_service import PasswordService
from app.services.token_service import TokenService
from app.services.canva_service import get_connection_status

router = APIRouter(
    prefix="/api/customer",
    tags=["customer"],
    dependencies=[Depends(require_role("customer"))],
)


@router.get("/profile", response_model=CustomerProfile)
async def get_profile(
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Müştəri profil məlumatları."""
    canva_status_data = await get_connection_status(user.id, db)
    canva_status = "connected" if canva_status_data else "disconnected"

    return CustomerProfile(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        registered_at=user.created_at,
        canva_connector_status=canva_status,
        active_chat_session_count=0,
    )


@router.put("/profile", response_model=CustomerProfile)
async def update_profile(
    body: UpdateProfileRequest,
    user: Annotated[User, Depends(get_current_active_user)],
):
    """Profil məlumatlarının yenilənməsi."""
    if body.first_name is not None:
        user.first_name = body.first_name
    if body.last_name is not None:
        user.last_name = body.last_name
        
    return CustomerProfile(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        registered_at=user.created_at,
    )


@router.put("/password", response_model=MessageResponse)
async def change_password(
    body: ChangePasswordRequest,
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Şifrənin dəyişdirilməsi."""
    if not PasswordService.verify_password(body.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CREDENTIALS", "message": "Cari şifrə yanlışdır"},
        )
        
    errors = PasswordService.validate_password_strength(body.new_password)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Yeni şifrə tələblərə cavab vermir", "errors": errors},
        )
        
    user.password_hash = PasswordService.hash_password(body.new_password)
    
    # Bütün DİGƏR sessionları bitirmək lazımdır (amma mock-edirik ki, hamısı bitirilsin)
    # Əslində Request/Cookie üzərindən cari session token hash-i istisna etmək lazımdır.
    await TokenService.revoke_all_user_tokens(db, user.id)
    
    return MessageResponse(message="Şifrə uğurla dəyişdirildi. Zəhmət olmasa yenidən giriş edin.")


@router.delete("/account", response_model=MessageResponse)
async def delete_account(
    body: DeleteAccountRequest,
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Hesabın silinməsi (soft delete)."""
    if not PasswordService.verify_password(body.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CREDENTIALS", "message": "Cari şifrə yanlışdır"},
        )
        
    # Soft delete
    user.is_active = False
    user.first_name = "Deleted"
    user.last_name = "User"
    user.email = f"deleted_{user.id}@fikirbiz.local"
    
    await TokenService.revoke_all_user_tokens(db, user.id)
    
    return MessageResponse(message="Hesabınız uğurla silindi")
