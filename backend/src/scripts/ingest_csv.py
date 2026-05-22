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
)
from src.domain.models.course.course_type import CourseType
from src.domain.models.course.course_category import CourseCategory
from src.domain.models.dependency_type import DependencyType
from src.domain.models.course import Course
from src.domain.models.course.course_dependency import CourseDependency
from src.domain.models.major import Major
from src.settings import get_settings

DATABASE_URL = get_settings().db_url

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def parse_semesters(sem_str):
    return [int(s.strip()) for s in sem_str.split(",") if s.strip()]


def compute_longest_prereq_depth(course_id, deps_by_course, visited, memo):
    if course_id in memo:
        return memo[course_id]
    if course_id in visited:
        memo[course_id] = 0
        return 0
    visited.add(course_id)
    prereqs = deps_by_course.get(course_id, [])
    if not prereqs:
        memo[course_id] = 0
    else:
        max_depth = max(
            compute_longest_prereq_depth(p, deps_by_course, visited, memo)
            for p in prereqs
        )
        memo[course_id] = max_depth + 1
    visited.remove(course_id)
    return memo[course_id]


def calculate_recommended_semesters(courses_csv_path, deps_csv_path):
    courses = {}
    with open(courses_csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            courses[row["id"]] = {
                "semesters": parse_semesters(row["available_semesters"]),
            }

    deps_by_course = {}
    with open(deps_csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = row["course_id"]
            if row["dependency_type"] == "prerequisite":
                deps_by_course.setdefault(cid, []).append(row["required_course_id"])

    memo = {}
    for cid in courses:
        compute_longest_prereq_depth(cid, deps_by_course, set(), memo)

    recommended = {}
    for cid, depth in memo.items():
        course_sems = courses[cid]["semesters"]
        if not course_sems:
            recommended[cid] = depth + 1
            continue
        first_avail = course_sems[0]
        if first_avail % 2 == 1 and first_avail <= depth + 1:
            rec = depth + 1 if (depth + 1) % 2 == 1 else depth + 2
        elif first_avail % 2 == 0 and first_avail <= depth + 1:
            rec = depth + 1 if (depth + 1) % 2 == 0 else depth + 2
        else:
            rec = depth + 1
        rec = max(rec, first_avail)
        recommended[cid] = rec

    return recommended


async def ingest():
    async with engine.begin() as conn:
        print("Recreating database tables...")
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    courses_csv = os.path.join(script_dir, "../../courses.csv")
    deps_csv = os.path.join(script_dir, "../../course_dependencies.csv")
    majors_csv = os.path.join(script_dir, "../../majors.csv")
    recommended = calculate_recommended_semesters(courses_csv, deps_csv)

    course_map = {}
    major_map = {}

    async with async_session() as session:
        print("Ingesting courses...")
        with open(courses_csv, mode="r", encoding="utf-8") as f:
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
                    recommended_semester=recommended.get(row["id"]),
                )
                session.add(course)

        print("Ingesting majors...")
        with open(majors_csv, mode="r", encoding="utf-8") as f:
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
        with open(deps_csv, mode="r", encoding="utf-8") as f:
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
