from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class StudentBase(BaseModel):
    cohort: int
    current_semester: int
    target_major_id: Optional[UUID] = None
