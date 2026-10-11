"""
FikirBiz Backend — Application Settings.

Pydantic BaseSettings ilə .env faylından konfiqurasiya oxunur.
"""

from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional


_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    # Verilənlər bazası
    DATABASE_URL: str = "sqlite+aiosqlite:///./fikirbiz.db"

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # SMTP (e-poçt)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@fikirbiz.com"
    SMTP_FROM_NAME: str = "FikirBiz"

    # Telegram Bot Notification
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_ADMIN_CHAT_ID: Optional[str] = None

    # Canva OAuth
    CANVA_CLIENT_ID: Optional[str] = None
    CANVA_CLIENT_SECRET: Optional[str] = None
    CANVA_REDIRECT_URI: str = "http://localhost:8000/api/auth/canva/callback"

    # İlk admin bootstrap (yeni/boş bazada admin panelinin işləməsi üçün)
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None
    ADMIN_FIRST_NAME: Optional[str] = None
    ADMIN_LAST_NAME: Optional[str] = None

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"

    # Mistral AI (ensemble üçün)
    MISTRAL_API_KEY: Optional[str] = None
    MISTRAL_MODEL: str = "mistral-large-latest"

    # Cloudflare Workers AI (FLUX.1 schnell image generation)
    CLOUDFLARE_API_TOKEN: Optional[str] = None
    CLOUDFLARE_ACCOUNT_ID: Optional[str] = None
    CLOUDFLARE_IMAGE_MODEL: str = "@cf/black-forest-labs/flux-1-schnell"
    FREE_IMAGE_GENERATIONS_PER_DAY: int = 5

    # App
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    DEBUG: bool = False

    model_config = {"env_file": str(_ENV_FILE), "extra": "ignore"}

    @model_validator(mode="after")
    def _validate_secrets(self) -> "Settings":
        """Production-da zəif və ya default açarlara icazə vermir."""
        if self.DEBUG:
            return self

        weak = {
            "change-me-in-production",
            "secret",
            "",
        }
        if self.JWT_SECRET.strip() in weak or len(self.JWT_SECRET.strip()) < 32:
            raise ValueError(
                "JWT_SECRET production üçün zəif və ya default dəyərdir. "
                "`.env` faylında 32+ simvol uzunluğunda təsadüfi açıq təyin edin."
            )
        return self


settings = Settings()
