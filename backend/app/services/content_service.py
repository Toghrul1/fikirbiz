"""
FikirBiz Backend — Instagram Content Generator Service.

GPT-4o + Mistral Large ensemble ilə yüksək keyfiyyətli content generasiyası.
"""

import asyncio
import json
from typing import AsyncGenerator

from mistralai.client import Mistral
from mistralai.client.models import (
    SystemMessage as MistralSystemMessage,
    UserMessage as MistralUserMessage,
)
from openai import OpenAI

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

MISTRAL_SYSTEM_PROMPT = """You are a creative Instagram content specialist with a gift for storytelling and emotional hooks.
Your task is to generate TWO types of Instagram content:

1. INSTAGRAM POST (static image post)
2. INSTAGRAM REELS (short video content)

Rules:
- Always respond in the language specified by the user.
- Focus on emotional storytelling, viral hooks, and creative angles.
- Use powerful emojis to boost engagement.
- Include unique, trending hashtags that the other AI wouldn't think of.
- Captions should feel personal and authentic, like a real person wrote them.

Response format (JSON only, no markdown):
{
  "post": {
    "caption": "Instagram post caption",
    "hashtags": ["hashtag1", "hashtag2", ...]
  },
  "reels": {
    "script": "Reels video script with scenes",
    "caption": "Short caption for Reels",
    "hashtags": ["hashtag1", "hashtag2", ...]
  }
}

Generate exactly 15-20 hashtags for EACH content type.
Reels script should have 3-5 vivid scenes with timing.
"""


def _to_str(val) -> str:
    if isinstance(val, str):
        return val
    if isinstance(val, list):
        return "\n".join(str(x) for x in val)
    return str(val) if val else ""


def _to_list(val) -> list:
    if isinstance(val, list):
        return [str(x) for x in val if x]
    if isinstance(val, str):
        return [x.strip() for x in val.split(",") if x.strip()]
    return []


def _parse_content(raw: str) -> dict | None:
    try:
        parsed = json.loads(raw)
        return {
            "post": {
                "caption": _to_str(parsed.get("post", {}).get("caption")),
                "hashtags": _to_list(parsed.get("post", {}).get("hashtags")),
            },
            "reels": {
                "script": _to_str(parsed.get("reels", {}).get("script")),
                "caption": _to_str(parsed.get("reels", {}).get("caption")),
                "hashtags": _to_list(parsed.get("reels", {}).get("hashtags")),
            },
        }
    except (json.JSONDecodeError, AttributeError):
        return None


def _scene_count(script: str) -> int:
    if not script:
        return 0
    return script.lower().count("scene")


def _merge_contents(a: dict, b: dict) -> dict:
    a_post = a.get("post", {})
    b_post = b.get("post", {})
    a_reels = a.get("reels", {})
    b_reels = b.get("reels", {})

    post_caption_a = _to_str(a_post.get("caption"))
    post_caption_b = _to_str(b_post.get("caption"))
    reels_caption_a = _to_str(a_reels.get("caption"))
    reels_caption_b = _to_str(b_reels.get("caption"))
    reels_script_a = _to_str(a_reels.get("script"))
    reels_script_b = _to_str(b_reels.get("script"))

    post_hashtags_a = set(_to_list(a_post.get("hashtags")))
    post_hashtags_b = set(_to_list(b_post.get("hashtags")))
    reels_hashtags_a = set(_to_list(a_reels.get("hashtags")))
    reels_hashtags_b = set(_to_list(b_reels.get("hashtags")))

    return {
        "post": {
            "caption": post_caption_a if len(post_caption_a) >= len(post_caption_b) else post_caption_b,
            "hashtags": sorted(post_hashtags_a | post_hashtags_b)[:25],
        },
        "reels": {
            "script": reels_script_a if _scene_count(reels_script_a) >= _scene_count(reels_script_b) else reels_script_b,
            "caption": reels_caption_a if len(reels_caption_a) >= len(reels_caption_b) else reels_caption_b,
            "hashtags": sorted(reels_hashtags_a | reels_hashtags_b)[:25],
        },
    }


def _call_gpt4o(prompt: str) -> dict | None:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": CONTENT_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )
        return _parse_content(response.choices[0].message.content)
    except Exception:
        return None


def _call_mistral(prompt: str) -> dict | None:
    client = Mistral(api_key=settings.MISTRAL_API_KEY)
    try:
        response = client.chat.complete(
            model=settings.MISTRAL_MODEL,
            messages=[
                MistralSystemMessage(content=MISTRAL_SYSTEM_PROMPT),
                MistralUserMessage(content=prompt),
            ],
            temperature=0.8,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )
        return _parse_content(response.choices[0].message.content)
    except Exception:
        return None


class ContentService:
    """Instagram content generation xidməti — GPT-4o + Mistral ensemble."""

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
        GPT-4o + Mistral Large ensemble ilə Instagram content yaradır.
        Hər iki model paralel işləyir, ən yaxşı nəticələr birləşdirilir.

        Yield edilən format:
        - data: {"type": "content", "data": {...}}\n\n
        - data: {"type": "error", "data": "..."}\n\n
        - data: [DONE]\n\n
        """
        if not settings.OPENAI_API_KEY:
            yield _sse_event("error", "OpenAI API açarı təyin olunmayıb.")
            yield _sse_done()
            return

        prompt = ContentService._build_prompt(request)

        try:
            gpt4o_task = asyncio.to_thread(_call_gpt4o, prompt)

            mistral_task = None
            if settings.MISTRAL_API_KEY:
                mistral_task = asyncio.to_thread(_call_mistral, prompt)

            results = await asyncio.gather(gpt4o_task, mistral_task, return_exceptions=True)

            gpt4o_result = results[0] if not isinstance(results[0], Exception) else None
            mistral_result = results[1] if mistral_task and not isinstance(results[1], Exception) else None

            if gpt4o_result and mistral_result:
                content = _merge_contents(gpt4o_result, mistral_result)
            elif gpt4o_result:
                content = gpt4o_result
            elif mistral_result:
                content = mistral_result
            else:
                yield _sse_event("error", "Heç bir AI model cavab vermədi.")
                yield _sse_done()
                return

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
