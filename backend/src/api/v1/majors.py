from fastapi import APIRouter
from uuid import UUID
from src.stores.factory import get_store

router = APIRouter()


@router.get("/")
async def get_majors():
    store = await get_store()
    majors = await store.get_all_majors()

    res = []
    for m in majors.values():
        requirements = await store.get_major_requirements(m.id)
        res.append(
            {
                "id": str(m.id),
                "title": m.title,
                "school": m.school,
                "requirements": [
                    {"course_id": str(r.course_id), "type": r.requirement_type.value}
                    for r in requirements
                ],
            }
        )
    return res


@router.post("/identify")
async def identify_major(passed_course_ids: list[str]):
    store = await get_store()
    majors = await store.get_all_majors()

    passed_uuids = {UUID(cid) for cid in passed_course_ids}

    analysis = []
    for m in majors.values():
        requirements = await store.get_major_requirements(m.id)
        req_ids = {r.course_id for r in requirements}
        if not req_ids:
            continue
        covered = req_ids.intersection(passed_uuids)
        score = len(covered) / len(req_ids) if req_ids else 0
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
