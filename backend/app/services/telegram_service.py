"""
FikirBiz Backend — Telegram Notification Service.

Yeni istifadəçi qeydiyyatı zamanı adminə Telegram üzərindən bildiriş göndərilməsi.
"""

import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class TelegramService:
    @staticmethod
    async def send_new_registration_notice(
        first_name: str, last_name: str, email: str
    ) -> bool:
        """Yeni istifadəçi qeydiyyatı haqda Telegram admininə bildiriş göndərir."""
        if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_ADMIN_CHAT_ID:
            logger.info("Telegram bot token və ya chat ID təyin olunmayıb, bildiriş ötürülür.")
            return False

        message = (
            f"🔔 *Yeni İstifadəçi Qeydiyyatı! (Təsdiq Gözləyir)*\n\n"
            f"👤 *Ad Soyad:* {first_name} {last_name}\n"
            f"📧 *Email:* {email}\n"
            f"📌 *Status:* Admin Təsdiqi Gözləyir\n\n"
            f"Lütfən admin panelinə daxil olaraq təsdiq/rədd əməliyyatını icra edin."
        )

        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": settings.TELEGRAM_ADMIN_CHAT_ID,
            "text": message,
            "parse_mode": "Markdown",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    logger.info(f"Telegram bildirişi uğurla göndərildi: {email}")
                    return True
                else:
                    logger.warning(
                        f"Telegram API xətası: status={res.status_code}, content={res.text}"
                    )
                    return False
        except Exception as exc:
            logger.error(f"Telegram bildirişi göndərilərkən istisna baş verdi: {exc}")
            return False
