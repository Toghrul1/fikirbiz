"""
FikirBiz — CanvaConnection ORM Model.

Canva Connect API OAuth token-larının saxlanması.
Token-lar Fernet simmetrik şifrələmə ilə qorunur.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CanvaConnection(Base):
    __tablename__ = "canva_connections"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    canva_user_id: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    canva_username: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    # Token-lar Fernet ilə şifrələnmiş şəkildə saxlanılır
    encrypted_access_token: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    encrypted_refresh_token: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
