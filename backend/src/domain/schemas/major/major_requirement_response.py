from uuid import UUID

from pydantic import ConfigDict

from src.domain.schemas.major.major_requirement_base import MajorRequirementBase


class MajorRequirementResponse(MajorRequirementBase):
    id: UUID
    major_id: UUID

    model_config = ConfigDict(from_attributes=True)
