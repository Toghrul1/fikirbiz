"""
FikirBiz Backend — Email Service.

FastAPI-Mail ilə async e-poçt göndərmə və tenacity retry.
"""

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings

# Əgər SMTP_USER yoxdursa (məsələn, mock mode), suppress_send=True edirik ki, konsola yazsın.
conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER or "",
    MAIL_PASSWORD=settings.SMTP_PASSWORD or "",
    MAIL_FROM=settings.SMTP_FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.SMTP_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=bool(settings.SMTP_USER),
    VALIDATE_CERTS=True,
    SUPPRESS_SEND=not bool(settings.SMTP_USER),
)

fm = FastMail(conf)


class EmailService:
    """E-poçt xidməti."""

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def send_welcome_email(to_email: str, first_name: str) -> None:
        """Yeni qeydiyyatdan keçənlər üçün salamlama məktubu."""
        body = f"Salam {first_name},\n\nFikirBiz platformasına xoş gəlmisiniz!"
        
        message = MessageSchema(
            subject="FikirBiz-ə Xoş Gəlmisiniz!",
            recipients=[to_email],
            body=body,
            subtype=MessageType.plain,
        )
        
        await fm.send_message(message)

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def send_password_reset_email(to_email: str, reset_link: str) -> None:
        """Şifrə sıfırlama məktubu."""
        body = (
            "Salam,\n\n"
            "Şifrənizi sıfırlamaq üçün aşağıdakı linkə klikləyin. Bu link 30 dəqiqə ərzində etibarlıdır.\n\n"
            f"{reset_link}\n\n"
            "Əgər bu sorğunu siz göndərməmisinizsə, məktuba məhəl qoymayın."
        )
        
        message = MessageSchema(
            subject="FikirBiz - Şifrə Sıfırlama",
            recipients=[to_email],
            body=body,
            subtype=MessageType.plain,
        )
        
        await fm.send_message(message)
