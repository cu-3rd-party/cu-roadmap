import csv
from pathlib import Path
from uuid import uuid4

import pytest
import pytest_asyncio

from src.stores.memory import MemoryStore
from src.stores.base import (
    CourseData,
    CourseDependencyData,
    MajorData,
    MajorRequirementData,
    StudentData,
    CourseTypeEnum,
    CourseCategoryEnum,
    DependencyTypeEnum,
    RequirementTypeEnum,
)


def _load_courses_by_title(courses_csv_path: Path) -> dict[str, dict[str, str]]:
    with courses_csv_path.open(mode="r", encoding="utf-8") as file_obj:
        return {row["title"]: row for row in csv.DictReader(file_obj)}


def _build_sheet_rows_from_csv(courses_csv_path: Path) -> dict[str, list[dict[str, str]]]:
    csv_courses = _load_courses_by_title(courses_csv_path)

    return {
        "Разработка": [
            {
                "Название курса": "Разработка на Python. Основной",
                "Тип курса": csv_courses["Разработка на Python. Основной"]["course_type"],
                "Осень / весна": "осень",
                "Рекомендованный к прохождению семестр": "1",
                "Нагрузка": csv_courses["Разработка на Python. Основной"]["workload"],
                "Контекст": csv_courses["Разработка на Python. Основной"]["description"],
                "Силлабус если есть": "",
                "Пререквизиты": "",
                "Кореквизиты": "",
            },
            {
                "Название курса": "Разработка на Python. Углублённый",
                "Тип курса": csv_courses["Разработка на Python. Углублённый"]["course_type"],
                "Осень / весна": "осень",
                "Рекомендованный к прохождению семестр": "3",
                "Нагрузка": csv_courses["Разработка на Python. Углублённый"]["workload"],
                "Контекст": csv_courses["Разработка на Python. Углублённый"]["description"],
                "Силлабус если есть": "",
                "Пререквизиты": "Разработка на Python. Основной",
                "Кореквизиты": "",
            },
            {
                "Название курса": "Основы промышленной разработки",
                "Тип курса": csv_courses["Основы промышленной разработки"]["course_type"],
                "Осень / весна": "весна",
                "Рекомендованный к прохождению семестр": "2",
                "Нагрузка": csv_courses["Основы промышленной разработки"]["workload"],
                "Контекст": csv_courses["Основы промышленной разработки"]["description"],
                "Силлабус если есть": "",
                "Пререквизиты": "",
                "Кореквизиты": "",
            },
        ],
        "Бизнес и аналитика": [
            {
                "Название курса": "Введение в экономику",
                "Тип курса": csv_courses["Введение в экономику"]["course_type"],
                "Осень / весна": "осень",
                "Рекомендованный к прохождению семестр": "1",
                "Нагрузка": csv_courses["Введение в экономику"]["workload"],
                "Контекст": csv_courses["Введение в экономику"]["description"],
                "Силлабус если есть": "",
                "Пререквизиты": "",
                "Кореквизиты": "",
            }
        ],
    }


@pytest.fixture
def mock_google_sheets_data() -> dict[str, list[dict[str, str]]]:
    backend_dir = Path(__file__).resolve().parents[1]
    return _build_sheet_rows_from_csv(backend_dir / "courses.csv")


@pytest.fixture
def fake_google_sheets_service(mock_google_sheets_data):
    class FakeGoogleSheetsService:
        def __init__(self):
            self._data = mock_google_sheets_data

        def get_sheet_names(self):
            return list(self._data.keys())

        def get_all_relevant_sheets(self):
            return self._data

    return FakeGoogleSheetsService


@pytest_asyncio.fixture
async def integration_client(monkeypatch, fake_google_sheets_service):
    from httpx import ASGITransport, AsyncClient

    from src.main import app
    from src.settings import get_settings
    from src.stores.factory import close_store

    monkeypatch.setattr(
        "src.services.sync.google_sheets.GoogleSheetsService",
        fake_google_sheets_service,
    )
    monkeypatch.setenv("FORCE_MEMORY_STORE", "true")
    monkeypatch.setenv("SEED_ON_STARTUP", "false")
    monkeypatch.setenv("GOOGLE_SHEETS_SYNC_ENABLED", "true")
    monkeypatch.setenv("GOOGLE_SHEETS_SYNC_INTERVAL_SECONDS", "99999")
    get_settings.cache_clear()

    transport = ASGITransport(app=app)

    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client

    await close_store()
    get_settings.cache_clear()


@pytest.fixture
async def memory_store():
    store = MemoryStore()
    await store.init()
    yield store
    await store.close()


@pytest.fixture
async def store_with_courses(memory_store):
    course1 = CourseData(
        id=uuid4(),
        title="Python Basics",
        description="Intro to Python",
        handbook_link=None,
        course_type=CourseTypeEnum.mandatory,
        category=CourseCategoryEnum.tech,
        allowed_cohorts=None,
        available_semesters=[1, 2],
        recommended_semester=1,
        workload=4.0,
        csat_metric=None,
    )
    course2 = CourseData(
        id=uuid4(),
        title="Advanced Python",
        description="Advanced Python programming",
        handbook_link=None,
        course_type=CourseTypeEnum.mandatory,
        category=CourseCategoryEnum.tech,
        allowed_cohorts=None,
        available_semesters=[3, 4],
        recommended_semester=3,
        workload=5.0,
        csat_metric=None,
    )
    course3 = CourseData(
        id=uuid4(),
        title="Algorithms",
        description="Algorithms and data structures",
        handbook_link=None,
        course_type=CourseTypeEnum.mandatory,
        category=CourseCategoryEnum.stem,
        allowed_cohorts=None,
        available_semesters=[1, 3],
        recommended_semester=2,
        workload=6.0,
        csat_metric=None,
    )

    await memory_store.create_course(course1)
    await memory_store.create_course(course2)
    await memory_store.create_course(course3)

    dep1 = CourseDependencyData(
        id=uuid4(),
        course_id=course2.id,
        required_course_id=course1.id,
        dependency_type=DependencyTypeEnum.prerequisite,
    )
    await memory_store.create_course_dependency(dep1)

    return memory_store, course1, course2, course3, dep1


@pytest.fixture
async def store_with_major(memory_store):
    major = MajorData(
        id=uuid4(),
        title="Software Engineering",
        school="Tech",
    )
    await memory_store.create_major(major)
    return memory_store, major


@pytest.fixture
async def store_with_full_data(store_with_courses, store_with_major):
    store, course1, course2, course3, dep1 = store_with_courses
    _, major = store_with_major

    req1 = MajorRequirementData(
        id=uuid4(),
        major_id=major.id,
        course_id=course1.id,
        requirement_type=RequirementTypeEnum.core,
    )
    req2 = MajorRequirementData(
        id=uuid4(),
        major_id=major.id,
        course_id=course2.id,
        requirement_type=RequirementTypeEnum.core,
    )
    await store.create_major_requirement(req1)
    await store.create_major_requirement(req2)

    return store, major, course1, course2, course3


@pytest.fixture
async def store_with_student(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    student = StudentData(
        id=uuid4(),
        cohort=2025,
        current_semester=3,
        target_major_id=major.id,
        passed_course_ids=[course1.id],
    )
    await store.create_student(student)
    return store, student, major, course1, course2, course3
