from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ValidationMessage(BaseModel):
    level: str  # "error" or "warning"
    message: str
    course_id: Optional[UUID] = None
