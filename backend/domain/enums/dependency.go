package enums

type DependencyType string

const (
	DependencyTypePrerequisite DependencyType = "prerequisite"
	DependencyTypeCorequisite  DependencyType = "corequisite"
)
