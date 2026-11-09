from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Data a visitor sends to register. Note: no 'role' field."""

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, pattern=r"^\+?[0-9 ]{8,15}$")
    password: str = Field(min_length=8, max_length=72)


class UserRead(BaseModel):
    """Data the API returns. Note: no password, not even the hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: str | None = None
    role: str
    is_active: bool
    created_at: datetime