import uuid

from sqlalchemy import Column, UUID, String
from sqlalchemy.orm import relationship

from src.domain.models import Base


class Major(Base):
    __tablename__ = "majors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    school = Column(String, nullable=False)

    # Relationships
    requirements = relationship(
        "MajorRequirement", backref="major", cascade="all, delete-orphan"
    )
