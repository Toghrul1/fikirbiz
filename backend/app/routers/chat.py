"""
FikirBiz Backend — Chat/AI Gateway Router.

OpenAI ilə real-time streaming chat endpoint-i (SSE stream).
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import JWTPayload, get_current_active_user, require_role, verify_token
from app.models.user import User
from app.schemas import ChatRequest
from app.services.canva_service import (
    CanvaAPIError,
    CanvaNotConnectedError,
    canva_api_request,
    get_connection_status,
)
from app.services.mistral_service import OpenAIService

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
    dependencies=[Depends(require_role("customer"))],
)


async def create_canva_design_from_chat(
    user_id: str,
    db: AsyncSession,
    design_type: str,
    title: str,
):
    """
    Chat-dən Canva dizayn yaradır.
    Canva API: POST /v1/designs
    """
    # Canva design_type mapping
    canva_design_type = design_type.lower()
    if canva_design_type not in ["doc", "email", "presentation", "whiteboard"]:
        canva_design_type = "doc"

    request_body = {
        "type": "type_and_asset",
        "design_type": {
            "type": "preset",
            "name": canva_design_type,
        },
        "title": title,
    }

    result = await canva_api_request(
        method="POST",
        path="/v1/designs",
        user_id=user_id,
        db=db,
        json=request_body,
    )

    design = result.get("design", {})

    class DesignResponse:
        def __init__(self, data):
            self.id = data.get("id", "")
            self.title = data.get("title", "")
            self.edit_url = data.get("urls", {}).get("edit_url", "")
            self.view_url = data.get("urls", {}).get("view_url", "")
            self.thumbnail_url = data.get("thumbnail", {}).get("url") if data.get("thumbnail") else None
            self.created_at = data.get("created_at")

    return DesignResponse(design)


@router.post("")
async def chat_endpoint(
    body: ChatRequest,
    payload: Annotated[JWTPayload, Depends(verify_token)],
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Chat endpointi — OpenAI ilə real-time SSE stream.
    """
    # Canva bağlantısını DB-dən yoxla
    canva_status = await get_connection_status(user.id, db)
    has_canva = canva_status is not None and canva_status.get("connected", False)

    # Canva dizayn yaratma funksiyasını hazırla
    async def create_design_fn(design_type: str, title: str):
        return await create_canva_design_from_chat(
            user_id=user.id,
            db=db,
            design_type=design_type,
            title=title,
        )

    return StreamingResponse(
        OpenAIService.stream_chat(
            prompt=body.prompt,
            message_history=body.message_history,
            has_canva=has_canva,
            create_design_fn=create_design_fn if has_canva else None,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
