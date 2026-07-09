"""
FikirBiz Backend — OpenAI Service.

OpenAI ilə real-time streaming chat və Canva dizayn hazırlama.
"""

import json
import uuid
from typing import AsyncGenerator

from openai import OpenAI

from app.core.config import settings

SYSTEM_PROMPT = """Sən FikirBiz platformasının AI köməkçisisən. Sənin adın FikirBiz AI-dır.
Sən istifadəçilərə Canva-da dizayn hazırlamaqda kömək edirsən.

Əsas qaydalar:
- Azərbaycan dilində cavab ver.
- Qısa və aydın cavablar ver.
- Əgər istifadəçi dizayn hazırlamaq istəyirsə, create_canva_design tool-unu istifadə et.
- Dizayn növləri: doc, email, presentation, whiteboard
- İstifadəçiyə həmişə dizayn hazırlamağı təklif et, əgər prompt dizaynla bağlıdırsa.
- Professional və yaradıcı ol.

Canva dizayn növləri:
- doc: Sənəd (Canva Docs)
- email: E-poçt kampaniyası
- presentation: Təqdimat slides
- whiteboard: Ağ lövhə

Dizayn hazırladıqdan sonra istifadəçiyə dizayn linkini təqdim et.
"""

CANVA_DESIGN_TOOL = {
    "type": "function",
    "function": {
        "name": "create_canva_design",
        "description": "Canva-da yeni dizayn hazırlayır. İstifadəçinin tələbinə uyğun dizayn növünü seç və hazırla.",
        "parameters": {
            "type": "object",
            "properties": {
                "design_type": {
                    "type": "string",
                    "enum": ["doc", "email", "presentation", "whiteboard"],
                    "description": "Dizayn növü",
                },
                "title": {
                    "type": "string",
                    "description": "Dizaynın başlığı",
                },
            },
            "required": ["design_type", "title"],
        },
    },
}


def _sse_event(event_type: str, data) -> str:
    """SSE formatında event hazırlayır."""
    payload = json.dumps({"type": event_type, "data": data}, ensure_ascii=False)
    return f"data: {payload}\n\n"


def _sse_done() -> str:
    """SSE bitiş siqnalı."""
    return "data: [DONE]\n\n"


class OpenAIService:
    """OpenAI chat xidməti."""

    @staticmethod
    def _build_messages(
        prompt: str,
        message_history: list[dict],
        has_canva: bool,
    ) -> list:
        """OpenAI API üçün mesaj siyahısını hazırlayır."""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        for msg in message_history:
            if msg.get("role") == "user":
                messages.append({"role": "user", "content": msg["content"]})
            elif msg.get("role") == "assistant":
                messages.append({"role": "assistant", "content": msg["content"]})

        messages.append({"role": "user", "content": prompt})
        return messages

    @staticmethod
    async def stream_chat(
        prompt: str,
        message_history: list[dict] = None,
        has_canva: bool = False,
        create_design_fn=None,
    ) -> AsyncGenerator[str, None]:
        """
        OpenAI API-yə sorğu göndərir və SSE formatında streaming qaytarır.

        Yield edilən format:
        - data: {"type": "text", "data": "..."}\n\n
        - data: {"type": "design_url", "data": {...}}\n\n
        - data: {"type": "error", "data": "..."}\n\n
        - data: [DONE]\n\n
        """
        if message_history is None:
            message_history = []

        if not settings.OPENAI_API_KEY:
            yield _sse_event("error", "OpenAI API açarı təyin olunmayıb. Zəhmət olmasa .env faylında OPENAI_API_KEY-i təyin edin.")
            yield _sse_done()
            return

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        messages = OpenAIService._build_messages(prompt, message_history, has_canva)
        tools = [CANVA_DESIGN_TOOL] if has_canva else None

        try:
            stream = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                tools=tools,
                temperature=0.7,
                max_tokens=2048,
                stream=True,
            )

            tool_calls_buffer = {}

            for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                finish_reason = chunk.choices[0].finish_reason if chunk.choices else None

                if delta and delta.content:
                    yield _sse_event("text", delta.content)

                if delta and delta.tool_calls:
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

                if finish_reason == "tool_calls":
                    for idx, tc_data in tool_calls_buffer.items():
                        if tc_data["name"] == "create_canva_design":
                            try:
                                args = json.loads(tc_data["arguments"])
                                design_type = args.get("design_type", "doc")
                                title = args.get("title", prompt[:50])

                                if create_design_fn:
                                    try:
                                        design = await create_design_fn(
                                            design_type=design_type,
                                            title=title,
                                        )
                                        design_url = {
                                            "designId": design.id,
                                            "editUrl": design.edit_url,
                                            "viewUrl": design.view_url,
                                            "contentType": design_type.upper(),
                                            "title": title,
                                            "thumbnailUrl": design.thumbnail_url,
                                            "createdAt": design.created_at,
                                        }
                                        yield _sse_event("design_url", design_url)
                                        yield _sse_event("text", f"\n\nCanva-da \"{title}\" mövzusunda {design_type} dizaynı hazırlandı. Dizaynı redaktə etmək üçün yuxarıdakı linkə keçin.")
                                    except Exception as e:
                                        yield _sse_event("error", f"Canva dizaynı hazırlana bilmədi: {str(e)}")
                                else:
                                    design_id = str(uuid.uuid4())[:8]
                                    design_url = {
                                        "designId": design_id,
                                        "editUrl": f"https://canva.com/design/{design_id}/edit",
                                        "contentType": design_type.upper(),
                                        "title": title,
                                    }
                                    yield _sse_event("design_url", design_url)
                                    yield _sse_event("text", f"\n\nCanva-da \"{title}\" mövzusunda {design_type} dizaynı hazırlandı. Dizaynı redaktə etmək üçün linkə keçin.")

                            except json.JSONDecodeError:
                                yield _sse_event("error", "Dizayn parametrlərini oxumaq mümkün olmadı.")

            yield _sse_done()

        except Exception as e:
            yield _sse_event("error", f"Süni intellekt xətası: {str(e)}")
            yield _sse_done()
