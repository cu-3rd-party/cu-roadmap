from fastapi import APIRouter
from src.stores.factory import get_store

router = APIRouter()


@router.get("/")
async def get_courses():
    store = await get_store()
    courses = await store.get_all_courses()

    res = []
    for c in courses.values():
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
