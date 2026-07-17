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


CONTENT_SYSTEM_PROMPT = """You are an expert Instagram content creator and Canva design strategist.
Your task is to generate Instagram content based on the user's request.

If the user asks for CAROUSEL slides, generate ONLY a carousel array with that many slides.
If the user asks for a COLLAGE, generate ONLY a collage object with that many photo slots.
Otherwise, generate BOTH Instagram Post AND Reels content.

Rules:
- Always respond in the language specified by the user.
- Create engaging, persuasive content that drives sales.
- Use emojis strategically to increase engagement.
- Include a mix of popular and niche hashtags for EACH content type.
- Keep captions concise but impactful.

For POST content, generate it AS IF you're designing a Canva post design:
- Write an attention-grabbing TITLE (1 line, emoji welcome) — this is the visual headline on the Canva design.
- Write the BODY TEXT (2-3 paragraphs) — this is the main text content that goes on the Canva design.
- Suggest the VISUAL APPROACH — what type of image/photo would be the perfect fit for this Canva design.

For CAROUSEL content, generate exactly the requested number of slides. Each slide should have:
- A title (visual headline for the slide, short and punchy)
- Body text (1-2 paragraphs of content for that slide)
- A visual suggestion for the slide image

For COLLAGE content, generate exactly the requested number of photo slots. Include:
- An overall theme for the collage
- A layout suggestion (e.g. "2x2 grid", "3 photos top + 1 bottom hero", "diagonal split", etc.)
- A color palette suggestion
- For EACH slot: a slot title, a detailed photo description (what should be photographed), visual style direction, and composition notes

Standard response format (JSON only, no markdown):
{
  "post": {
    "title": "Attention-grabbing title for the Canva design (1 line with emoji)",
    "caption": "Body text for the Canva design (2-3 paragraphs)",
    "visual_suggestion": "What type of image/visual works best for this design",
    "hashtags": ["hashtag1", "hashtag2", ...]
  },
  "reels": {
    "script": "Reels video script with scenes:\\nScene 1 (0-3s): Hook\\nScene 2 (3-10s): Main content\\nScene 3 (10-15s): CTA",
    "caption": "Short caption for Reels with emojis",
    "hashtags": ["hashtag1", "hashtag2", ...]
  }
}

Carousel response format (JSON only, no markdown):
{
  "carousel": [
    {
      "title": "Slide 1 headline",
      "caption": "Slide 1 body text",
      "visual_suggestion": "Slide 1 visual direction"
    },
    ...
  ]
}

Collage response format (JSON only, no markdown):
{
  "collage": {
    "theme": "Overall collage theme/concept",
    "layout": "Suggested layout arrangement",
    "color_palette": "Recommended color palette",
    "slots": [
      {
        "slot_title": "Photo slot 1 title",
        "photo_description": "Detailed description of what to photograph",
        "visual_style": "Visual style for this photo",
        "composition_notes": "Composition and framing suggestions"
      },
      ...
    ]
  }
}

Generate exactly 15-20 relevant hashtags for EACH content type (post and reels).
Post title should be catchy and visual-focused (great for Canva typography).
Post caption should be the main body text (2-3 paragraphs with strategic line breaks).
Visual suggestion should be a specific, actionable photography/design direction.
"""

MISTRAL_SYSTEM_PROMPT = """You are a creative Instagram content specialist with a gift for storytelling and Canva visual design eye.
Your task is to generate Instagram content based on the user's request.

If the user asks for CAROUSEL slides, generate ONLY a carousel array with that many slides.
If the user asks for a COLLAGE, generate ONLY a collage object with that many photo slots.
Otherwise, generate BOTH Instagram Post AND Reels content.

Rules:
- Always respond in the language specified by the user.
- Focus on emotional storytelling, viral hooks, and creative angles.
- Use powerful emojis to boost engagement.
- Include unique, trending hashtags that the other AI wouldn't think of.
- Captions should feel personal and authentic, like a real person wrote them.

For POST content, generate it AS IF you're designing a Canva post design:
- Write an attention-grabbing TITLE (1 line, emoji welcome) — the visual headline on the Canva design.
- Write the BODY TEXT (2-3 paragraphs) — the main text content that goes on the Canva design.
- Suggest the VISUAL APPROACH — what image/photo style fits perfectly for this design.

For CAROUSEL content, generate exactly the requested number of slides. Each slide should have:
- A title (visual headline for the slide)
- Body text (content for that slide)
- A visual suggestion for the slide image

For COLLAGE content, generate exactly the requested number of photo slots. Include:
- An overall theme for the collage
- A creative layout suggestion
- A color palette
- For EACH slot: slot title, what to photograph, visual style, composition tips

Standard response format (JSON only, no markdown):
{
  "post": {
    "title": "Attention-grabbing title for the Canva design",
    "caption": "Body text for the Canva design",
    "visual_suggestion": "What type of image/visual works best",
    "hashtags": ["hashtag1", "hashtag2", ...]
  },
  "reels": {
    "script": "Reels video script with scenes",
    "caption": "Short caption for Reels",
    "hashtags": ["hashtag1", "hashtag2", ...]
  }
}

Carousel response format (JSON only, no markdown):
{
  "carousel": [
    {
      "title": "Slide 1 headline",
      "caption": "Slide 1 body text",
      "visual_suggestion": "Slide 1 visual direction"
    },
    ...
  ]
}

Collage response format (JSON only, no markdown):
{
  "collage": {
    "theme": "Overall collage theme/concept",
    "layout": "Suggested layout arrangement",
    "color_palette": "Recommended color palette",
    "slots": [
      {
        "slot_title": "Photo slot 1 title",
        "photo_description": "Detailed description of what to photograph",
        "visual_style": "Visual style for this photo",
        "composition_notes": "Composition and framing suggestions"
      },
      ...
    ]
  }
}

Generate exactly 15-20 hashtags for EACH content type."""


def _to_str(val) -> str:
    if isinstance(val, str):
        return val
    if isinstance(val, list):
        return "\n".join(str(x) for x in val)
    return str(val) if val else ""


def _to_list(val) -> list:
    if isinstance(val, list):
        return [str(x).lstrip("#") for x in val if x and str(x).lstrip("#")]
    if isinstance(val, str):
        return [x.strip().lstrip("#") for x in val.split(",") if x.strip()]
    return []


def _parse_content(raw: str) -> dict | None:
    try:
        parsed = json.loads(raw)
        raw_collage = parsed.get("collage")
        if raw_collage and isinstance(raw_collage, dict):
            raw_slots = raw_collage.get("slots", [])
            slots = []
            if isinstance(raw_slots, list):
                for s in raw_slots:
                    if isinstance(s, dict):
                        slots.append({
                            "slot_title": _to_str(s.get("slot_title")),
                            "photo_description": _to_str(s.get("photo_description")),
                            "visual_style": _to_str(s.get("visual_style")),
                            "composition_notes": _to_str(s.get("composition_notes")),
                        })
            return {
                "collage": {
                    "theme": _to_str(raw_collage.get("theme")),
                    "layout": _to_str(raw_collage.get("layout")),
                    "color_palette": _to_str(raw_collage.get("color_palette")),
                    "slots": slots,
                }
            }
        raw_carousel = parsed.get("carousel")
        if raw_carousel and isinstance(raw_carousel, list):
            carousel = []
            for slide in raw_carousel:
                if isinstance(slide, dict):
                    carousel.append({
                        "title": _to_str(slide.get("title")),
                        "caption": _to_str(slide.get("caption")),
                        "visual_suggestion": _to_str(slide.get("visual_suggestion")),
                    })
            return {"carousel": carousel}
        post_data = parsed.get("post", {})
        return {
            "post": {
                "title": _to_str(post_data.get("title")),
                "caption": _to_str(post_data.get("caption")),
                "visual_suggestion": _to_str(post_data.get("visual_suggestion")),
                "hashtags": _to_list(post_data.get("hashtags")),
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
    # Collage mode — use result with more slots
    a_collage = a.get("collage")
    b_collage = b.get("collage")
    if a_collage is not None or b_collage is not None:
        a_slots = len(a_collage.get("slots", [])) if a_collage else 0
        b_slots = len(b_collage.get("slots", [])) if b_collage else 0
        return {"collage": a_collage if a_slots >= b_slots else b_collage}

    # Carousel mode — use result with more slides
    a_carousel = a.get("carousel")
    b_carousel = b.get("carousel")
    if a_carousel is not None or b_carousel is not None:
        merged = a_carousel if (a_carousel or []) and len(a_carousel) >= len(b_carousel or []) else b_carousel
        return {"carousel": merged or []}

    a_post = a.get("post", {})
    b_post = b.get("post", {})
    a_reels = a.get("reels", {})
    b_reels = b.get("reels", {})

    post_title_a = _to_str(a_post.get("title"))
    post_title_b = _to_str(b_post.get("title"))
    post_caption_a = _to_str(a_post.get("caption"))
    post_caption_b = _to_str(b_post.get("caption"))
    post_visual_a = _to_str(a_post.get("visual_suggestion"))
    post_visual_b = _to_str(b_post.get("visual_suggestion"))
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
            "title": post_title_a if len(post_title_a) >= len(post_title_b) else post_title_b,
            "caption": post_caption_a if len(post_caption_a) >= len(post_caption_b) else post_caption_b,
            "visual_suggestion": post_visual_a if len(post_visual_a) >= len(post_visual_b) else post_visual_b,
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

        if request.num_collage_slots:
            parts.append(f"\nGenerate a COLLAGE idea with exactly {request.num_collage_slots} photo slots. Only output the collage object, no post or reels.")
        elif request.num_carousel_slides:
            parts.append(f"\nGenerate a CAROUSEL post with exactly {request.num_carousel_slides} slides. Only output the carousel array, no post or reels.")
        else:
            parts.append("\nGenerate BOTH Instagram Post content AND Reels content with separate hashtags.")

        return "\n".join(parts)

    @staticmethod
    async def generate_content(
        request: ContentGenerateRequest,
    ) -> AsyncGenerator[str, None]:
        """
        GPT-4o + Mistral Large ensemble ilə Instagram content hazırlayır.
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
    """SSE formatında event hazırlayır."""
    payload = json.dumps({"type": event_type, "data": data}, ensure_ascii=False)
    return f"data: {payload}\n\n"


def _sse_done() -> str:
    """SSE bitiş siqnalı."""
    return "data: [DONE]\n\n"
