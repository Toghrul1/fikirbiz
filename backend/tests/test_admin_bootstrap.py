"""
Tests for admin bootstrap: fresh DB must be able to get an admin account.

Regression guard for the incident where a brand-new production database
left /admin/login unreachable ("E-poçt ünvanı və ya şifrə yanlışdır")
because no user with role='admin' existed and there was no code path that
could create one.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.bootstrap_admin import count_admins, ensure_admin_user
from app.core.database import Base, get_db
from app.main import app
from app.services.password_service import PasswordService

TEST_ENGINE = create_async_engine(
    "sqlite+aiosqlite://",
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
TEST_FACTORY = async_sessionmaker(TEST_ENGINE, expire_on_commit=False)

GOOD_PASSWORD = "Admin123!"


@pytest.fixture(autouse=True)
async def _fresh_db():
    async with TEST_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


async def test_creates_admin_on_empty_database():
    """Boş bazada admin yaradılmalı və dərhal girişə açılmalıdır."""
    assert await count_admins(TEST_FACTORY) == 0

    user = await ensure_admin_user(
        TEST_FACTORY, email="admin@fikirbiz.com", password=GOOD_PASSWORD
    )

    assert user is not None
    assert user.role == "admin"
    assert user.is_active is True
    assert user.is_approved is True
    # Yaradılan hesab dərhal giriş edə bilməlidir.
    assert PasswordService.verify_password(GOOD_PASSWORD, user.password_hash)
    assert await count_admins(TEST_FACTORY) == 1


async def test_bootstrap_is_idempotent_and_never_overwrites_password():
    """Təkrar başlatma mövcud şifrəni EZİLMƏMƏLİDİR."""
    first = await ensure_admin_user(
        TEST_FACTORY, email="admin@fikirbiz.com", password=GOOD_PASSWORD
    )
    second = await ensure_admin_user(
        TEST_FACTORY, email="admin@fikirbiz.com", password="DigerSifre9!"
    )

    assert second.password_hash == first.password_hash
    assert PasswordService.verify_password(GOOD_PASSWORD, second.password_hash)
    assert not PasswordService.verify_password("DigerSifre9!", second.password_hash)
    assert await count_admins(TEST_FACTORY) == 1


async def test_weak_password_is_rejected():
    """Şifrə tələblərinə cavab verməyən parol ilə admin yaradılmamalıdır."""
    user = await ensure_admin_user(
        TEST_FACTORY, email="weak@fikirbiz.com", password="abc"
    )
    assert user is None
    assert await count_admins(TEST_FACTORY) == 0


async def test_missing_email_or_password_is_skipped_quietly():
    """Env dəyərləri qoyulmayıbsa bootstrap səssizcə atlanmalıdır."""
    assert await ensure_admin_user(TEST_FACTORY, email="", password=GOOD_PASSWORD) is None
    assert await ensure_admin_user(TEST_FACTORY, email="a@b.com", password=None) is None
    assert await count_admins(TEST_FACTORY) == 0


async def test_reset_password_recovers_account():
    """Unudulmuş şifrə bərpası: yeni şifrə qəbul edilir, köhnəsi rədd edilir."""
    user = await ensure_admin_user(
        TEST_FACTORY, email="admin@fikirbiz.com", password=GOOD_PASSWORD
    )
    assert user is not None

    recovered = await ensure_admin_user(
        TEST_FACTORY,
        email="admin@fikirbiz.com",
        password="YeniSifre1!",
        reset_password=True,
    )
    assert recovered is not None
    assert recovered.role == "admin"
    assert recovered.is_active is True
    assert PasswordService.verify_password("YeniSifre1!", recovered.password_hash)
    assert not PasswordService.verify_password(GOOD_PASSWORD, recovered.password_hash)


async def test_email_is_normalized_to_lowercase():
    """E-poçt kiçik hərflə saxlanılır — giriş zamanı uyğunsuzluq olmasın."""
    user = await ensure_admin_user(
        TEST_FACTORY, email="  Admin@FikirBiz.com ", password=GOOD_PASSWORD
    )
    assert user is not None
    assert user.email == "admin@fikirbiz.com"


async def test_bootstrapped_admin_can_actually_log_in():
    """
    Regression: boş bazada yaradılan admin /api/admin/login ilə
    daxil ola bilməlidir (əvvəl "şifrə yanlışdır" xətası alınırdı).
    """
    async def override_get_db():
        async with TEST_FACTORY() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    try:
        await ensure_admin_user(
            TEST_FACTORY, email="admin@fikirbiz.com", password=GOOD_PASSWORD
        )

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            ok = await client.post(
                "/api/admin/login",
                json={"email": "admin@fikirbiz.com", "password": GOOD_PASSWORD},
            )
            assert ok.status_code == 200, ok.text
            assert ok.json()["role"] == "admin"
            assert "auth_token" in ok.cookies

            # Yanlış şifrə hələ də rədd edilməlidir.
            bad = await client.post(
                "/api/admin/login",
                json={"email": "admin@fikirbiz.com", "password": "YanlisSifre9!"},
            )
            assert bad.status_code == 401
    finally:
        app.dependency_overrides.pop(get_db, None)