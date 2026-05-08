from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.domain.models import Course, CourseDependency
from logging import info

router = APIRouter()


@router.get("/data")
async def get_graph_data(db: AsyncSession = Depends(get_db)):
    courses_result = await db.execute(select(Course))
    courses = courses_result.scalars().all()

    deps_result = await db.execute(select(CourseDependency))
    deps = deps_result.scalars().all()

    nodes = [
        {
            "id": str(c.id),
            "label": c.title,
            "group": c.category.value,
            "title": c.description,
            "recommended_semester": c.recommended_semester,
        }
        for c in courses
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
