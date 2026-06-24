package enums

type CourseType string

const (
	CourseTypeMandatory CourseType = "mandatory"
	CourseTypeElective  CourseType = "elective"
	CourseTypeOther     CourseType = "other"
)

type CourseCategory string

const (
	CourseCategoryFundamentals CourseCategory = "fundamentals"
	CourseCategoryAI           CourseCategory = "ai"
	CourseCategorySTEM         CourseCategory = "stem"
	CourseCategorySoft         CourseCategory = "soft"
	CourseCategoryBusiness     CourseCategory = "business"
	CourseCategoryTech         CourseCategory = "tech"
	CourseCategorySWE          CourseCategory = "swe"
	CourseCategoryDesign       CourseCategory = "design"
)

type CourseSource string

const (
	CourseSourceSelected CourseSource = "selected"
	CourseSourcePassed   CourseSource = "passed"
)
