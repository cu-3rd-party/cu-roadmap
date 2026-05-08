import pytest
from uuid import uuid4

from src.services.planner_service import PlannerService
from src.stores.base import (
    CourseTypeEnum,
    CourseCategoryEnum,
    DependencyTypeEnum,
)


@pytest.mark.asyncio
async def test_get_all_courses(store_with_courses):
    store, course1, course2, course3, _ = store_with_courses

    planner = PlannerService(store)
    courses = await planner.get_all_courses()

    assert len(courses) == 3
    assert course1.id in courses
    assert course2.id in courses
    assert course3.id in courses


@pytest.mark.asyncio
async def test_find_path_to_course_prerequisite_chain(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    planner = PlannerService(store)
    path = await planner.find_path_to_course(
        target_course_id=course2.id,
        passed_ids=set(),
        current_semester=1,
        max_load=12.0,
    )

    assert len(path) > 0
    assert path[0]["semester"] == 1


@pytest.mark.asyncio
async def test_find_path_to_course_already_passed(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    planner = PlannerService(store)
    path = await planner.find_path_to_course(
        target_course_id=course1.id,
        passed_ids={course1.id},
        current_semester=1,
        max_load=12.0,
    )

    assert isinstance(path, list)


@pytest.mark.asyncio
async def test_find_path_to_course_not_found(memory_store):
    planner = PlannerService(memory_store)
    path = await planner.find_path_to_course(
        target_course_id=uuid4(),
        passed_ids=set(),
        current_semester=1,
        max_load=12.0,
    )

    assert len(path) == 1
    assert "error" in path[0]


@pytest.mark.asyncio
async def test_find_path_to_course_with_workload_limit(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    planner = PlannerService(store)
    path = await planner.find_path_to_course(
        target_course_id=course2.id,
        passed_ids=set(),
        current_semester=1,
        max_load=4.0,
    )

    assert len(path) > 0


@pytest.mark.asyncio
async def test_find_path_to_course_with_passed_prereqs(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    planner = PlannerService(store)
    path = await planner.find_path_to_course(
        target_course_id=course2.id,
        passed_ids={course1.id},
        current_semester=1,
        max_load=12.0,
    )

    assert len(path) > 0


@pytest.mark.asyncio
async def test_goal_path_endpoint(store_with_courses):
    store, course1, course2, course3, _ = store_with_courses

    planner = PlannerService(store)
    path = await planner.find_path_to_course(
        target_course_id=course2.id,
        passed_ids=set(),
        current_semester=1,
        max_load=12.0,
    )

    assert isinstance(path, list)
    assert len(path) > 0
    assert "semester" in path[0]