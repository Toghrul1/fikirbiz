"""
FikirBiz Backend — Application Settings.

Pydantic BaseSettings ilə .env faylından konfiqurasiya oxunur.
"""

from pydantic_settings import BaseSettings
from typing import Optional


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

    # Canva OAuth
    CANVA_CLIENT_ID: Optional[str] = None
    CANVA_CLIENT_SECRET: Optional[str] = None
    CANVA_REDIRECT_URI: str = "http://localhost:8000/api/auth/canva/callback"

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"

    # App
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    DEBUG: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
