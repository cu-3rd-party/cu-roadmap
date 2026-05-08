from uuid import UUID

from pydantic import BaseModel

from src.domain.models.requirement_type import RequirementType


class MajorRequirementBase(BaseModel):
    course_id: UUID
    requirement_type: RequirementType
