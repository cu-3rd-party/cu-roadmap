from typing import List
from uuid import UUID

from pydantic import BaseModel


class GoalPathRequest(BaseModel):
    target_course_id: UUID
    passed_course_ids: List[UUID]
    current_semester: int = 1
    max_load: float = 12.0
