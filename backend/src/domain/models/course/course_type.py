import enum


class CourseType(str, enum.Enum):
    mandatory = "mandatory"
    elective = "elective"
    other = "other"
