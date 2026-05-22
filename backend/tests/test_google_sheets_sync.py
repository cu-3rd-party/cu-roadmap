import pytest

from src.services.sync.google_sheets import GoogleSheetsService
from src.stores.memory import MemoryStore


def test_get_sheet_names_from_env(monkeypatch):
    monkeypatch.setenv("GOOGLE_SHEETS_SYNC_SHEETS", " Sheet A, Sheet B ,, Sheet C ")
    service = GoogleSheetsService.__new__(GoogleSheetsService)

    assert service.get_sheet_names() == ["Sheet A", "Sheet B", "Sheet C"]


@pytest.mark.asyncio
async def test_memory_store_sync_google_sheets_data(monkeypatch):
    class FakeGoogleSheetsService:
        def get_all_relevant_sheets(self):
            return {
                "Разработка": [
                    {
                        "Название курса": "Python Basics",
                        "Тип курса": "mandatory",
                        "Осень / весна": "осень",
                        "Рекомендованный к прохождению семестр": "1",
                        "Нагрузка": "4",
                        "Контекст": "Intro",
                        "Силлабус если есть": "https://example.com/python",
                        "Пререквизиты": "",
                        "Кореквизиты": "",
                    },
                    {
                        "Название курса": "Advanced Python",
                        "Тип курса": "mandatory",
                        "Осень / весна": "весна",
                        "Рекомендованный к прохождению семестр": "2",
                        "Нагрузка": "5",
                        "Контекст": "Advanced",
                        "Силлабус если есть": "",
                        "Пререквизиты": "Python Basics",
                        "Кореквизиты": "",
                    },
                ]
            }

    monkeypatch.setattr(
        "src.services.sync.google_sheets.GoogleSheetsService",
        FakeGoogleSheetsService,
        raising=False,
    )

    store = MemoryStore()
    await store.init()

    await store.sync_google_sheets_data()

    courses = await store.get_all_courses()
    majors = await store.get_all_majors()
    dependencies = await store.get_course_dependencies()

    assert len(courses) == 2
    assert len(majors) == 1
    assert len(dependencies) == 1
    assert {course.title for course in courses.values()} == {"Python Basics", "Advanced Python"}
    assert next(iter(majors.values())).title == "Software Engineering"

    await store.close()
