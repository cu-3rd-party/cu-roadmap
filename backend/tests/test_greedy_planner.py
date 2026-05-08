import pytest
from uuid import uuid4

from src.services.engine2.generator import GreedyPlanner
from src.stores.base import (
    CourseTypeEnum,
    CourseCategoryEnum,
    DependencyTypeEnum,
    RequirementTypeEnum,
)


@pytest.mark.asyncio
async def test_generate_roadmap_basic(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    planner = GreedyPlanner(store)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=[],
        major_id=major.id,
        current_semester=1,
        max_load=12.0,
    )

    assert isinstance(roadmap, list)
    assert len(roadmap) > 0


@pytest.mark.asyncio
async def test_generate_roadmap_with_passed_courses(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    planner = GreedyPlanner(store)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=[course1.id],
        major_id=major.id,
        current_semester=3,
        max_load=12.0,
    )

    assert isinstance(roadmap, list)


@pytest.mark.asyncio
async def test_generate_roadmap_major_not_found(memory_store):
    planner = GreedyPlanner(memory_store)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=[],
        major_id=uuid4(),
        current_semester=1,
        max_load=12.0,
    )

    assert isinstance(roadmap, dict)
    assert "error" in roadmap


@pytest.mark.asyncio
async def test_generate_roadmap_respects_max_load(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    planner = GreedyPlanner(store)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=[],
        major_id=major.id,
        current_semester=1,
        max_load=4.0,
    )

    for semester in roadmap:
        if "total_load" in semester:
            assert semester["total_load"] <= 4.0


@pytest.mark.asyncio
async def test_generate_roadmap_empty_major(store_with_courses):
    store, course1, course2, course3, _ = store_with_courses

    new_major_id = uuid4()

    planner = GreedyPlanner(store)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=[],
        major_id=new_major_id,
        current_semester=1,
        max_load=12.0,
    )

    assert isinstance(roadmap, dict)
    assert "error" in roadmap


@pytest.mark.asyncio
async def test_generate_roadmap_no_courses_todo(store_with_full_data):
    store, major, course1, course2, course3 = store_with_full_data

    planner = GreedyPlanner(store)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=[course1.id, course2.id],
        major_id=major.id,
        current_semester=1,
        max_load=12.0,
    )

    assert isinstance(roadmap, list)