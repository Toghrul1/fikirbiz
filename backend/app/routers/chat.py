"""
FikirBiz Backend — Chat/AI Gateway Router.

Mistral AI ilə real-time streaming chat endpoint-i (SSE stream).
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.dependencies.auth import JWTPayload, require_role, verify_token
from app.schemas import ChatRequest
from app.services.mistral_service import MistralService

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
    dependencies=[Depends(require_role("customer"))],
)


@router.post("")
async def chat_endpoint(
    body: ChatRequest,
    payload: Annotated[JWTPayload, Depends(verify_token)],
):
    """
    Chat endpointi — Mistral AI ilə real-time SSE stream.
    """
    has_canva = bool(body.canva_access_token)

    return StreamingResponse(
        MistralService.stream_chat(
            prompt=body.prompt,
            message_history=body.message_history,
            has_canva=has_canva,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
