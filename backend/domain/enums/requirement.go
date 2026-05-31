package enums

type RequirementType string

const (
	RequirementTypeMajorCore      RequirementType = "major_core"
	RequirementTypeMajorChoice    RequirementType = "major_choice"
	RequirementTypeFlex           RequirementType = "flex"
	RequirementTypeUniversity     RequirementType = "university"
	RequirementTypeElective       RequirementType = "elective"
	RequirementTypeMinor          RequirementType = "minor"
	RequirementTypeSoft           RequirementType = "soft"
	RequirementTypeSelectedTopics RequirementType = "selected_topics"
)
