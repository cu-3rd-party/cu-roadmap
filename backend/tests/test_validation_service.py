import pytest
from uuid import uuid4

from src.services.validation_service import RoadmapValidator
from src.stores.base import (
    CourseData,
    CourseDependencyData,
    CourseTypeEnum,
    CourseCategoryEnum,
    DependencyTypeEnum,
)


def create_course(
    course_id=None,
    title="Test Course",
    workload=5.0,
    available_semesters=None,
):
    if course_id is None:
        course_id = uuid4()
    if available_semesters is None:
        available_semesters = [1, 2]
    return CourseData(
        id=course_id,
        title=title,
        description=None,
        handbook_link=None,
        course_type=CourseTypeEnum.mandatory,
        category=CourseCategoryEnum.tech,
        allowed_cohorts=None,
        available_semesters=available_semesters,
        recommended_semester=None,
        workload=workload,
        csat_metric=None,
    )


def create_prereq(course_id, required_course_id):
    return CourseDependencyData(
        id=uuid4(),
        course_id=course_id,
        required_course_id=required_course_id,
        dependency_type=DependencyTypeEnum.prerequisite,
    )


@pytest.mark.asyncio
async def test_validate_semester_valid(store_with_courses):
    store, course1, course2, course3, _ = store_with_courses

    all_courses = await store.get_all_courses()
    validator = RoadmapValidator(all_courses)
    await validator.load_dependencies(store)

    result = validator.validate_semester(
        courses_in_sem=[course1],
        previously_passed_ids=set(),
        current_sem_num=1,
        max_load=12.0,
    )

    assert result.is_valid is True


@pytest.mark.asyncio
async def test_validate_semester_workload_exceeded(store_with_courses):
    store, course1, course2, course3, _ = store_with_courses

    all_courses = await store.get_all_courses()
    validator = RoadmapValidator(all_courses)
    await validator.load_dependencies(store)

    result = validator.validate_semester(
        courses_in_sem=[course1, course2],
        previously_passed_ids=set(),
        current_sem_num=1,
        max_load=4.0,
    )

    assert result.is_valid is False
    assert len(result.messages) > 0


@pytest.mark.asyncio
async def test_validate_semester_wrong_semester_offering(store_with_courses):
    store, course1, course2, course3, _ = store_with_courses

    all_courses = await store.get_all_courses()
    validator = RoadmapValidator(all_courses)
    await validator.load_dependencies(store)

    result = validator.validate_semester(
        courses_in_sem=[course2],
        previously_passed_ids=set(),
        current_sem_num=1,
        max_load=12.0,
    )

    assert result.is_valid is False
    error_messages = [m.message for m in result.messages if m.level == "error"]
    assert len(error_messages) > 0


@pytest.mark.asyncio
async def test_validate_semester_missing_prerequisite(store_with_courses):
    store, course1, course2, course3, _ = store_with_courses

    all_courses = await store.get_all_courses()
    validator = RoadmapValidator(all_courses)
    await validator.load_dependencies(store)

    result = validator.validate_semester(
        courses_in_sem=[course2],
        previously_passed_ids=set(),
        current_sem_num=1,
        max_load=12.0,
    )

    assert result.is_valid is False
    assert any("пререквизит" in m.message for m in result.messages)


@pytest.mark.asyncio
async def test_validate_semester_passed_prerequisite(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    all_courses = await store.get_all_courses()
    validator = RoadmapValidator(all_courses)
    await validator.load_dependencies(store)

    result = validator.validate_semester(
        courses_in_sem=[course2],
        previously_passed_ids={course1.id},
        current_sem_num=1,
        max_load=12.0,
    )

    assert result.is_valid is True


@pytest.mark.asyncio
async def test_validate_full_roadmap_valid(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    all_courses = await store.get_all_courses()
    validator = RoadmapValidator(all_courses)
    await validator.load_dependencies(store)

    roadmap = [
        {"semester": 1, "course_ids": [course1.id]},
        {"semester": 3, "course_ids": [course2.id]},
    ]

    results = validator.validate_full_roadmap(
        roadmap_data=roadmap,
        initial_passed_ids=set(),
        max_load=12.0,
    )

    assert len(results) == 2


@pytest.mark.asyncio
async def test_validate_full_roadmap_missing_prereq(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    all_courses = await store.get_all_courses()
    validator = RoadmapValidator(all_courses)
    await validator.load_dependencies(store)

    roadmap = [
        {"semester": 1, "course_ids": [course2.id]},
    ]

    results = validator.validate_full_roadmap(
        roadmap_data=roadmap,
        initial_passed_ids=set(),
        max_load=12.0,
    )

    assert results[0]["valid"] is False


@pytest.mark.asyncio
async def test_create_from_store(store_with_courses):
    store, _, _, _, _ = store_with_courses

    validator = await RoadmapValidator.create_from_store(store)
    assert validator is not None
    assert len(validator.all_courses) == 3