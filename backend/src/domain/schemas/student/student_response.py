from typing import List
from uuid import UUID

from pydantic import ConfigDict

from src.domain.schemas.student.student_base import StudentBase
from src.domain.schemas.course.course_response import CourseResponse


class StudentResponse(StudentBase):
    id: UUID
    passed_courses: List[CourseResponse] = []

    model_config = ConfigDict(from_attributes=True)
