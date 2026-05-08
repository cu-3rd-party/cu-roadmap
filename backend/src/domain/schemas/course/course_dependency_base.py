from uuid import UUID

from pydantic import BaseModel

from src.domain.models.dependency_type import DependencyType


class CourseDependencyBase(BaseModel):
    required_course_id: UUID
    dependency_type: DependencyType
