from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.domain.models import Student
from src.services.engine2.generator import GreedyPlanner

from pydantic import BaseModel
from uuid import UUID

router = APIRouter()

class PlannerRequest(BaseModel):
    passed_course_ids: list[UUID]
    major_id: UUID
    current_semester: int = 1
    max_load: float = 12.0

@router.post("/generate")
async def generate_roadmap(req: PlannerRequest, db: AsyncSession = Depends(get_db)):
    planner = GreedyPlanner(db)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=req.passed_course_ids,
        major_id=req.major_id,
        current_semester=req.current_semester,
        max_load=req.max_load
    )
    return {
        "major_id": str(req.major_id),
        "roadmap": roadmap
    }

@router.get("/test-engine2")
async def test_engine2(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    st_res = await db.execute(select(Student).options(selectinload(Student.passed_courses)).limit(1))
    student = st_res.scalars().first()
    
    if not student:
        return {"error": "No mock students found. Please run mock_data.py"}
        
    planner = GreedyPlanner(db)
    roadmap = await planner.generate_roadmap(
        passed_course_ids=[c.id for c in student.passed_courses],
        major_id=student.target_major_id,
        current_semester=student.current_semester,
        max_load=12.0
    )
    
    return {
        "student_id": str(student.id),
        "target_major_id": str(student.target_major_id) if student.target_major_id else None,
        "current_semester": student.current_semester,
        "roadmap": roadmap
    }
