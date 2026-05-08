from src.domain.schemas.course.course_base import CourseBase
from src.domain.schemas.course.course_create import CourseCreate
from src.domain.schemas.course.course_response import CourseResponse
from src.domain.schemas.course.course_dependency_base import CourseDependencyBase
from src.domain.schemas.course.course_dependency_response import (
    CourseDependencyResponse,
)

__all__ = [
    "CourseBase",
    "CourseCreate",
    "CourseResponse",
    "CourseDependencyBase",
    "CourseDependencyResponse",
]
