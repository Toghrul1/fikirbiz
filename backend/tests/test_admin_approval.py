"""
Tests for Admin Approval System (register, unapproved login, admin approve & reject).
"""

import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.dependencies.auth import get_current_active_user
from app.main import app
from app.models.user import User
from app.services.password_service import PasswordService
from app.services.token_service import TokenService

TEST_ENGINE = create_async_engine(
    "sqlite+aiosqlite://",
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
TEST_FACTORY = async_sessionmaker(TEST_ENGINE, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def _app_overrides():
    """Hər test üçün get_db override-i qurur və cleanup edir."""
    async with TEST_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with TEST_FACTORY() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides.pop(get_current_active_user, None)
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_admin_approval_workflow():
    async with AsyncClient(
        transport=ASGITransport(app=app, client=("127.0.0.1", 20001)),
        base_url="http://test",
    ) as ac:
        # 1. Register new user
        reg_payload = {
            "first_name": "Togrul",
            "last_name": "Test",
            "email": "togrul.test@example.com",
            "password": "Password123!",
            "plan": "basic",
        }
        res_reg = await ac.post("/api/auth/register", json=reg_payload)
        assert res_reg.status_code == 201
        data_reg = res_reg.json()
        assert data_reg["is_approved"] is False
        assert data_reg["role"] == "user"
        user_id = data_reg["id"]

        # 2. Login with unapproved user should fail with 403 Forbidden
        login_payload = {
            "email": "togrul.test@example.com",
            "password": "Password123!",
        }
        res_login = await ac.post("/api/auth/login", json=login_payload)
        assert res_login.status_code == 403
        assert "hesabınız hələ admin tərəfindən təsdiqlənməyib" in res_login.json()["detail"]["message"].lower()

        # 3. Create admin user & generate admin auth token cookie
        admin_user = User(
            id=str(uuid.uuid4()),
            first_name="Admin",
            last_name="User",
            email="admin.test@example.com",
            password_hash=PasswordService.hash_password("AdminPass123!"),
            role="admin",
            is_approved=True,
        )
        async with TEST_FACTORY() as session:
            session.add(admin_user)
            await session.commit()

        admin_token = TokenService.create_access_token(admin_user.id, "admin", admin_user.email)
        ac.cookies.set("auth_token", admin_token)

        # 4. Admin lists pending users
        res_pending = await ac.get("/api/admin/pending-users")
        assert res_pending.status_code == 200
        pending_items = res_pending.json()["items"]
        assert any(item["id"] == user_id for item in pending_items)

        # 5. Admin approves user
        res_approve = await ac.patch(f"/api/admin/approve-user/{user_id}")
        assert res_approve.status_code == 200

        # 6. User logs in successfully now
        ac.cookies.clear()
        res_login_approved = await ac.post("/api/auth/login", json=login_payload)
        assert res_login_approved.status_code == 200
        assert res_login_approved.json()["email"] == "togrul.test@example.com"

        # 7. Test reject workflow with a second user
        reg_payload2 = {
            "first_name": "Reject",
            "last_name": "User",
            "email": "reject.user@example.com",
            "password": "Password123!",
        }
        res_reg2 = await ac.post("/api/auth/register", json=reg_payload2)
        user_id2 = res_reg2.json()["id"]

        ac.cookies.set("auth_token", admin_token)
        res_reject = await ac.delete(f"/api/admin/reject-user/{user_id2}")
        assert res_reject.status_code == 200

        # Verify user is deleted from DB
        async with TEST_FACTORY() as session:
            res_user_in_db = await session.execute(select(User).where(User.id == user_id2))
            assert res_user_in_db.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_admin_login_and_stats():
    async with AsyncClient(
        transport=ASGITransport(app=app, client=("127.0.0.1", 20001)),
        base_url="http://test",
    ) as ac:
        # Register a regular (non-admin) user
        reg_payload = {
            "first_name": "Nigar",
            "last_name": "User",
            "email": "nigar.user@example.com",
            "password": "Password123!",
            "plan": "basic",
        }
        res_reg = await ac.post("/api/auth/register", json=reg_payload)
        assert res_reg.status_code == 201

        # 1. Regular user must NOT be able to log into admin panel
        res_regular = await ac.post(
            "/api/admin/login",
            json={"email": "nigar.user@example.com", "password": "Password123!"},
        )
        assert res_regular.status_code == 403
        assert res_regular.json()["detail"]["code"] == "ADMIN_ONLY"
        assert "yalnız sistem adminləri" in res_regular.json()["detail"]["message"].lower()

        # 2. Wrong credentials rejected
        res_wrong = await ac.post(
            "/api/admin/login",
            json={"email": "nigar.user@example.com", "password": "WrongPass123!"},
        )
        assert res_wrong.status_code == 401

        # 3. Create admin user and login via admin panel
        admin_user = User(
            id=str(uuid.uuid4()),
            first_name="Admin",
            last_name="Login",
            email="admin.login@example.com",
            password_hash=PasswordService.hash_password("AdminPass123!"),
            role="admin",
            is_approved=True,
        )
        async with TEST_FACTORY() as session:
            session.add(admin_user)
            await session.commit()

        res_admin = await ac.post(
            "/api/admin/login",
            json={"email": "admin.login@example.com", "password": "AdminPass123!"},
        )
        assert res_admin.status_code == 200
        body = res_admin.json()
        assert body["role"] == "admin"
        assert body["access_token"]  # admin hüquqlu JWT token
        assert "auth_token" in ac.cookies

        # 4. Stats endpoint requires valid admin token
        ac.cookies.clear()
        res_no_token = await ac.get("/api/admin/stats")
        assert res_no_token.status_code == 401

        # 5. Login again, then stats returns all four required metrics
        res_admin = await ac.post(
            "/api/admin/login",
            json={"email": "admin.login@example.com", "password": "AdminPass123!"},
        )
        assert res_admin.status_code == 200
        res_stats = await ac.get("/api/admin/stats")
        assert res_stats.status_code == 200
        stats = res_stats.json()
        assert set(stats.keys()) == {
            "total_users",
            "pending_users_count",
            "approved_users_count",
            "new_users_today",
        }
        assert stats["pending_users_count"] == 1
        assert stats["approved_users_count"] == 0
        assert stats["new_users_today"] >= 1
        assert stats["total_users"] == stats["pending_users_count"] + stats["approved_users_count"]

        # 6. Regular (non-admin) JWT cannot access admin routes
        ac.cookies.clear()
        user_in_db = None
        async with TEST_FACTORY() as session:
            result = await session.execute(select(User).where(User.email == "nigar.user@example.com"))
            user_in_db = result.scalar_one()
        regular_token = TokenService.create_access_token(user_in_db.id, "user", user_in_db.email)
        ac.cookies.set("auth_token", regular_token)
        res_regular_stats = await ac.get("/api/admin/stats")
        assert res_regular_stats.status_code == 403
        assert res_regular_stats.json()["detail"]["code"] == "ADMIN_ONLY"
