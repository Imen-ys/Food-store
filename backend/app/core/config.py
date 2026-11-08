from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Food Store API"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    database_url: str = "sqlite:///./food_store.db"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()