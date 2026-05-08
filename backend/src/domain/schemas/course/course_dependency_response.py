from uuid import UUID

from pydantic import ConfigDict

from src.domain.schemas.course.course_dependency_base import CourseDependencyBase


class CourseDependencyResponse(CourseDependencyBase):
    id: UUID
    course_id: UUID

    model_config = ConfigDict(from_attributes=True)
