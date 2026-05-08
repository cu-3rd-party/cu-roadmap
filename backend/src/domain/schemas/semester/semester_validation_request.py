from typing import List
from uuid import UUID

from pydantic import BaseModel


class SemesterValidationRequest(BaseModel):
    current_semester: int
    course_ids: List[UUID]
    passed_course_ids: List[UUID]
    max_load: float = 12.0
