"""
Tests for role normalization in RBAC.

Regression: routers guarded the customer endpoints with
`require_role("customer")`, but no code path ever stores role="customer" —
`register` writes role="user". Every request to /api/content/generate,
/api/chat, /api/images, /api/canva and the customer routes was therefore
rejected with 403 FORBIDDEN for every user, including admins.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.dependencies.auth import normalize_role
from app.main import app
from app.models.user import User
from app.services.password_service import PasswordService

TEST_ENGINE = create_async_engine(
    "sqlite+aiosqlite://",
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
TEST_FACTORY = async_sessionmaker(TEST_ENGINE, expire_on_commit=False)

CUSTOMER_PASSWORD = "User123!"


def _make_user(email: str, role: str, first: str) -> User:
    return User(
        first_name=first,
        last_name="Test",
        email=email,
        password_hash=PasswordService.hash_password(CUSTOMER_PASSWORD),
        role=role,
        plan="pro",
        is_active=True,
        is_approved=True,
    )


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


def test_normalize_role_aliases():
    assert normalize_role("user") == "customer"
    assert normalize_role("customer") == "customer"
    assert normalize_role("admin") == "admin"
    assert normalize_role("USER") == "customer"
    assert normalize_role(" admin ") == "admin"
    assert normalize_role(None) == "unknown"
    assert normalize_role("") == "unknown"


async def _login_as(email: str, role: str, first: str):
    """Verilmiş rolu olan istifadəçi yaradıb giriş edir."""
    async with TEST_FACTORY() as session:
        session.add(_make_user(email, role, first))
        await session.commit()

    client = AsyncClient(transport=ASGITransport(app=app), base_url="https://test")
    res = await client.post(
        "/api/auth/login", json={"email": email, "password": CUSTOMER_PASSWORD}
    )
    assert res.status_code == 200, res.text
    return client


@pytest.mark.parametrize("role", ["user", "customer"])
async def test_customer_role_can_reach_content_generation(role, _db_override):
    """register 'user' yazır, router 'customer' gözləyirdi — ikisi də keçməlidir."""
    client = await _login_as(f"{role}@example.com", role, "Cust")
    try:
        res = await client.post(
            "/api/content/generate",
            json={"language": "az", "product_service_topic": "kofe"},
        )
        assert res.status_code != 403, "müştəri endpoint-i 403 qaytarmalı deyil"
        assert res.status_code == 200, res.text
    finally:
        await client.aclose()


async def test_admin_can_reach_customer_endpoints(_db_override):
    """Admin panelindən test edəndə 403 almamalıdır."""
    client = await _login_as("admin@example.com", "admin", "Adm")
    try:
        res = await client.post(
            "/api/content/generate",
            json={"language": "az", "product_service_topic": "kofe"},
        )
        assert res.status_code == 200, res.text
    finally:
        await client.aclose()


async def test_other_customers_are_still_blocked_from_admin_endpoints(_db_override):
    """Düzəliş icazələri genişləndirmədi — müştəri admin paneline daxil ola bilməz."""
    client = await _login_as("user2@example.com", "user", "Cust")
    try:
        res = await client.get("/api/admin/stats")
        assert res.status_code == 403
    finally:
        await client.aclose()