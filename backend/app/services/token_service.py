"""
FikirBiz — Token Service.

JWT hazırlama/yoxlama, refresh token rotation.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.refresh_token import RefreshToken


class TokenService:
    """JWT və refresh token idarəetmə xidməti."""

    @staticmethod
    def create_access_token(user_id: str, role: str, email: str, plan: str = "basic") -> str:
        """
        JWT access token hazırlayır.
        Müddəti: 1 saat (3600 saniyə).
        """
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "role": role,
            "email": email,
            "plan": plan,
            "iat": now,
            "exp": now + timedelta(seconds=3600),
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def decode_access_token(token: str) -> dict:
        """JWT-ni decode edir. Etibarsız token üçün JWTError raise edir."""
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            raise

    @staticmethod
    def create_refresh_token() -> tuple[str, str]:
        """
        Opaque refresh token hazırlayır.
        Qaytarır: (raw_token, token_hash)
        raw_token cookie-yə yazılır, token_hash DB-yə saxlanır.
        """
        raw_token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        return raw_token, token_hash

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Token-in SHA-256 hash-ini hesablayır."""
        return hashlib.sha256(raw_token.encode()).hexdigest()

    @staticmethod
    async def save_refresh_token(
        db: AsyncSession,
        user_id: str,
        token_hash: str,
        expires_days: int = 30,
    ) -> RefreshToken:
        """Refresh token-i DB-yə saxlayır."""
        rt = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=expires_days),
        )
        db.add(rt)
        await db.flush()
        return rt

    @staticmethod
    async def rotate_refresh_token(
        db: AsyncSession, old_token_hash: str
    ) -> tuple[str, str] | None:
        """
        Refresh token rotation:
        1. Köhnə token-i revoke edir
        2. Yeni raw_token + hash hazırlayır
        Qaytarır: (new_raw_token, new_hash) və ya None (etibarsız token)
        """
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == old_token_hash,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        old_rt = result.scalar_one_or_none()
        if not old_rt:
            return None

        # Köhnəni revoke et
        old_rt.is_revoked = True

        # Yenisini hazırla
        new_raw, new_hash = TokenService.create_refresh_token()
        new_rt = RefreshToken(
            user_id=old_rt.user_id,
            token_hash=new_hash,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(new_rt)
        await db.flush()

        return new_raw, new_hash

    @staticmethod
    async def revoke_all_user_tokens(
        db: AsyncSession,
        user_id: str,
        exclude_token_hash: str | None = None,
    ) -> None:
        """İstifadəçinin bütün refresh token-lərini etibarsız edir."""
        stmt = (
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False,
            )
            .values(is_revoked=True)
        )
        if exclude_token_hash:
            stmt = stmt.where(RefreshToken.token_hash != exclude_token_hash)
        await db.execute(stmt)
        await db.flush()

    @staticmethod
    async def get_valid_refresh_token(
        db: AsyncSession, token_hash: str
    ) -> RefreshToken | None:
        """Etibarlı refresh token-i DB-dən tapır."""
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        return result.scalar_one_or_none()
