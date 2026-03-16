from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    database_url: str = "postgresql://quran:quran@localhost:5432/quran_learner"

    # Auth
    secret_key: str = "dev-secret-key-change-in-prod"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # App
    environment: str = "development"
    allowed_origins: list[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
    ]


settings = Settings()
