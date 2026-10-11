"""
FikirBiz Backend — Main Entry Point.
"""

import time as _time
import asyncio
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.bootstrap_admin import count_admins, ensure_admin_user
from app.core.config import settings
from app.core.database import async_session_factory, create_tables
from app.core.limiter import limiter
from app.core.migrate import run_migrations
from app.routers import admin, admin_auth, auth, auth_canva, canva, chat, content, customer, images


class ExceptionHandlingMiddleware:
    """İdarə olunmayan xətaları JSON cavabına çevirir.

    FastAPI exception handler-lərindən fərqli olaraq bu middleware
    CORSMiddleware-in içində qeydiyyatdan keçirilir, beləliklə CORS
    header-ləri xəta cavablarına da əlavə olunur (əks halda brauzer
    xətanı "Network Error" kimi göstərir).
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        try:
            await self.app(scope, receive, send)
        except RateLimitExceeded:
            response = JSONResponse(
                status_code=429,
                content={
                    "detail": {
                        "code": "RATE_LIMITED",
                        "message": "Çox tez-tez sorğu göndərdiniz. Bir az sonra yenidən cəhd edin",
                    }
                },
            )
            try:
                await response(scope, receive, send)
            except Exception:
                pass
        except Exception as exc:
            traceback.print_exc()
            response = JSONResponse(
                status_code=500,
                content={
                    "detail": {"code": "SERVER_ERROR", "message": "Gözlənilməz xəta baş verdi"}
                },
            )
            try:
                await response(scope, receive, send)
            except Exception:
                pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    _t0 = _time.perf_counter()
    if settings.DEBUG:
        try:
            await create_tables()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Database init warning: {e}")
    else:
        await asyncio.to_thread(run_migrations)

    # Yeni/boş bazada admin paneli kilidli qalmasın.
    # Idempotentdir: mövcud admin varsa heç nə dəyişmir, şifrə ezilmir.
    try:
        await ensure_admin_user(async_session_factory)
        admins = await count_admins(async_session_factory)
        print(f"[ADMIN] admin istifadəçi sayı: {admins}")
    except Exception as e:
        # Bootstrap uğursuz olsa da app işləməyə davam edir.
        print(f"[ADMIN] bootstrap xəbərdarlığı: {e}")

    _t1 = _time.perf_counter()
    print(f"[TIMING] startup took {_t1-_t0:.3f}s")
    yield


app = FastAPI(
    title="FikirBiz API",
    description="FikirBiz Platform Backend",
    version="0.1.0",
    lifespan=lifespan,
)

# Xəta middleware-i əvvəl qeydiyyatdan keçirilir ki, CORS middleware-i
# onun cavablarına da header əlavə etsin.
app.add_middleware(ExceptionHandlingMiddleware)

# CORS — exact origin list (no wildcards with credentials)
_cors_origins = [
    "https://fikirbiz-six.vercel.app",
    "http://localhost:5173",
]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in _cors_origins:
    _cors_origins.insert(0, settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Rate Limiter
app.state.limiter = limiter


# Routers
app.include_router(auth.router)
app.include_router(admin_auth.router)
app.include_router(admin.router)
app.include_router(customer.router)
app.include_router(chat.router)
app.include_router(content.router)
app.include_router(auth_canva.router)
app.include_router(canva.router)
app.include_router(images.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
