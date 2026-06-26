"""
FikirBiz Backend — Content Generator Router.

Instagram content (caption, hashtags, Reels script) yaratma endpoint-i.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies.auth import JWTPayload, require_role, verify_token
from app.schemas import ContentGenerateRequest
from app.services.content_service import ContentService

router = APIRouter(
    prefix="/api/content",
    tags=["content"],
    dependencies=[Depends(require_role("customer"))],
)


@router.post("/generate")
async def generate_content(
    body: ContentGenerateRequest,
    payload: Annotated[JWTPayload, Depends(verify_token)],
):
    """
    Instagram content yaradır — caption, hashtags və Reels script (SSE stream).
    """
    return StreamingResponse(
        ContentService.generate_content(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
