from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    postgres_user: str = "roadmap_user"
    postgres_password: str = "roadmap_password"
    postgres_db: str = "roadmap_db"

    seed_on_startup: bool = True
    use_memory_store: bool = False
    force_memory_store: bool = False

    google_sheets_spreadsheet_id: str = ""
    google_service_account_file: str = "credentials/google_service_account.json"
    google_sheets_sync_sheets: str = (
        "Бизнес и аналитика,Искусственный интеллект,Разработка"
    )
    google_sheets_sync_enabled: bool = True
    google_sheets_sync_interval_seconds: int = 3600

    host: str = "127.0.0.1"
    port: int = 8000
    log_level: str = "INFO"

    @computed_field
    @property
    def db_url(self) -> str:
        return (
            "postgresql+asyncpg://"
            f"{self.postgres_user}:{self.postgres_password}"
            f"@127.0.0.1:5432/{self.postgres_db}"
        )

    @property
    def google_sheets_sync_sheet_names(self) -> list[str]:
        return [
            name.strip()
            for name in self.google_sheets_sync_sheets.split(",")
            if name.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
