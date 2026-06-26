"""
FikirBiz Backend — Admin Routers.

Admin istifadəçilərin idarəetməsi, deaktivləşdirmə, bərpa və analitika.
"""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import JWTPayload, require_role, verify_token
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas import AdminAnalytics, UserListResponse, UserTableRow
from app.services.audit_logger import AuditLogger
from app.services.token_service import TokenService

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_role("admin"))],
)


@router.get("/users", response_model=UserListResponse)
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    search: str = "",
):
    """Sistemdəki istifadəçilərin siyahısı (səhifələmə ilə)."""
    limit = 50
    offset = (page - 1) * limit
    
    query = select(User).where(User.role == "customer")
    
    if search and len(search) >= 2:
        search_term = f"%{search}%"
        query = query.where(
            User.email.ilike(search_term) | 
            User.first_name.ilike(search_term) | 
            User.last_name.ilike(search_term)
        )
        
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return UserListResponse(
        items=[
            UserTableRow(
                id=u.id,
                first_name=u.first_name,
                last_name=u.last_name,
                email=u.email,
                registered_at=u.created_at,
                last_login_at=u.last_login_at,
                is_active=u.is_active,
            ) for u in users
        ],
        total=total or 0,
        page=page,
        page_size=limit,
    )


@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: Annotated[JWTPayload, Depends(verify_token)],
):
    """Müştəri hesabını deaktiv edir."""
    if user_id == payload.sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SELF_DEACTIVATION", "message": "Öz hesabınızı deaktiv edə bilməzsiniz"},
        )
        
    result = await db.execute(select(User).where(User.id == user_id, User.role == "customer"))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "İstifadəçi tapılmadı"},
        )
        
    user.is_active = False
    await TokenService.revoke_all_user_tokens(db, user_id)
    await AuditLogger.log_action(db, actor_id=payload.sub, action=AuditLogger.DEACTIVATE, target_id=user_id)
    
    return {"message": "İstifadəçi deaktiv edildi"}


@router.put("/users/{user_id}/reactivate")
async def reactivate_user(
    user_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: Annotated[JWTPayload, Depends(verify_token)],
):
    """Müştəri hesabını bərpa edir."""
    result = await db.execute(select(User).where(User.id == user_id, User.role == "customer"))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "İstifadəçi tapılmadı"},
        )
        
    user.is_active = True
    # Qeyd: Əvvəlki tokenləri bərpa etmirik, Req 3.8
    await AuditLogger.log_action(db, actor_id=payload.sub, action=AuditLogger.REACTIVATE, target_id=user_id)
    
    return {"message": "İstifadəçi bərpa edildi"}


@router.get("/analytics", response_model=AdminAnalytics)
async def get_analytics(db: Annotated[AsyncSession, Depends(get_db)]):
    """Sistem analitikası."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_users = await db.scalar(select(func.count()).select_from(User).where(User.role == "customer"))
    
    new_users_today = await db.scalar(
        select(func.count()).select_from(User).where(
            User.role == "customer",
            User.created_at >= today_start
        )
    )
    
    active_sessions_count = await db.scalar(
        select(func.count()).select_from(RefreshToken).where(
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > now
        )
    )
    
    return AdminAnalytics(
        total_users=total_users or 0,
        new_users_today=new_users_today or 0,
        active_sessions_count=active_sessions_count or 0,
    )
