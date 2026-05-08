import uuid

from sqlalchemy import Column, UUID, Integer, ForeignKey
from sqlalchemy.orm import relationship

from src.domain.models import Base
from src.domain.models.student.student_passed_courses import student_passed_courses


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cohort = Column(Integer, nullable=False)
    current_semester = Column(Integer, nullable=False)
    target_major_id = Column(UUID(as_uuid=True), ForeignKey("majors.id"), nullable=True)

    # Relationships
    target_major = relationship("Major")
    passed_courses = relationship("Course", secondary=student_passed_courses)
