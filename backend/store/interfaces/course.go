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
	SeminarsWeek        int
	LecturesWeek        int
	AnalogGroup         string
	CsatMetric          *float64
	DisplayMode         enums.CourseDisplayMode
	Prerequisites       []uuid.UUID
	Corequisites        []uuid.UUID
	Postrequisites      []uuid.UUID
}

type CourseDependencyData struct {
	ID               uuid.UUID            `json:"id"`
	CourseID         uuid.UUID            `json:"course_id"`
	RequiredCourseID *uuid.UUID           `json:"required_course_id,omitempty"`
	RequiredGroupID  *uuid.UUID           `json:"required_group_id,omitempty"`
	DependencyType   enums.DependencyType `json:"dependency_type"`
	AlternativeGroup int                  `json:"alternative_group"`
}
