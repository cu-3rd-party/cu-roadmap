import asyncio
import uuid
import sys
import os

# Add root project dir to path so we can import src.domain.models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.domain.models.requirement_type import RequirementType
from src.domain.models.course import Course
from src.domain.models.major import Major
from src.domain.models.major.major_requirement import MajorRequirement

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://roadmap_user:roadmap_password@db:5432/roadmap_db",
)
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def mock_data():
    async with async_session() as session:
        # Clear existing requirements and students
        await session.execute(MajorRequirement.__table__.delete())

        # Get courses and majors
        res_c = await session.execute(select(Course))
        courses = {c.title: c for c in res_c.scalars().all()}

        res_m = await session.execute(select(Major))
        majors = {m.title: m for m in res_m.scalars().all()}

        # 1. Define mock logic for Major Requirements
        swe_courses = [
            "Разработка на Python. Основной",
            "Разработка на Python. Углублённый",
            "Алгоритмы и структуры данных I",
            "Алгоритмы и структуры данных 2",
            "Архитектура компьютера и ОС",
            "Архитектура компьютера и ОС 2",
            "Базы данных",
            "Основы промышленной разработки",
            "Основы разработки на Go",
            "Web-разработка",
        ]

        ai_courses = [
            "Разработка на Python. Основной",
            "Разработка на Python. Углублённый",
            "Machine Learning",
            "Deep Learning",
            "Введение в ИИ",
            "Теория вероятностей и матстатистика",
            "Математическая статистика",
            "Линейная алгебра и геометрия",
            "Математический анализ",
        ]

        business_courses = [
            "Введение в экономику",
            "Основы бизнес-аналитики",
            "Основы финансов",
            "Микроэкономика I",
            "Макроэкономика I",
            "Основы маркетинга",
            "Теория игр",
            "Эконометрика I",
            "Финансы. Основной уровень",
            "Теория вероятностей и матстатистика",
            "Математическая статистика",
        ]

        common_courses = [
            "Командная работа по Agile",
            "Стресс-менеджмент",
            "Информационная безопасность",
        ]

        mapping = {
            "Software Engineering": swe_courses,
            "AI": ai_courses,
            "Business": business_courses,
            "Common (All Majors)": common_courses,
        }

        for major_title, course_titles in mapping.items():
            if major_title not in majors:
                continue
            major_id = majors[major_title].id

            for title in course_titles:
                if title in courses:
                    req = MajorRequirement(
                        major_id=major_id,
                        course_id=courses[title].id,
                        requirement_type=RequirementType.core,
                    )
                    session.add(req)

        # 2. Add Mock Student for future algorithm testing
        from src.domain.models.student.student_passed_courses import (
            student_passed_courses,
        )
        from src.domain.models.student import Student

        await session.execute(student_passed_courses.delete())
        await session.execute(Student.__table__.delete())

        student = Student(
            id=uuid.uuid4(),
            cohort=2025,
            current_semester=3,
            target_major_id=majors["Software Engineering"].id
            if "Software Engineering" in majors
            else None,
        )

        # Student passed some basic courses already
        passed_titles = [
            "Разработка на Python. Основной",
            "Архитектура компьютера и ОС",
            "Командная работа по Agile",
        ]
        for t in passed_titles:
            if t in courses:
                student.passed_courses.append(courses[t])

        session.add(student)

        await session.commit()
        print("Mock Major Requirements and Mock Student injected successfully!")


if __name__ == "__main__":
    asyncio.run(mock_data())
