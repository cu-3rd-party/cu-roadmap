from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from ..models import CourseType, CourseCategory, DependencyType, RequirementType


class CourseDependencyBase(BaseModel):
    required_course_id: UUID
    dependency_type: DependencyType


class CourseDependencyResponse(CourseDependencyBase):
    id: UUID
    course_id: UUID

    model_config = ConfigDict(from_attributes=True)


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


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase):
    id: UUID
    dependencies: List[CourseDependencyResponse] = []

    model_config = ConfigDict(from_attributes=True)


class MajorRequirementBase(BaseModel):
    course_id: UUID
    requirement_type: RequirementType


class MajorRequirementResponse(MajorRequirementBase):
    id: UUID
    major_id: UUID

    model_config = ConfigDict(from_attributes=True)


class MajorBase(BaseModel):
    title: str
    school: str


class MajorCreate(MajorBase):
    pass


class MajorResponse(MajorBase):
    id: UUID
    requirements: List[MajorRequirementResponse] = []

    model_config = ConfigDict(from_attributes=True)


class StudentBase(BaseModel):
    cohort: int
    current_semester: int
    target_major_id: Optional[UUID] = None


class StudentCreate(StudentBase):
    pass


class StudentResponse(StudentBase):
    id: UUID
    passed_courses: List[CourseResponse] = []

    model_config = ConfigDict(from_attributes=True)
