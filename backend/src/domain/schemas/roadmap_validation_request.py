from typing import List
from uuid import UUID

from pydantic import BaseModel

from src.domain.schemas.semester.semester_data import SemesterData


class RoadmapValidationRequest(BaseModel):
    passed_course_ids: List[UUID]
    roadmap: List[SemesterData]
    max_load: float = 12.0
