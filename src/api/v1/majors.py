from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.core.database import get_db
from src.domain.models import Major

router = APIRouter()

@router.get("/")
async def get_majors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Major).options(selectinload(Major.requirements)))
    majors = result.scalars().all()
    
    res = []
    for m in majors:
        res.append({
            "id": str(m.id),
            "title": m.title,
            "school": m.school,
            "requirements": [{"course_id": str(r.course_id), "type": r.requirement_type.value} for r in m.requirements]
        })
    return res
