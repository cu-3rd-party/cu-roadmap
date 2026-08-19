package interfaces

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/google/uuid"
)

type CacheStoreBase interface {
	Init() error
	Close() error
	ClearAll() error
	Ready() bool

	CreateAuthToken() (*models.AuthToken, error)
	CheckAuthToken(token uuid.UUID) (bool, error)
	DeleteAuthToken(token uuid.UUID) error
	Get(key string) ([]byte, bool, error)
	Set(key string, value []byte, ttlSeconds int64) error
	DeleteByPrefix(prefix string) error
	AllowRateLimit(key string, capacity int, refillPerSecond float64) (bool, float64, error)
}

type StoreBase interface {
	Init(password string) error
	Close() error
	ClearAll() error
	Ready() bool

	GetAllCourses() (map[uuid.UUID]CourseData, error)
	GetCourses(filter CourseFilter) ([]CourseData, error)
	GetCourseByID(courseID uuid.UUID) (*CourseData, error)
	GetCourseDependencies() ([]CourseDependencyData, error)
	CreateCourse(course CourseData) (CourseData, error)
	UpdateCourse(course CourseData) (CourseData, error)
	DeleteCourse(courseID uuid.UUID) error

	GetAllMajors() (map[uuid.UUID]MajorData, error)
	GetMajorByID(majorID uuid.UUID) (*MajorData, error)
	CreateMajor(major MajorData) (MajorData, error)
	UpdateMajor(major MajorData) (MajorData, error)
	DeleteMajor(majorID uuid.UUID) error

	GetAllBoxes() (map[uuid.UUID]BoxData, error)
	GetBoxByID(boxID uuid.UUID) (*BoxData, error)
	CreateBox(box BoxData) (BoxData, error)
	UpdateBox(box BoxData) (BoxData, error)
	DeleteBox(boxID uuid.UUID) error
	GetBoxEdges() ([]BoxEdgeData, error)
	CreateBoxEdge(edge BoxEdgeData) (BoxEdgeData, error)
	DeleteBoxEdgesByParent(parentBoxID uuid.UUID) error
	DeleteBoxEdgesByChild(childBoxID uuid.UUID) error
	DeleteBoxEdge(id uuid.UUID) error

	GetSpecializationsByMajor(majorID uuid.UUID) ([]SpecializationData, error)
	CreateSpecialization(spec SpecializationData) (SpecializationData, error)
	UpdateSpecialization(spec SpecializationData) (SpecializationData, error)
	DeleteSpecializations(majorID uuid.UUID) error

	CreateCourseRestriction(restriction CourseRestrictionData) (CourseRestrictionData, error)
	UpdateCourseRestriction(restriction CourseRestrictionData) (CourseRestrictionData, error)
	DeleteCourseRestriction(restrictionID uuid.UUID) error
	GetCourseRestrictionByID(restrictionID uuid.UUID) (*CourseRestrictionData, error)
	GetCourseRestrictionsBySpecialization(specializationID uuid.UUID) ([]CourseRestrictionData, error)

	CreateDisciplineGroup(group DisciplineGroupData) (DisciplineGroupData, error)
	UpdateDisciplineGroup(group DisciplineGroupData) (DisciplineGroupData, error)
	GetDisciplineGroupByID(id uuid.UUID) (*DisciplineGroupData, error)
	GetAllDisciplineGroups() ([]DisciplineGroupData, error)
	DeleteDisciplineGroup(id uuid.UUID) error

	CreateCourseDependency(dep CourseDependencyData) (CourseDependencyData, error)
	DeleteCourseDependencies(courseID uuid.UUID) error

	GetAllStudents() (map[uuid.UUID]StudentData, error)
	GetStudentByID(studentID uuid.UUID) (*StudentData, error)
	CreateStudent(student StudentData) (StudentData, error)
	UpdateStudent(student StudentData) (StudentData, error)

	LoadCoursesFromCSV(coursesCSVPath, depsCSVPath, majorsCSVPath string) error
	LoadMockData() error
	SeedAllData() error
	SyncGoogleSheetsData() error

	SetAdminPassword(password string)
	CheckPassword(password string) bool
}
