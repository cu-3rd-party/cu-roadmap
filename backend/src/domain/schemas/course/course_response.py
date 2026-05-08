from typing import List
from uuid import UUID

from pydantic import ConfigDict

from src.domain.schemas.course.course_base import CourseBase
from src.domain.schemas.course.course_dependency_response import (
    CourseDependencyResponse,
)


class CourseResponse(CourseBase):
    id: UUID
    dependencies: List[CourseDependencyResponse] = []

    model_config = ConfigDict(from_attributes=True)
