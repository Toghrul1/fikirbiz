"""
Tests for admin session persistence (refresh token).

Regression: admin_login() only set the `auth_token` cookie and no
`refresh_token`. Once the 60-minute access token expired every admin
request returned 401, the frontend interceptor tried to refresh, got
NO_TOKEN, and hard-redirected to /admin/login — the admin panel became
unreachable for everyone until a manual re-login.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.bootstrap_admin import ensure_admin_user
from app.core.database import Base, get_db
from app.main import app

TEST_ENGINE = create_async_engine(
    "sqlite+aiosqlite://",
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
TEST_FACTORY = async_sessionmaker(TEST_ENGINE, expire_on_commit=False)

ADMIN_EMAIL = "admin@fikirbiz.com"
ADMIN_PASSWORD = "Admin123!"

# Production həllində frontend HTTPS-də işləyir; `secure` cookie yalnız
# HTTPS-də göndərilir, ona görə base_url https olmalıdır.
BASE_URL = "https://test"


@pytest.fixture(autouse=True)
async def _fresh_db():
    async with TEST_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
def _db_override():
    async def override_get_db():
        async with TEST_FACTORY() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)


async def test_admin_login_sets_refresh_token_cookie(_db_override):
    """Admin girişi həm access, həm də refresh cookie qoymalıdır."""
    await ensure_admin_user(
        TEST_FACTORY, email=ADMIN_EMAIL, password=ADMIN_PASSWORD
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url=BASE_URL
    ) as client:
        res = await client.post(
            "/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert res.status_code == 200, res.text
        assert "auth_token" in res.cookies
        assert "refresh_token" in res.cookies, "admin üçün refresh_token cookie qoyulmadı"


async def test_admin_session_recovers_after_access_token_expires(_db_override):
    """
    Access token vaxtı bitəndən sonra da admin sessiyası bərpa olunmalıdır.

    Real vəziyyət: brauzer `auth_token`-i (60 dəq) atır, `refresh_token`
    (30 gün) isə qalır. Admin sorğusu 401 verir, refresh uğurlu olur və
    sessiya bərpa olunur.
    """
    await ensure_admin_user(
        TEST_FACTORY, email=ADMIN_EMAIL, password=ADMIN_PASSWORD
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url=BASE_URL
    ) as client:
        res = await client.post(
            "/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert res.status_code == 200, res.text
        refresh_token = res.cookies["refresh_token"]

    # Yeni "sessiya": access token YOXDUR (vaxtı bitib), refresh token VAR.
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url=BASE_URL
    ) as client:
        client.cookies.set("refresh_token", refresh_token)

        blocked = await client.get("/api/admin/stats")
        assert blocked.status_code == 401, "access token olmadan 401 gözlənilirdi"

        refreshed = await client.post("/api/auth/refresh")
        assert refreshed.status_code == 200, (
            "refresh_token varsa sessiya bərpa olunmalıdır: " + refreshed.text
        )
        assert "auth_token" in refreshed.cookies

        ok = await client.get("/api/admin/stats")
        assert ok.status_code == 200, ok.text