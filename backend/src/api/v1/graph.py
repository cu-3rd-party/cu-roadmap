from fastapi import APIRouter
from logging import info
from src.stores.factory import get_store

router = APIRouter()


@router.get("/data")
async def get_graph_data():
    store = await get_store()
    courses = await store.get_all_courses()
    deps = await store.get_course_dependencies()

    nodes = [
        {
            "id": str(c.id),
            "label": c.title,
            "group": c.category.value,
            "title": c.description,
            "recommended_semester": c.recommended_semester,
        }
        for c in courses.values()
    ]
    info(f"Fetched {len(nodes)} courses for graph nodes: {nodes}")
    edges = [
        {
            "from": str(d.required_course_id),
            "to": str(d.course_id),
            "label": d.dependency_type.value,
        }
        for d in deps
    ]

    return {"nodes": nodes, "edges": edges}
