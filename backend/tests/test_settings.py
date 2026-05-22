from src.settings import Settings


def test_db_url_uses_local_postgres_host():
    settings = Settings(
        postgres_user="roadmap_user",
        postgres_password="roadmap_password",
        postgres_db="roadmap_db",
    )

    assert (
        settings.db_url
        == "postgresql+asyncpg://roadmap_user:roadmap_password@127.0.0.1:5432/roadmap_db"
    )


def test_google_sheet_names_are_parsed():
    settings = Settings(google_sheets_sync_sheets="Sheet A, Sheet B ,, Sheet C")

    assert settings.google_sheets_sync_sheet_names == ["Sheet A", "Sheet B", "Sheet C"]
