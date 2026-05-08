import pytest
from uuid import uuid4

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