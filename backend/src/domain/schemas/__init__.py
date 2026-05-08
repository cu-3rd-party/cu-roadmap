from src.domain.schemas.course import (
    CourseBase,
    CourseCreate,
    CourseResponse,
    CourseDependencyBase,
    CourseDependencyResponse,
)
from src.domain.schemas.student import (
    StudentBase,
    StudentCreate,
    StudentResponse,
)
from src.domain.schemas.major import (
    MajorBase,
    MajorCreate,
    MajorResponse,
    MajorRequirementBase,
    MajorRequirementResponse,
)
from src.domain.schemas.semester import (
    SemesterData,
    SemesterValidationRequest,
)
from src.domain.schemas.validation import (
    ValidationMessage,
    ValidationResult,
)
from src.domain.schemas.roadmap_validation_request import RoadmapValidationRequest
from src.domain.schemas.goal_path_request import GoalPathRequest
from src.domain.schemas.planner_request import PlannerRequest

__all__ = [
    "CourseBase",
    "CourseCreate",
    "CourseResponse",
    "CourseDependencyBase",
    "CourseDependencyResponse",
    "StudentBase",
    "StudentCreate",
    "StudentResponse",
    "MajorBase",
    "MajorCreate",
    "MajorResponse",
    "MajorRequirementBase",
    "MajorRequirementResponse",
    "SemesterData",
    "SemesterValidationRequest",
    "ValidationMessage",
    "ValidationResult",
    "RoadmapValidationRequest",
    "GoalPathRequest",
    "PlannerRequest",
]
