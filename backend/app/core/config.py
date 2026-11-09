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

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()