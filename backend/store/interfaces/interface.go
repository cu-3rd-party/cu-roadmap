package interfaces

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/google/uuid"
)

type StoreBase interface {
	Init() error
	Close() error
	ClearAll() error

	GetAllCourses() (map[uuid.UUID]CourseData, error)
	GetCourseByID(courseID uuid.UUID) (*CourseData, error)
	GetCourseDependencies() ([]CourseDependencyData, error)
	CreateCourse(course CourseData) (CourseData, error)
	UpdateCourse(course CourseData) (CourseData, error)
	DeleteCourse(courseID uuid.UUID) error

	GetAllMajors() (map[uuid.UUID]MajorData, error)
	GetMajorByID(majorID uuid.UUID) (*MajorData, error)
	CreateMajor(major MajorData) (MajorData, error)
	UpdateMajor(major MajorData) (MajorData, error)

	GetMajorRequirements(majorID uuid.UUID) ([]MajorRequirementData, error)
	CreateMajorRequirement(req MajorRequirementData) (MajorRequirementData, error)
	DeleteMajorRequirements(majorID uuid.UUID) error

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

	CreateAuthToken() (*models.AuthToken, error)
	CheckAuthToken(token uuid.UUID) (bool, error)
}
