"""
FikirBiz — Image Generation endpoint testləri.

Real Cloudflare API çağırılmır — CloudflareFluxService.generate_image
monkeypatch edilir. Autentifikasiya, prompt validasiyası, quota və
Cloudflare error mapping yoxlanılır.
"""

import uuid
from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.database import Base, get_db
from app.dependencies.auth import get_current_active_user
from app.main import app
from app.models.image_generation import ImageGeneration
from app.models.user import User
from app.services.cloudflare_flux import (
    CONFIG_ERROR_CODE,
    UPSTREAM_REJECTED_CODE,
    UPSTREAM_TIMEOUT_CODE,
    CloudflareAPIError,
    CloudflareFluxService,
)
from app.services.token_service import TokenService

TEST_ENGINE = create_async_engine(
    "sqlite+aiosqlite://",
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
TEST_FACTORY = async_sessionmaker(TEST_ENGINE, expire_on_commit=False)

FAKE_JPEG = b"\xff\xd8\xff\xe0fake-jpeg-bytes\xff\xd9"


def _user(plan: str = "basic") -> User:
    return User(
        id=str(uuid.uuid4()),
        first_name="Test",
        last_name="User",
        email=f"test-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="x",
        role="customer",
        plan=plan,
    )


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


def _client(port: int, token: str | None = None) -> AsyncClient:
    """Hər test fərqli port istifadə edir ki, IP rate limit bucket-i ayrı olsun."""
    cookies = {"auth_token": token} if token else None
    return AsyncClient(
        transport=ASGITransport(app=app, client=("127.0.0.1", port)),
        base_url="http://test",
        cookies=cookies,
    )


async def _activate_user(user: User) -> str:
    """İstifadəçini DB-yə yazır, auth override qurur və JWT cookie token qaytarır."""
    async with TEST_FACTORY() as session:
        session.add(user)
        await session.commit()

    async def override_get_current_active_user():
        return user

    app.dependency_overrides[get_current_active_user] = override_get_current_active_user

    return TokenService.create_access_token(user.id, user.role, user.email, user.plan)


async def test_requires_authentication_returns_401():
    async with _client(10001) as client:
        response = await client.post("/api/images/generate", json={"prompt": "hello world"})
    assert response.status_code == 401


@pytest.mark.parametrize(
    "prompt",
    ["", "   ", "ab"],
)
async def test_invalid_short_prompt_returns_400(prompt):
    user = _user()
    token = await _activate_user(user)
    async with _client(10002, token) as client:
        response = await client.post("/api/images/generate", json={"prompt": prompt})
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_PROMPT"


async def test_too_long_prompt_returns_400():
    user = _user()
    token = await _activate_user(user)
    async with _client(10003, token) as client:
        response = await client.post(
            "/api/images/generate", json={"prompt": "a" * (2000 + 1)}
        )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_PROMPT"


async def test_generate_success_returns_jpeg(monkeypatch):
    user = _user()
    token = await _activate_user(user)

    async def fake_generate(prompt: str) -> bytes:
        return FAKE_JPEG

    monkeypatch.setattr(CloudflareFluxService, "generate_image", fake_generate)

    async with _client(10004, token) as client:
        response = await client.post(
            "/api/images/generate", json={"prompt": "A modern minimalist coffee shop interior"}
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/jpeg")
    assert response.content == FAKE_JPEG

    async with TEST_FACTORY() as session:
        rows = (
            await session.execute(
                select(ImageGeneration).where(ImageGeneration.user_id == user.id)
            )
        ).scalars().all()
    assert len(rows) == 1
    assert rows[0].prompt == "A modern minimalist coffee shop interior"


async def test_quota_exceeded_returns_403(monkeypatch):
    user = _user()
    token = await _activate_user(user)

    async with TEST_FACTORY() as session:
        for _ in range(settings.FREE_IMAGE_GENERATIONS_PER_DAY):
            session.add(
                ImageGeneration(
                    user_id=user.id,
                    prompt="test",
                    created_at=datetime.now(timezone.utc),
                )
            )
        await session.commit()

    async def should_not_be_called(prompt: str) -> bytes:
        raise AssertionError("Quota aşıldıqda Cloudflare çağırılmamalıdır")

    monkeypatch.setattr(CloudflareFluxService, "generate_image", should_not_be_called)

    async with _client(10005, token) as client:
        response = await client.post("/api/images/generate", json={"prompt": "another image"})

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "QUOTA_EXCEEDED"


async def test_pro_user_has_no_daily_limit(monkeypatch):
    user = _user(plan="pro")
    token = await _activate_user(user)

    async with TEST_FACTORY() as session:
        for _ in range(10):
            session.add(
                ImageGeneration(
                    user_id=user.id,
                    prompt="test",
                    created_at=datetime.now(timezone.utc),
                )
            )
        await session.commit()

    async def fake_generate(prompt: str) -> bytes:
        return FAKE_JPEG

    monkeypatch.setattr(CloudflareFluxService, "generate_image", fake_generate)

    async with _client(10006, token) as client:
        response = await client.post("/api/images/generate", json={"prompt": "pro image"})

    assert response.status_code == 200


async def test_cloudflare_error_returns_502(monkeypatch):
    user = _user()
    token = await _activate_user(user)

    async def fail_generate(prompt: str) -> bytes:
        raise CloudflareAPIError("upstream", code=UPSTREAM_REJECTED_CODE)

    monkeypatch.setattr(CloudflareFluxService, "generate_image", fail_generate)

    async with _client(10007, token) as client:
        response = await client.post("/api/images/generate", json={"prompt": "fails"})

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == UPSTREAM_REJECTED_CODE


async def test_cloudflare_timeout_returns_504(monkeypatch):
    user = _user()
    token = await _activate_user(user)

    async def timeout_generate(prompt: str) -> bytes:
        raise CloudflareAPIError("timeout", code=UPSTREAM_TIMEOUT_CODE)

    monkeypatch.setattr(CloudflareFluxService, "generate_image", timeout_generate)

    async with _client(10008, token) as client:
        response = await client.post("/api/images/generate", json={"prompt": "fails"})

    assert response.status_code == 504


async def test_missing_config_returns_500(monkeypatch):
    user = _user()
    token = await _activate_user(user)

    async def config_error(prompt: str) -> bytes:
        raise CloudflareAPIError("config", code=CONFIG_ERROR_CODE)

    monkeypatch.setattr(CloudflareFluxService, "generate_image", config_error)

    async with _client(10009, token) as client:
        response = await client.post("/api/images/generate", json={"prompt": "fails"})

    assert response.status_code == 500
    assert response.json()["detail"]["code"] == CONFIG_ERROR_CODE
