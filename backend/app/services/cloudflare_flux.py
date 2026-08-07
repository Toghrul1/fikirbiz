"""
FikirBiz Backend — Cloudflare Workers AI FLUX Image Service.

Cloudflare Workers AI REST API üzərindən FLUX.1 [schnell] modeli ilə
text-to-image generasiyası.

Request:
    POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{MODEL}
    Authorization: Bearer {API_TOKEN}

Response (JSON):
    {"result": {"image": "<base64 jpeg>"}, "success": true, "errors": [], "messages": []}
"""

import base64
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4"
CONNECT_TIMEOUT_SECONDS = 10.0
READ_TIMEOUT_SECONDS = 120.0

CONFIG_ERROR_CODE = "CONFIG_ERROR"
UPSTREAM_TIMEOUT_CODE = "UPSTREAM_TIMEOUT"
UPSTREAM_UNAVAILABLE_CODE = "UPSTREAM_UNAVAILABLE"
UPSTREAM_REJECTED_CODE = "UPSTREAM_REJECTED"
INVALID_RESPONSE_CODE = "INVALID_RESPONSE"


class CloudflareAPIError(Exception):
    """Cloudflare API xətası — istifadəçiyə açılmayan texniki kodlar daşıyır."""

    def __init__(self, message: str, code: str, status_code: int | None = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


class CloudflareFluxService:
    """FLUX.1 schnell text-to-image generasiya xidməti."""

    @staticmethod
    def _endpoint() -> str:
        return (
            f"{CLOUDFLARE_API_BASE}/accounts/{settings.CLOUDFLARE_ACCOUNT_ID}"
            f"/ai/run/{settings.CLOUDFLARE_IMAGE_MODEL}"
        )

    @staticmethod
    async def generate_image(prompt: str) -> bytes:
        """
        Prompt-u Cloudflare-ə göndərir və decoded image bytes qaytarır.

        Heç bir secret (API token, Authorization header) log-a yazılmır.
        """
        if not settings.CLOUDFLARE_API_TOKEN or not settings.CLOUDFLARE_ACCOUNT_ID:
            raise CloudflareAPIError(
                "Cloudflare konfiqurasiyası tam deyil",
                code=CONFIG_ERROR_CODE,
            )

        headers = {
            "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
            "Content-Type": "application/json",
        }
        timeout = httpx.Timeout(
            READ_TIMEOUT_SECONDS, connect=CONNECT_TIMEOUT_SECONDS
        )

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    CloudflareFluxService._endpoint(),
                    headers=headers,
                    json={"prompt": prompt},
                )
        except httpx.TimeoutException:
            logger.error("cloudflare_request_timeout")
            raise CloudflareAPIError(
                "Cloudflare sorğu vaxt limitini aşdı",
                code=UPSTREAM_TIMEOUT_CODE,
            )
        except httpx.HTTPError:
            logger.error("cloudflare_request_connection_error")
            raise CloudflareAPIError(
                "Cloudflare-yə qoşulmaq mümkün olmadı",
                code=UPSTREAM_UNAVAILABLE_CODE,
            )

        if response.status_code != 200:
            error_id = ""
            try:
                error_id = (response.json().get("errors") or [{}])[0].get("code")
            except ValueError:
                pass
            logger.error(
                "cloudflare_request_rejected status=%s cloudflare_error_code=%s",
                response.status_code,
                error_id,
            )
            raise CloudflareAPIError(
                f"Cloudflare API {response.status_code} qaytardı",
                code=UPSTREAM_REJECTED_CODE,
                status_code=response.status_code,
            )

        try:
            payload = response.json()
            image_b64 = (payload.get("result") or {}).get("image")
            if not image_b64:
                raise ValueError("missing result.image")
            return base64.b64decode(image_b64)
        except (ValueError, TypeError) as exc:
            logger.error("cloudflare_invalid_response")
            raise CloudflareAPIError(
                "Cloudflare cavabı parse edilə bilmədi",
                code=INVALID_RESPONSE_CODE,
            ) from exc
