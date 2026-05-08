from typing import List
from uuid import UUID

from pydantic import BaseModel


class SemesterData(BaseModel):
    semester: int
    course_ids: List[UUID]
