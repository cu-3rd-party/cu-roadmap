import enum


class CourseCategory(str, enum.Enum):
    stem = "stem"
    soft = "soft"
    business = "business"
    tech = "tech"
    design = "design"
