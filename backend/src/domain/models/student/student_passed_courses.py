from sqlalchemy import Table, Column, UUID, ForeignKey

from src.domain.models import Base

student_passed_courses = Table(
    "student_passed_courses",
    Base.metadata,
    Column(
        "student_id", UUID(as_uuid=True), ForeignKey("students.id"), primary_key=True
    ),
    Column("course_id", UUID(as_uuid=True), ForeignKey("courses.id"), primary_key=True),
)
