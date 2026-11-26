from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Food Store API"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    database_url: str = "sqlite:///./food_store.db"

    # Authentication
    secret_key: str  # no default on purpose: the app refuses to start without it
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    cookie_secure: bool = False
    # "lax" locally. In production (frontend and backend on different sites): "none"
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    # Image storage (empty = save images on the local disk)
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    model_config = SettingsConfigDict(env_file=".env")

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        """Accept Neon's 'postgresql://' and make SQLAlchemy use psycopg."""
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value[len(prefix):]
        return value


settings = Settings()