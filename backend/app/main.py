"""
FikirBiz Backend — Main Entry Point.
"""

import time as _time
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import create_tables
from app.core.limiter import limiter
from app.routers import admin, auth, auth_canva, canva, chat, content, customer


@asynccontextmanager
async def lifespan(app: FastAPI):
    _t0 = _time.perf_counter()
    if settings.DEBUG:
        try:
            await create_tables()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Database init warning: {e}")

    _t1 = _time.perf_counter()
    print(f"[TIMING] startup took {_t1-_t0:.3f}s")
    yield


app = FastAPI(
    title="FikirBiz API",
    description="FikirBiz Platform Backend",
    version="0.1.0",
    lifespan=lifespan,
)

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
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Custom Exception Handler for Pydantic/Validation errors or others
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": {"code": "SERVER_ERROR", "message": "Gözlənilməz xəta baş verdi"}},
    )


# Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(customer.router)
app.include_router(chat.router)
app.include_router(content.router)
app.include_router(auth_canva.router)
app.include_router(canva.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
