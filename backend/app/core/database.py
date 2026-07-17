"""
FikirBiz Backend — Async Database Engine.

SQLAlchemy 2.0 async engine + session factory.
Development-də SQLite, production-da PostgreSQL istifadə olunur.
"""

from sqlalchemy import text as sa_text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=3600,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Bütün ORM modelləri üçün bazis sinif."""
    pass


async def get_db():
    """FastAPI dependency — async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Development üçün — bütün cədvəlləri hazırlayır."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Plan column migration for existing databases
        try:
            if settings.DATABASE_URL.startswith("sqlite"):
                await conn.execute(
                    sa_text("ALTER TABLE users ADD COLUMN plan VARCHAR(10) NOT NULL DEFAULT 'basic'")
                )
            else:
                await conn.execute(
                    sa_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(10) NOT NULL DEFAULT 'basic'")
                )
        except Exception:
            pass
