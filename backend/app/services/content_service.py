"""
FikirBiz Backend — Instagram Content Generator Service.

Mistral AI ilə Instagram post caption, Reels script və hashtag yaratma.
"""

import json
from typing import AsyncGenerator

from mistralai.client import Mistral
from mistralai.client.models import (
    SystemMessage,
    UserMessage,
)

from app.core.config import settings
from app.schemas import ContentGenerateRequest


CONTENT_SYSTEM_PROMPT = """You are an expert Instagram content creator and social media strategist.
Your task is to generate TWO types of Instagram content:

1. INSTAGRAM POST (static image post)
2. INSTAGRAM REELS (short video content)

Rules:
- Always respond in the language specified by the user.
- Create engaging, persuasive content that drives sales.
- Use emojis strategically to increase engagement.
- Include a mix of popular and niche hashtags for EACH content type.
- Keep captions concise but impactful.
- Reels scripts should be hook-driven and attention-grabbing with clear scenes.

Response format (JSON only, no markdown):
{
  "post": {
    "caption": "Instagram post caption with emojis and line breaks (2-4 paragraphs)",
    "hashtags": ["hashtag1", "hashtag2", ...]
  },
  "reels": {
    "script": "Reels video script with scenes:\nScene 1 (0-3s): Hook\nScene 2 (3-10s): Main content\nScene 3 (10-15s): CTA",
    "caption": "Short caption for Reels with emojis",
    "hashtags": ["hashtag1", "hashtag2", ...]
  }
}

Generate exactly 15-20 relevant hashtags for EACH content type (post and reels).
Post caption should be 2-4 paragraphs with strategic line breaks.
Reels script should have 3-5 scenes with timing guidance.
Reels caption should be shorter (1-2 lines) and punchy.
"""


class ContentService:
    """Instagram content generation xidməti."""

    @staticmethod
    def _build_prompt(request: ContentGenerateRequest) -> str:
        """İstifadəçi sorğusunu AI prompt-a çevirir."""
        parts = [f"Create Instagram content for: {request.product_service_topic}"]

        if request.brand_name:
            parts.append(f"Brand: {request.brand_name}")

        if request.key_features:
            parts.append(f"Key features/selling points: {request.key_features}")

        if request.target_audience:
            parts.append(f"Target audience: {request.target_audience}")

        if request.call_to_action:
            parts.append(f"Call to action: {request.call_to_action}")

        parts.append(f"\nOutput language: {request.language}")
        parts.append("\nGenerate BOTH Instagram Post content AND Reels content with separate hashtags.")

        return "\n".join(parts)

    @staticmethod
    async def generate_content(
        request: ContentGenerateRequest,
    ) -> AsyncGenerator[str, None]:
        """
        Mistral AI ilə Instagram content yaradır.

        Yield edilən format:
        - data: {"type": "content", "data": {...}}\n\n
        - data: {"type": "error", "data": "..."}\n\n
        - data: [DONE]\n\n
        """
        if not settings.MISTRAL_API_KEY:
            yield _sse_event("error", "Mistral API açarı təyin olunmayıb.")
            yield _sse_done()
            return

        client = Mistral(api_key=settings.MISTRAL_API_KEY)
        prompt = ContentService._build_prompt(request)

        messages = [
            SystemMessage(content=CONTENT_SYSTEM_PROMPT),
            UserMessage(content=prompt),
        ]

        try:
            response = client.chat.complete(
                model=settings.MISTRAL_MODEL,
                messages=messages,
                temperature=0.8,
                max_tokens=4096,
                response_format={"type": "json_object"},
            )

            raw_content = response.choices[0].message.content

            try:
                parsed = json.loads(raw_content)

                content = {
                    "post": {
                        "caption": parsed.get("post", {}).get("caption", ""),
                        "hashtags": parsed.get("post", {}).get("hashtags", []),
                    },
                    "reels": {
                        "script": parsed.get("reels", {}).get("script", ""),
                        "caption": parsed.get("reels", {}).get("caption", ""),
                        "hashtags": parsed.get("reels", {}).get("hashtags", []),
                    },
                }

                yield _sse_event("content", content)

            except json.JSONDecodeError:
                content = {
                    "post": {
                        "caption": raw_content,
                        "hashtags": [],
                    },
                    "reels": {
                        "script": "",
                        "caption": "",
                        "hashtags": [],
                    },
                }
                yield _sse_event("content", content)

        except Exception as e:
            yield _sse_event("error", f"Süni intellekt xətası: {str(e)}")

        yield _sse_done()


def _sse_event(event_type: str, data) -> str:
    """SSE formatında event yaradır."""
    payload = json.dumps({"type": event_type, "data": data}, ensure_ascii=False)
    return f"data: {payload}\n\n"


def _sse_done() -> str:
    """SSE bitiş siqnalı."""
    return "data: [DONE]\n\n"
