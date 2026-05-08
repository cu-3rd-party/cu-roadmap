from uuid import UUID

from pydantic import BaseModel


class PlannerRequest(BaseModel):
    passed_course_ids: list[UUID]
    major_id: UUID
    current_semester: int = 1
    max_load: float = 12.0
