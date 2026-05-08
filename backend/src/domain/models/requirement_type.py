import enum


class RequirementType(str, enum.Enum):
    core = "core"
    minor_recommended = "minor_recommended"
