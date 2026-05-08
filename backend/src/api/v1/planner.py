from fastapi import APIRouter
from src.domain.schemas.goal_path_request import GoalPathRequest
from src.domain.schemas.roadmap_validation_request import RoadmapValidationRequest
from src.domain.schemas.semester.semester_validation_request import (
    SemesterValidationRequest,
)
from src.domain.schemas.planner_request import PlannerRequest
from src.services.engine2.generator import GreedyPlanner
from src.services.validation_service import RoadmapValidator
from src.services.planner_service import PlannerService
from src.stores.factory import get_store

router = APIRouter()


@router.post("/generate")
async def generate_roadmap(req: PlannerRequest):
    store = await get_store()
    planner = GreedyPlanner(store)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=req.passed_course_ids,
        major_id=req.major_id,
        current_semester=req.current_semester,
        max_load=req.max_load,
    )
    return {"major_id": str(req.major_id), "roadmap": roadmap}


@router.post("/validate-semester/")
async def validate_semester(req: SemesterValidationRequest):
    """Scenario 2: Manual Semester Planning - Validate a single semester selection."""
    store = await get_store()
    planner_service = PlannerService(store)
    all_courses = await planner_service.get_all_courses()

    validator = await RoadmapValidator.create_from_store(store)
    courses = [all_courses[cid] for cid in req.course_ids if cid in all_courses]

    result = validator.validate_semester(
        courses_in_sem=courses,
        previously_passed_ids=set(req.passed_course_ids),
        current_sem_num=req.current_semester,
        max_load=req.max_load,
    )
    return result


@router.post("/validate-roadmap/")
async def validate_roadmap(req: RoadmapValidationRequest):
    """Scenario 3: The Strict Validator - Validate a full proposed roadmap."""
    store = await get_store()
    planner_service = PlannerService(store)
    await planner_service.get_all_courses()

    validator = await RoadmapValidator.create_from_store(store)
    results = validator.validate_full_roadmap(
        roadmap_data=req.roadmap,
        initial_passed_ids=set(req.passed_course_ids),
        max_load=req.max_load,
    )
    return {"validation_results": results}


@router.post("/goal-path/")
async def get_goal_path(req: GoalPathRequest):
    """Scenario 4: Goal-Oriented Planning - Plan towards a specific course."""
    planner_service = PlannerService()
    path = await planner_service.find_path_to_course(
        target_course_id=req.target_course_id,
        passed_ids=set(req.passed_course_ids),
        current_semester=req.current_semester,
        max_load=req.max_load,
    )
    return {"roadmap": path}


@router.get("/test-engine2")
async def test_engine2():
    store = await get_store()
    all_students = await store.get_all_students()

    if not all_students:
        return {"error": "No mock students found. Please run mock_data.py"}

    # Get the first student
    student = next(iter(all_students.values()))

    planner = GreedyPlanner(store)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=student.passed_course_ids,
        major_id=student.target_major_id,
        current_semester=student.current_semester,
        max_load=12.0,
    )

    return {
        "student_id": str(student.id),
        "target_major_id": str(student.target_major_id)
        if student.target_major_id
        else None,
        "current_semester": student.current_semester,
        "roadmap": roadmap,
    }
