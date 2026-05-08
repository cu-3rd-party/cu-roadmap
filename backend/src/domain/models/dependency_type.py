import enum


class DependencyType(str, enum.Enum):
    prerequisite = "prerequisite"
    corequisite_type1 = "corequisite_type1"
    corequisite_type2 = "corequisite_type2"
