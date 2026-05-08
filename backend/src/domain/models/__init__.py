from sqlalchemy.orm import declarative_base

Base = declarative_base()

# noqa: E402 - imports must be after Base definition to avoid circular import
from src.domain.models.dependency_type import DependencyType  # noqa: E402
from src.domain.models.requirement_type import RequirementType  # noqa: E402
from src.domain.models.course import Course  # noqa: E402
from src.domain.models.course.course_type import CourseType  # noqa: E402
from src.domain.models.course.course_category import CourseCategory  # noqa: E402
from src.domain.models.course.course_dependency import CourseDependency  # noqa: E402
from src.domain.models.major import Major  # noqa: E402
from src.domain.models.major.major_requirement import MajorRequirement  # noqa: E402
from src.domain.models.student import Student  # noqa: E402
from src.domain.models.student.student_passed_courses import student_passed_courses  # noqa: E402

__all__ = [
    "Base",
    "DependencyType",
    "RequirementType",
    "Course",
    "CourseType",
    "CourseCategory",
    "CourseDependency",
    "Major",
    "MajorRequirement",
    "Student",
    "student_passed_courses",
]
