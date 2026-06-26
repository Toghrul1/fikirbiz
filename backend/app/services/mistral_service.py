"""
FikirBiz Backend — Mistral AI Service.

Mistral Large ilə real-time streaming chat və function calling.
"""

import json
from typing import AsyncGenerator

from mistralai.client import Mistral
from mistralai.client.models import (
    AssistantMessage,
    CompletionEvent,
    Function,
    SystemMessage,
    Tool,
    ToolCall,
    ToolMessage,
    UserMessage,
)

from app.core.config import settings

SYSTEM_PROMPT = """Sən FikirBiz platformasının AI köməkçisisən. Sənin adın FikirBiz AI-dır.
Sən istifadəçilərə Canva-da dizayn yaratmaqda kömək edirsən.

Əsas qaydalar:
- Azərbaycan dilində cavab ver.
- Qısa və aydın cavablar ver.
- Əgər istifadəçi dizayn yaratmaq istəyirsə, create_canva_design tool-unu istifadə et.
- Dizayn növləri: DESIGN, PRESENTATION, SOCIAL_MEDIA, POSTER, BANNER
- İstifadəçiyə həmişə dizayn yaratmağı təklif et, əgər prompt dizaynla bağlıdırsa.
- Professional və yaradıcı ol.

Canva dizayn növləri:
- DESIGN: Ümumi dizayn (poster, flyer, və s.)
- PRESENTATION: Təqdimat slides
- SOCIAL_MEDIA: Sosial media postu (Instagram, Facebook, Twitter)
- POSTER: Poster
- BANNER: Web banner, reklam banneri
"""

CANVA_DESIGN_TOOL = Tool(
    type="function",
    function=Function(
        name="create_canva_design",
        description="Canva-da yeni dizayn yaradır. İstifadəçinin tələbinə uyğun dizayn növünü seç və yarat.",
        parameters={
            "type": "object",
            "properties": {
                "content_type": {
                    "type": "string",
                    "enum": ["DESIGN", "PRESENTATION", "SOCIAL_MEDIA", "POSTER", "BANNER"],
                    "description": "Dizayn növü",
                },
                "topic": {
                    "type": "string",
                    "description": "Dizaynın mövzusu və ya başlığı",
                },
            },
            "required": ["content_type", "topic"],
        },
    ),
)


class MistralService:
    """Mistral AI chat xidməti."""

    @staticmethod
    def _build_messages(
        prompt: str,
        message_history: list[dict],
        has_canva: bool,
    ) -> list:
        """Mistral API üçün mesaj siyahısını hazırlayır."""
        messages = [SystemMessage(content=SYSTEM_PROMPT)]

        for msg in message_history:
            if msg.get("role") == "user":
                messages.append(UserMessage(content=msg["content"]))
            elif msg.get("role") == "assistant":
                messages.append(AssistantMessage(content=msg["content"]))

        messages.append(UserMessage(content=prompt))
        return messages

    @staticmethod
    async def stream_chat(
        prompt: str,
        message_history: list[dict] = None,
        has_canva: bool = False,
    ) -> AsyncGenerator[str, None]:
        """
        Mistral API-yə sorğu göndərir və SSE formatında streaming qaytarır.

        Yield edilən format:
        - data: {"type": "text", "data": "..."}\n\n
        - data: {"type": "design_url", "data": {...}}\n\n
        - data: {"type": "error", "data": "..."}\n\n
        - data: [DONE]\n\n
        """
        if message_history is None:
            message_history = []

        if not settings.MISTRAL_API_KEY:
            yield _sse_event("error", "Mistral API açarı təyin olunmayıb. Zəhmət olmasa .env faylında MISTRAL_API_KEY-i təyin edin.")
            yield _sse_done()
            return

        client = Mistral(api_key=settings.MISTRAL_API_KEY)
        messages = MistralService._build_messages(prompt, message_history, has_canva)
        tools = [CANVA_DESIGN_TOOL] if has_canva else None

        try:
            stream = client.chat.stream(
                model=settings.MISTRAL_MODEL,
                messages=messages,
                tools=tools,
                temperature=0.7,
                max_tokens=2048,
            )

            tool_calls_buffer = {}
            text_buffer = ""

            with stream as event_stream:
                for event in event_stream:
                    chunk: CompletionEvent = event
                    delta = chunk.data.choices[0].delta
                    finish_reason = chunk.data.choices[0].finish_reason

                    # Text content streaming
                    if delta.content:
                        text_buffer += delta.content
                        yield _sse_event("text", delta.content)

                    # Tool calls buffering
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index if tc.index is not None else 0
                            if idx not in tool_calls_buffer:
                                tool_calls_buffer[idx] = {
                                    "id": tc.id or "",
                                    "name": "",
                                    "arguments": "",
                                }
                            if tc.id:
                                tool_calls_buffer[idx]["id"] = tc.id
                            if tc.function:
                                if tc.function.name:
                                    tool_calls_buffer[idx]["name"] = tc.function.name
                                if tc.function.arguments:
                                    tool_calls_buffer[idx]["arguments"] += tc.function.arguments

                    # Tool call tamamlandıqda
                    if finish_reason == "tool_calls":
                        for idx, tc_data in tool_calls_buffer.items():
                            if tc_data["name"] == "create_canva_design":
                                try:
                                    args = json.loads(tc_data["arguments"])
                                    content_type = args.get("content_type", "DESIGN")
                                    topic = args.get("topic", prompt[:50])

                                    # Mock Canva design URL
                                    import uuid
                                    design_id = str(uuid.uuid4())[:8]
                                    design_url = {
                                        "designId": design_id,
                                        "editUrl": f"https://canva.com/design/{design_id}/edit",
                                        "contentType": content_type,
                                        "title": topic,
                                    }
                                    yield _sse_event("design_url", design_url)

                                    # Tool message backend-ə qaytarılır (agent loop)
                                    yield _sse_event("text", f"\n\nCanva-da \"{topic}\" mövzusunda {content_type.lower()} dizaynı yaradıldı. Dizaynı redaktə etmək üçün linkə keçin.")

                                except json.JSONDecodeError:
                                    yield _sse_event("error", "Dizayn parametrlərini oxumaq mümkün olmadı.")

            yield _sse_done()

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
