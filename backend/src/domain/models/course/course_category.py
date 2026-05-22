import enum


class CourseCategory(str, enum.Enum):
    ai = "ai"
    stem = "stem"
    soft = "soft"
    business = "business"
    tech = "tech"
    design = "design"
