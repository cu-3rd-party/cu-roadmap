import enum
import uuid
from sqlalchemy import Column, String, Text, Integer, Float, Enum, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class CourseType(str, enum.Enum):
    mandatory = "mandatory"
    elective = "elective"
    other = "other"

class CourseCategory(str, enum.Enum):
    stem = "stem"
    soft = "soft"
    business = "business"
    tech = "tech"
    design = "design"

class DependencyType(str, enum.Enum):
    prerequisite = "prerequisite"
    corequisite_type1 = "corequisite_type1"
    corequisite_type2 = "corequisite_type2"

class RequirementType(str, enum.Enum):
    core = "core"
    minor_recommended = "minor_recommended"

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
        cascade="all, delete-orphan"
    )

class CourseDependency(Base):
    __tablename__ = "course_dependencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    required_course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    dependency_type = Column(Enum(DependencyType), nullable=False)

    required_course = relationship("Course", foreign_keys=[required_course_id])

class Major(Base):
    __tablename__ = "majors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    school = Column(String, nullable=False)

    # Relationships
    requirements = relationship("MajorRequirement", backref="major", cascade="all, delete-orphan")

class MajorRequirement(Base):
    __tablename__ = "major_requirements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    major_id = Column(UUID(as_uuid=True), ForeignKey("majors.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    requirement_type = Column(Enum(RequirementType), nullable=False)

    course = relationship("Course")

student_passed_courses = Table(
    "student_passed_courses",
    Base.metadata,
    Column("student_id", UUID(as_uuid=True), ForeignKey("students.id"), primary_key=True),
    Column("course_id", UUID(as_uuid=True), ForeignKey("courses.id"), primary_key=True),
)

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cohort = Column(Integer, nullable=False)
    current_semester = Column(Integer, nullable=False)
    target_major_id = Column(UUID(as_uuid=True), ForeignKey("majors.id"), nullable=True)

    # Relationships
    target_major = relationship("Major")
    passed_courses = relationship("Course", secondary=student_passed_courses)
