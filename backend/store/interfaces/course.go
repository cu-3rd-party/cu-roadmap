package interfaces

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
)

type CourseData struct {
	ID                  uuid.UUID
	Title               string
	Description         *string
	HandbookLink        *string
	CourseType          enums.CourseType
	Category            enums.CourseCategory
	AllowedCohorts      []int
	AvailableSemesters  []int
	RecommendedSemester *int
	Workload            float64
	AnalogGroup         string
	CsatMetric          *float64
	Prerequisites       []uuid.UUID
	Corequisites        []uuid.UUID
	Postrequisites      []uuid.UUID
}

type CourseDependencyData struct {
	ID               uuid.UUID
	CourseID         uuid.UUID
	RequiredCourseID uuid.UUID
	DependencyType   enums.DependencyType
	AlternativeGroup int
}
