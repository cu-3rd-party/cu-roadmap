import uuid

from sqlalchemy import Column, UUID, ForeignKey, Enum
from sqlalchemy.orm import relationship

from src.domain.models import Base
from src.domain.models.requirement_type import RequirementType


class MajorRequirement(Base):
    __tablename__ = "major_requirements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    major_id = Column(UUID(as_uuid=True), ForeignKey("majors.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    requirement_type = Column(Enum(RequirementType), nullable=False)

    course = relationship("Course")
