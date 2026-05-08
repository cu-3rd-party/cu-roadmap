import uuid

from sqlalchemy import Column, UUID, ForeignKey, Enum
from sqlalchemy.orm import relationship

from src.domain.models import Base
from src.domain.models.dependency_type import DependencyType


class CourseDependency(Base):
    __tablename__ = "course_dependencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    required_course_id = Column(
        UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False
    )
    dependency_type = Column(Enum(DependencyType), nullable=False)

    required_course = relationship("Course", foreign_keys=[required_course_id])
