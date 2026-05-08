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


@pytest.mark.asyncio
async def test_store_init_and_close():
    store = MemoryStore()
    await store.init()
    await store.close()


@pytest.mark.asyncio
async def test_create_and_get_course(memory_store):
    course = CourseData(
        id=uuid4(),
        title="Test Course",
        description="A test course",
        handbook_link="http://example.com",
        course_type=CourseTypeEnum.mandatory,
        category=CourseCategoryEnum.tech,
        allowed_cohorts=[2024, 2025],
        available_semesters=[1, 2],
        recommended_semester=1,
        workload=5.0,
        csat_metric=4.5,
    )

    created = await memory_store.create_course(course)
    assert created == course

    retrieved = await memory_store.get_course_by_id(course.id)
    assert retrieved is not None
    assert retrieved.id == course.id
    assert retrieved.title == "Test Course"
    assert retrieved.workload == 5.0


@pytest.mark.asyncio
async def test_get_all_courses(store_with_courses):
    store, _, _, _, _ = store_with_courses
    courses = await store.get_all_courses()
    assert len(courses) == 3


@pytest.mark.asyncio
async def test_get_course_by_id_not_found(memory_store):
    result = await memory_store.get_course_by_id(uuid4())
    assert result is None


@pytest.mark.asyncio
async def test_create_and_get_major(memory_store):
    major = MajorData(
        id=uuid4(),
        title="AI Engineering",
        school="Tech",
    )

    created = await memory_store.create_major(major)
    assert created == major

    retrieved = await memory_store.get_major_by_id(major.id)
    assert retrieved is not None
    assert retrieved.title == "AI Engineering"
    assert retrieved.school == "Tech"


@pytest.mark.asyncio
async def test_get_all_majors(store_with_major):
    store, _ = store_with_major
    majors = await store.get_all_majors()
    assert len(majors) == 1


@pytest.mark.asyncio
async def test_get_major_by_id_not_found(memory_store):
    result = await memory_store.get_major_by_id(uuid4())
    assert result is None


@pytest.mark.asyncio
async def test_create_and_get_course_dependency(store_with_courses):
    store, course1, course2, _, _ = store_with_courses

    deps = await store.get_course_dependencies()
    assert len(deps) == 1
    assert deps[0].course_id == course2.id
    assert deps[0].required_course_id == course1.id


@pytest.mark.asyncio
async def test_create_and_get_major_requirement(store_with_full_data):
    store, major, course1, course2, _ = store_with_full_data

    reqs = await store.get_major_requirements(major.id)
    assert len(reqs) == 2


@pytest.mark.asyncio
async def test_get_major_requirements_empty(memory_store):
    major = MajorData(id=uuid4(), title="Empty Major", school="Test")
    await memory_store.create_major(major)

    reqs = await memory_store.get_major_requirements(major.id)
    assert len(reqs) == 0


@pytest.mark.asyncio
async def test_create_and_get_student(store_with_full_data):
    store, major, course1, _, _ = store_with_full_data

    student = StudentData(
        id=uuid4(),
        cohort=2025,
        current_semester=3,
        target_major_id=major.id,
        passed_course_ids=[course1.id],
    )

    created = await store.create_student(student)
    assert created == student

    retrieved = await store.get_student_by_id(student.id)
    assert retrieved is not None
    assert retrieved.cohort == 2025
    assert retrieved.current_semester == 3


@pytest.mark.asyncio
async def test_get_all_students(store_with_student):
    store, _, _, _, _, _ = store_with_student
    students = await store.get_all_students()
    assert len(students) == 1


@pytest.mark.asyncio
async def test_update_student(store_with_student):
    store, student, _, _, _, _ = store_with_student

    updated_student = StudentData(
        id=student.id,
        cohort=2025,
        current_semester=5,
        target_major_id=student.target_major_id,
        passed_course_ids=[*student.passed_course_ids, uuid4()],
    )

    result = await store.update_student(updated_student)
    assert result.current_semester == 5
    assert len(result.passed_course_ids) == 2


@pytest.mark.asyncio
async def test_clear_all(memory_store):
    course = CourseData(
        id=uuid4(),
        title="To Be Cleared",
        description=None,
        handbook_link=None,
        course_type=CourseTypeEnum.optional,
        category=CourseCategoryEnum.soft,
        allowed_cohorts=None,
        available_semesters=[1],
        recommended_semester=None,
        workload=3.0,
        csat_metric=None,
    )
    await memory_store.create_course(course)

    courses = await memory_store.get_all_courses()
    assert len(courses) == 1

    await memory_store.clear_all()

    courses = await memory_store.get_all_courses()
    assert len(courses) == 0