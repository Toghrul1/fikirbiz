"""
FikirBiz — Pydantic Request/Response Schemas.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ─── Auth Schemas ────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    first_name: str = Field(..., max_length=50, min_length=1)
    last_name: str = Field(..., max_length=50, min_length=1)
    email: EmailStr = Field(..., max_length=254)
    password: str = Field(..., min_length=8)
    plan: str = Field(default="basic", max_length=10)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8)


class AuthResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    plan: str = "basic"


class MessageResponse(BaseModel):
    message: str


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    detail: ErrorDetail


class LockedResponse(BaseModel):
    detail: ErrorDetail
    locked_until: datetime


# ─── Admin Schemas ───────────────────────────────────────────────────

class UserTableRow(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    registered_at: datetime
    last_login_at: Optional[datetime] = None
    is_active: bool

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: list[UserTableRow]
    total: int
    page: int
    page_size: int


class AdminAnalytics(BaseModel):
    total_users: int
    new_users_today: int
    active_sessions_count: int


# ─── Customer Schemas ────────────────────────────────────────────────

class CustomerProfile(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    registered_at: datetime
    canva_connector_status: str = "disconnected"
    active_chat_session_count: int = 0

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50, min_length=1)
    last_name: Optional[str] = Field(None, max_length=50, min_length=1)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class DeleteAccountRequest(BaseModel):
    current_password: str


# ─── Chat / Canva Schemas ───────────────────────────────────────────

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    session_id: str
    message_history: list[dict] = []
    canva_access_token: Optional[str] = None


# ─── Content Generator Schemas ──────────────────────────────────────

class ContentGenerateRequest(BaseModel):
    language: str = Field(default="English", max_length=50)
    product_service_topic: str = Field(..., min_length=1, max_length=500)
    brand_name: Optional[str] = Field(None, max_length=100)
    key_features: Optional[str] = Field(None, max_length=1000)
    target_audience: Optional[str] = Field(None, max_length=500)
    call_to_action: Optional[str] = Field(None, max_length=200)


class InstagramPost(BaseModel):
    title: str = ""
    caption: str
    visual_suggestion: str = ""
    hashtags: list[str]


class InstagramReels(BaseModel):
    script: str
    caption: str
    hashtags: list[str]


class GeneratedContent(BaseModel):
    post: InstagramPost
    reels: InstagramReels


class ContentGenerateResponse(BaseModel):
    success: bool
    content: GeneratedContent
    language: str
