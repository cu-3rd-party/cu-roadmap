package enums

type DependencyType string

const (
	DependencyTypePrerequisite DependencyType = "prerequisite"
	DependencyTypeCorequisite1 DependencyType = "corequisite_type1"
	DependencyTypeCorequisite2 DependencyType = "corequisite_type2"
)
