import asyncio
import csv
import uuid
import sys
import os

# Add root project dir to path so we can import src.domain.models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.domain.models import (
    Base,
    Course,
    Major,
    CourseDependency,
    CourseType,
    CourseCategory,
    DependencyType,
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://roadmap_user:roadmap_password@db:5432/roadmap_db",
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def parse_semesters(sem_str):
    return [int(s.strip()) for s in sem_str.split(",") if s.strip()]


async def ingest():
    async with engine.begin() as conn:
        print("Recreating database tables...")
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    course_map = {}
    major_map = {}

    async with async_session() as session:
        print("Ingesting courses...")
        with open("courses.csv", mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                uid = uuid.uuid4()
                course_map[row["id"]] = uid
                course = Course(
                    id=uid,
                    title=row["title"],
                    description=row["description"],
                    available_semesters=parse_semesters(row["available_semesters"]),
                    course_type=CourseType(row["course_type"]),
                    category=CourseCategory(row["category"]),
                    workload=float(row["workload"]),
                )
                session.add(course)

        print("Ingesting majors...")
        with open("majors.csv", mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                uid = uuid.uuid4()
                major_map[row["id"]] = uid
                major = Major(
                    id=uid,
                    title=row["title"],
                    school="Tech"
                    if "AI" in row["title"] or "Software" in row["title"]
                    else "Business",
                )
                session.add(major)

        print("Ingesting course dependencies...")
        with open("course_dependencies.csv", mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Handle cases where dependent course might not exist in CSV if skipped
                if (
                    row["course_id"] in course_map
                    and row["required_course_id"] in course_map
                ):
                    dep = CourseDependency(
                        course_id=course_map[row["course_id"]],
                        required_course_id=course_map[row["required_course_id"]],
                        dependency_type=DependencyType(row["dependency_type"]),
                    )
                    session.add(dep)

        await session.commit()
    print("Ingestion complete!")


if __name__ == "__main__":
    asyncio.run(ingest())
