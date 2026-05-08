import uuid

from sqlalchemy import Column, UUID, String, Text, Enum, Integer, Float
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from src.domain.models import Base
from src.domain.models.course.course_category import CourseCategory
from src.domain.models.course.course_type import CourseType


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    handbook_link = Column(Text, nullable=True)
    course_type = Column(Enum(CourseType), nullable=False)
    category = Column(Enum(CourseCategory), nullable=False)
    allowed_cohorts = Column(ARRAY(Integer), nullable=True)
    available_semesters = Column(ARRAY(Integer), nullable=False)
    recommended_semester = Column(Integer, nullable=True)
    workload = Column(Float, nullable=False)
    csat_metric = Column(Float, nullable=True)

    # Relationships
    dependencies = relationship(
        "CourseDependency",
        foreign_keys="[CourseDependency.course_id]",
        backref="course",
        cascade="all, delete-orphan",
    )
