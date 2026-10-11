"""
FikirBiz Backend — Image Generation Router.

Cloudflare Workers AI (FLUX.1 schnell) ilə text-to-image endpoint-i.
Authenticated istifadəçilər üçündür və gündəlik quota ilə qorunur.
"""

import logging
import time
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.dependencies.auth import get_current_active_user, require_role
from app.models.image_generation import ImageGeneration
from app.models.user import User
from app.schemas import ImageGenerateRequest
from app.services.cloudflare_flux import (
    CONFIG_ERROR_CODE,
    INVALID_RESPONSE_CODE,
    UPSTREAM_TIMEOUT_CODE,
    UPSTREAM_UNAVAILABLE_CODE,
    CloudflareAPIError,
    CloudflareFluxService,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/images",
    tags=["images"],
    dependencies=[Depends(require_role("customer", "admin"))],
)

PROMPT_MIN_LENGTH = 3
PROMPT_MAX_LENGTH = 2000

# Prompt DB-də tam saxlanılmır — yalnız quota izləmək üçün qısaldılmış variant.
STORED_PROMPT_MAX_LENGTH = 500

FRIENDLY_ERROR_MESSAGE = "Şəkil yaratmaq mümkün olmadı. Bir az sonra yenidən cəhd edin."


def _validate_prompt(prompt: str) -> str:
    """Prompt-u təmizləyir və 400 səhvləri ilə validasiya edir."""
    cleaned = prompt.strip()
    if len(cleaned) < PROMPT_MIN_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_PROMPT",
                "message": f"Prompt ən azı {PROMPT_MIN_LENGTH} simvol olmalıdır",
            },
        )
    if len(cleaned) > PROMPT_MAX_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_PROMPT",
                "message": f"Prompt maksimum {PROMPT_MAX_LENGTH} simvol ola bilər",
            },
        )
    return cleaned


def _today_start_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


@router.post("/generate")
@limiter.limit("10/minute")
async def generate_image(
    request: Request,
    body: ImageGenerateRequest,
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Prompt əsasında şəkil yaradır və image/jpeg olaraq qaytarır.

    - prompt: minimum 3, maksimum 2000 simvol
    - gündəlik quota: FREE_IMAGE_GENERATIONS_PER_DAY (basic plan üçün)
    - pro plan istifadəçiləri üçün limit tətbiq edilmir
    """
    _t0 = time.perf_counter()
    logger.info(
        "image_generation_started user_id=%s prompt_length=%s",
        user.id,
        len(body.prompt),
    )

    prompt = _validate_prompt(body.prompt)

    # Per-user serializasiya: eyni anda göndərilən duplicate sorğuların
    # quota-dan iki dəfə keçməsinin qarşısını alır (PostgreSQL row lock).
    await db.execute(select(User.id).where(User.id == user.id).with_for_update())

    if user.plan != "pro":
        used = await db.scalar(
            select(func.count(ImageGeneration.id)).where(
                ImageGeneration.user_id == user.id,
                ImageGeneration.created_at >= _today_start_utc(),
            )
        )
        if used >= settings.FREE_IMAGE_GENERATIONS_PER_DAY:
            logger.warning("image_generation_quota_exceeded user_id=%s", user.id)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "QUOTA_EXCEEDED",
                    "message": "Gündəlik şəkil limitiniz bitdi. Sabah yenidən cəhd edin.",
                },
            )

    try:
        image_bytes = await CloudflareFluxService.generate_image(prompt)
    except CloudflareAPIError as exc:
        logger.error(
            "image_generation_failed user_id=%s error_code=%s",
            user.id,
            exc.code,
        )
        if exc.code == CONFIG_ERROR_CODE:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": CONFIG_ERROR_CODE, "message": FRIENDLY_ERROR_MESSAGE},
            )
        if exc.code == UPSTREAM_TIMEOUT_CODE:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail={"code": UPSTREAM_TIMEOUT_CODE, "message": FRIENDLY_ERROR_MESSAGE},
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": exc.code, "message": FRIENDLY_ERROR_MESSAGE},
        )

    db.add(
        ImageGeneration(
            user_id=user.id,
            prompt=prompt[:STORED_PROMPT_MAX_LENGTH],
        )
    )

    logger.info(
        "image_generation_success user_id=%s latency_ms=%s",
        user.id,
        int((time.perf_counter() - _t0) * 1000),
    )

    return Response(
        content=image_bytes,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-store"},
    )
