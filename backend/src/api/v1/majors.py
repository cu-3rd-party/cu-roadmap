from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.core.database import get_db
from src.domain.models.major import Major

router = APIRouter()


@router.get("/")
async def get_majors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Major).options(selectinload(Major.requirements)))
    majors = result.scalars().all()

    res = []
    for m in majors:
        res.append(
            {
                "id": str(m.id),
                "title": m.title,
                "school": m.school,
                "requirements": [
                    {"course_id": str(r.course_id), "type": r.requirement_type.value}
                    for r in m.requirements
                ],
            }
        )
    return res


@router.post("/identify")
async def identify_major(
    passed_course_ids: list[str], db: AsyncSession = Depends(get_db)
):
    import uuid

    result = await db.execute(select(Major).options(selectinload(Major.requirements)))
    majors = result.scalars().all()

    passed_uuids = {uuid.UUID(cid) for cid in passed_course_ids}

    analysis = []
    for m in majors:
        req_ids = {r.course_id for r in m.requirements}
        if not req_ids:
            continue
        covered = req_ids.intersection(passed_uuids)
        score = len(covered) / len(req_ids)
        analysis.append(
            {
                "id": str(m.id),
                "title": m.title,
                "score": score,
                "covered_count": len(covered),
                "total_count": len(req_ids),
            }
        )

    analysis.sort(key=lambda x: x["score"], reverse=True)
    return analysis
