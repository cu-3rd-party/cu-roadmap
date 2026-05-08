from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.domain.models import Course

router = APIRouter()


@router.get("/")
async def get_courses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course))
    courses = result.scalars().all()

    res = []
    for c in courses:
        res.append(
            {
                "id": str(c.id),
                "title": c.title,
                "description": c.description,
                "course_type": c.course_type.value,
                "category": c.category.value,
                "available_semesters": c.available_semesters,
                "workload": c.workload,
            }
        )
    return res
