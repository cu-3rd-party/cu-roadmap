package store

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
	CsatMetric          *float64
	Prerequisites       []uuid.UUID
	Postrequisites      []uuid.UUID
}

type MajorData struct {
	ID     uuid.UUID
	Title  string
	School string
}

type MajorRequirementData struct {
	ID              uuid.UUID
	MajorID         uuid.UUID
	CourseID        uuid.UUID
	RequirementType enums.RequirementType
}

type CourseDependencyData struct {
	ID               uuid.UUID
	CourseID         uuid.UUID
	RequiredCourseID uuid.UUID
	DependencyType   enums.DependencyType
}

type StudentData struct {
	ID              uuid.UUID
	Cohort          int
	CurrentSemester int
	TargetMajorID   *uuid.UUID
	PassedCourseIDs []uuid.UUID
}

type StoreBase interface {
	Init() error
	Close() error
	ClearAll() error
	GetAllCourses() (map[uuid.UUID]CourseData, error)
	GetCourseByID(courseID uuid.UUID) (*CourseData, error)
	GetCourseDependencies() ([]CourseDependencyData, error)
	CreateCourse(course CourseData) (CourseData, error)
	GetAllMajors() (map[uuid.UUID]MajorData, error)
	GetMajorByID(majorID uuid.UUID) (*MajorData, error)
	CreateMajor(major MajorData) (MajorData, error)
	GetMajorRequirements(majorID uuid.UUID) ([]MajorRequirementData, error)
	CreateMajorRequirement(req MajorRequirementData) (MajorRequirementData, error)
	CreateCourseDependency(dep CourseDependencyData) (CourseDependencyData, error)
	GetAllStudents() (map[uuid.UUID]StudentData, error)
	GetStudentByID(studentID uuid.UUID) (*StudentData, error)
	CreateStudent(student StudentData) (StudentData, error)
	UpdateStudent(student StudentData) (StudentData, error)
	LoadCoursesFromCSV(coursesCSVPath, depsCSVPath, majorsCSVPath string) error
	LoadMockData() error
	SeedAllData() error
	SyncGoogleSheetsData() error
}
