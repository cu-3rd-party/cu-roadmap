from abc import ABC, abstractmethod
from uuid import UUID
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class DependencyTypeEnum(str, Enum):
    prerequisite = "prerequisite"
    corequisite_type1 = "corequisite_type1"
    corequisite_type2 = "corequisite_type2"


class RequirementTypeEnum(str, Enum):
    core = "core"
    elective = "elective"
    optional = "optional"


class CourseTypeEnum(str, Enum):
    mandatory = "mandatory"
    elective = "elective"
    optional = "optional"
    other = "other"


class CourseCategoryEnum(str, Enum):
    stem = "stem"
    soft = "soft"
    business = "business"
    tech = "tech"
    design = "design"


@dataclass
class CourseData:
    id: UUID
    title: str
    description: Optional[str]
    handbook_link: Optional[str]
    course_type: CourseTypeEnum
    category: CourseCategoryEnum
    allowed_cohorts: Optional[List[int]]
    available_semesters: List[int]
    recommended_semester: Optional[int]
    workload: float
    csat_metric: Optional[float]
    prerequisites: List[UUID] = None
    postrequisites: List[UUID] = None


@dataclass
class CourseDependencyData:
    id: UUID
    course_id: UUID
    required_course_id: UUID
    dependency_type: DependencyTypeEnum


@dataclass
class MajorData:
    id: UUID
    title: str
    school: str


@dataclass
class MajorRequirementData:
    id: UUID
    major_id: UUID
    course_id: UUID
    requirement_type: RequirementTypeEnum


@dataclass
class StudentData:
    id: UUID
    cohort: int
    current_semester: int
    target_major_id: Optional[UUID]
    passed_course_ids: List[UUID]


class StoreBase(ABC):
    @abstractmethod
    async def init(self) -> None:
        pass

    @abstractmethod
    async def close(self) -> None:
        pass

    @abstractmethod
    async def clear_all(self) -> None:
        pass

    @abstractmethod
    async def get_all_courses(self) -> Dict[UUID, CourseData]:
        pass

    @abstractmethod
    async def get_course_by_id(self, course_id: UUID) -> Optional[CourseData]:
        pass

    @abstractmethod
    async def get_course_dependencies(self) -> List[CourseDependencyData]:
        pass

    @abstractmethod
    async def create_course(self, course: CourseData) -> CourseData:
        pass

    @abstractmethod
    async def get_all_majors(self) -> Dict[UUID, MajorData]:
        pass

    @abstractmethod
    async def get_major_by_id(self, major_id: UUID) -> Optional[MajorData]:
        pass

    @abstractmethod
    async def create_major(self, major: MajorData) -> MajorData:
        pass

    @abstractmethod
    async def get_major_requirements(
        self, major_id: UUID
    ) -> List[MajorRequirementData]:
        pass

    @abstractmethod
    async def create_major_requirement(
        self, req: MajorRequirementData
    ) -> MajorRequirementData:
        pass

    @abstractmethod
    async def create_course_dependency(
        self, dep: CourseDependencyData
    ) -> CourseDependencyData:
        pass

    @abstractmethod
    async def get_all_students(self) -> Dict[UUID, StudentData]:
        pass

    @abstractmethod
    async def get_student_by_id(self, student_id: UUID) -> Optional[StudentData]:
        pass

    @abstractmethod
    async def create_student(self, student: StudentData) -> StudentData:
        pass

    @abstractmethod
    async def update_student(self, student: StudentData) -> StudentData:
        pass

    @abstractmethod
    async def load_courses_from_csv(
        self, courses_csv_path: str, deps_csv_path: str, majors_csv_path: str
    ) -> None:
        pass

    @abstractmethod
    async def load_mock_data(self) -> None:
        pass

    @abstractmethod
    async def seed_all_data(self) -> None:
        pass
