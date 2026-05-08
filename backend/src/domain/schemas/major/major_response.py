from typing import List
from uuid import UUID

from pydantic import ConfigDict

from src.domain.schemas.major.major_base import MajorBase
from src.domain.schemas.major.major_requirement_response import MajorRequirementResponse


class MajorResponse(MajorBase):
    id: UUID
    requirements: List[MajorRequirementResponse] = []

    model_config = ConfigDict(from_attributes=True)
