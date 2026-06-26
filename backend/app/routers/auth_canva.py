"""
FikirBiz Backend — Canva OAuth Router.

Canva Connect API üçün token exchange və refresh.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated

from app.dependencies.auth import require_role, verify_token, JWTPayload
from app.schemas import CanvaTokenRequest, CanvaRefreshRequest

router = APIRouter(
    prefix="/api/auth/canva",
    tags=["canva_auth"],
    dependencies=[Depends(require_role("customer"))],
)

@router.post("/token")
async def exchange_canva_token(
    body: CanvaTokenRequest,
    payload: Annotated[JWTPayload, Depends(verify_token)],
):
    """
    Canva OAuth code -> access/refresh token.
    (Mock implementasiya: reallıqda httpx ilə Canva API çağırılacaq)
    """
    if not body.code or not body.code_verifier:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    # TODO: httpx.post("https://api.canva.com/rest/v1/oauth/token", ...)
    
    return {
        "access_token": "mock_canva_access_token_123",
        "refresh_token": "mock_canva_refresh_token_456",
        "expires_in": 14400 # 4 hours
    }

@router.post("/refresh")
async def refresh_canva_token(
    body: CanvaRefreshRequest,
    payload: Annotated[JWTPayload, Depends(verify_token)],
):
    """Canva refresh token yeniləmə."""
    if not body.refresh_token:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    return {
        "access_token": "mock_canva_access_token_789",
        "refresh_token": "mock_canva_refresh_token_012",
        "expires_in": 14400
    }
