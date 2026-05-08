from typing import Optional, List

from pydantic import BaseModel

from src.domain.models.course.course_category import CourseCategory
from src.domain.models.course.course_type import CourseType


class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    handbook_link: Optional[str] = None
    course_type: CourseType
    category: CourseCategory
    allowed_cohorts: Optional[List[int]] = None
    available_semesters: List[int]
    recommended_semester: Optional[int] = None
    workload: float
    csat_metric: Optional[float] = None
