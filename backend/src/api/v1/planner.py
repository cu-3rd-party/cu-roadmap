from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.domain.models.student import Student
from src.domain.schemas.goal_path_request import GoalPathRequest
from src.domain.schemas.roadmap_validation_request import RoadmapValidationRequest
from src.domain.schemas.semester.semester_validation_request import (
    SemesterValidationRequest,
)
from src.domain.schemas.planner_request import PlannerRequest
from src.services.engine2.generator import GreedyPlanner
from src.services.validation_service import RoadmapValidator
from src.services.planner_service import PlannerService

router = APIRouter()


@router.post("/generate")
async def generate_roadmap(req: PlannerRequest, db: AsyncSession = Depends(get_db)):
    planner = GreedyPlanner(db)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=req.passed_course_ids,
        major_id=req.major_id,
        current_semester=req.current_semester,
        max_load=req.max_load,
    )
    return {"major_id": str(req.major_id), "roadmap": roadmap}


@router.post("/validate-semester/")
async def validate_semester(
    req: SemesterValidationRequest, db: AsyncSession = Depends(get_db)
):
    """Scenario 2: Manual Semester Planning - Validate a single semester selection."""
    planner_service = PlannerService(db)
    all_courses = await planner_service.get_all_courses()

    validator = RoadmapValidator(all_courses)
    courses = [all_courses[cid] for cid in req.course_ids if cid in all_courses]

    result = validator.validate_semester(
        courses_in_sem=courses,
        previously_passed_ids=set(req.passed_course_ids),
        current_sem_num=req.current_semester,
        max_load=req.max_load,
    )
    return result


@router.post("/validate-roadmap/")
async def validate_roadmap(
    req: RoadmapValidationRequest, db: AsyncSession = Depends(get_db)
):
    """Scenario 3: The Strict Validator - Validate a full proposed roadmap."""
    planner_service = PlannerService(db)
    all_courses = await planner_service.get_all_courses()

    validator = RoadmapValidator(all_courses)
    results = validator.validate_full_roadmap(
        roadmap_data=req.roadmap,
        initial_passed_ids=set(req.passed_course_ids),
        max_load=req.max_load,
    )
    return {"validation_results": results}


@router.post("/goal-path/")
async def get_goal_path(req: GoalPathRequest, db: AsyncSession = Depends(get_db)):
    """Scenario 4: Goal-Oriented Planning - Plan towards a specific course."""
    planner_service = PlannerService(db)
    path = await planner_service.find_path_to_course(
        target_course_id=req.target_course_id,
        passed_ids=set(req.passed_course_ids),
        current_semester=req.current_semester,
        max_load=req.max_load,
    )
    return {"roadmap": path}


@router.get("/test-engine2")
async def test_engine2(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload

    st_res = await db.execute(
        select(Student).options(selectinload(Student.passed_courses)).limit(1)
    )
    student = st_res.scalars().first()

    if not student:
        return {"error": "No mock students found. Please run mock_data.py"}

    planner = GreedyPlanner(db)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=[c.id for c in student.passed_courses],
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
