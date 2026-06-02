package store

import (
	"os"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type MemoryStoreTestSuite struct {
	suite.Suite
	s StoreBase
}

func (s *MemoryStoreTestSuite) SetupTest() {
	s.s = NewMemoryStore()
	s.s.Init()
}

func (s *MemoryStoreTestSuite) TearDownTest() {
	s.s.Close()
}

func (s *MemoryStoreTestSuite) TestCreateAndGetCourse() {
	course := CourseData{
		ID:                  uuid.New(),
		Title:               "Test Course",
		Description:         new("A test course"),
		HandbookLink:        new("http://example.com"),
		AllowedCohorts:      []int{2024, 2025},
		AvailableSemesters:  []int{1, 2},
		RecommendedSemester: new(1),
		Workload:            5.0,
		CsatMetric:          new(4.5),
	}

	created, err := s.s.CreateCourse(course)
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), course.ID, created.ID)

	retrieved, err := s.s.GetCourseByID(course.ID)
	assert.NoError(s.T(), err)
	assert.NotNil(s.T(), retrieved)
	assert.Equal(s.T(), "Test Course", retrieved.Title)
	assert.Equal(s.T(), 5.0, retrieved.Workload)
}

func (s *MemoryStoreTestSuite) TestGetAllCourses() {
	c1 := CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 4.0}
	c2 := CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 4.0}
	s.s.CreateCourse(c1)
	s.s.CreateCourse(c2)

	courses, err := s.s.GetAllCourses()
	assert.NoError(s.T(), err)
	assert.Len(s.T(), courses, 2)
}

func (s *MemoryStoreTestSuite) TestGetCourseByIDNotFound() {
	result, err := s.s.GetCourseByID(uuid.New())
	assert.NoError(s.T(), err)
	assert.Nil(s.T(), result)
}

func (s *MemoryStoreTestSuite) TestCreateAndGetMajor() {
	major := MajorData{ID: uuid.New(), Title: "AI Engineering", School: "Tech"}
	created, err := s.s.CreateMajor(major)
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), major.ID, created.ID)

	retrieved, err := s.s.GetMajorByID(major.ID)
	assert.NoError(s.T(), err)
	assert.NotNil(s.T(), retrieved)
	assert.Equal(s.T(), "AI Engineering", retrieved.Title)
	assert.Equal(s.T(), "Tech", retrieved.School)
}

func (s *MemoryStoreTestSuite) TestGetMajorByIDNotFound() {
	result, err := s.s.GetMajorByID(uuid.New())
	assert.NoError(s.T(), err)
	assert.Nil(s.T(), result)
}

func (s *MemoryStoreTestSuite) TestCreateAndGetCourseDependency() {
	c1 := CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 4.0}
	c2 := CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 4.0}
	s.s.CreateCourse(c1)
	s.s.CreateCourse(c2)

	dep := CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: c1.ID, DependencyType: enums.DependencyTypePrerequisite}
	_, err := s.s.CreateCourseDependency(dep)
	assert.NoError(s.T(), err)

	deps, err := s.s.GetCourseDependencies()
	assert.NoError(s.T(), err)
	assert.Len(s.T(), deps, 1)
	assert.Equal(s.T(), c2.ID, deps[0].CourseID)
}

func (s *MemoryStoreTestSuite) TestCreateAndGetMajorRequirement() {
	major := MajorData{ID: uuid.New(), Title: "Test Major", School: "Tech"}
	s.s.CreateMajor(major)
	c1 := CourseData{ID: uuid.New(), Title: "C1", AvailableSemesters: []int{1}, Workload: 4.0}
	s.s.CreateCourse(c1)

	req := MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore}
	_, err := s.s.CreateMajorRequirement(req)
	assert.NoError(s.T(), err)

	reqs, err := s.s.GetMajorRequirements(major.ID)
	assert.NoError(s.T(), err)
	assert.Len(s.T(), reqs, 1)
}

func (s *MemoryStoreTestSuite) TestGetMajorRequirementsEmpty() {
	major := MajorData{ID: uuid.New(), Title: "Empty Major", School: "Test"}
	s.s.CreateMajor(major)

	reqs, err := s.s.GetMajorRequirements(major.ID)
	assert.NoError(s.T(), err)
	assert.Len(s.T(), reqs, 0)
}

func (s *MemoryStoreTestSuite) TestCreateAndGetStudent() {
	student := StudentData{ID: uuid.New(), Cohort: 2025, CurrentSemester: 3}
	created, err := s.s.CreateStudent(student)
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), student.ID, created.ID)

	retrieved, err := s.s.GetStudentByID(student.ID)
	assert.NoError(s.T(), err)
	assert.NotNil(s.T(), retrieved)
	assert.Equal(s.T(), 2025, retrieved.Cohort)
	assert.Equal(s.T(), 3, retrieved.CurrentSemester)
}

func (s *MemoryStoreTestSuite) TestGetAllStudents() {
	s1 := StudentData{ID: uuid.New(), Cohort: 2025, CurrentSemester: 1}
	s2 := StudentData{ID: uuid.New(), Cohort: 2025, CurrentSemester: 2}
	s.s.CreateStudent(s1)
	s.s.CreateStudent(s2)

	students, err := s.s.GetAllStudents()
	assert.NoError(s.T(), err)
	assert.Len(s.T(), students, 2)
}

func (s *MemoryStoreTestSuite) TestUpdateStudent() {
	major := MajorData{ID: uuid.New(), Title: "M", School: "T"}
	s.s.CreateMajor(major)
	student := StudentData{ID: uuid.New(), Cohort: 2025, CurrentSemester: 3, TargetMajorID: &major.ID}
	s.s.CreateStudent(student)

	updated := StudentData{
		ID:              student.ID,
		Cohort:          2025,
		CurrentSemester: 5,
		TargetMajorID:   &major.ID,
		PassedCourseIDs: []uuid.UUID{uuid.New()},
	}
	result, err := s.s.UpdateStudent(updated)
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), 5, result.CurrentSemester)
	assert.Len(s.T(), result.PassedCourseIDs, 1)
}

func (s *MemoryStoreTestSuite) TestClearAll() {
	course := CourseData{ID: uuid.New(), Title: "To Be Cleared", AvailableSemesters: []int{1}, Workload: 3.0}
	s.s.CreateCourse(course)

	courses, _ := s.s.GetAllCourses()
	assert.Len(s.T(), courses, 1)

	s.s.ClearAll()

	courses, _ = s.s.GetAllCourses()
	assert.Len(s.T(), courses, 0)
}

func TestMemoryStoreSuite(t *testing.T) {
	suite.Run(t, new(MemoryStoreTestSuite))
}

func TestLoadCoursesFromCSV(t *testing.T) {
	s := NewMemoryStore()
	s.Init()
	defer s.Close()

	err := s.LoadCoursesFromCSV("../courses.csv", "../course_dependencies.csv", "../majors.csv")
	assert.NoError(t, err)

	courses, _ := s.GetAllCourses()
	assert.NotZero(t, len(courses))

	majors, _ := s.GetAllMajors()
	assert.NotZero(t, len(majors))

	deps, _ := s.GetCourseDependencies()
	assert.NotZero(t, len(deps))
}

func TestSeedAllData(t *testing.T) {
	oldWd, _ := os.Getwd()
	os.Chdir("..")
	defer os.Chdir(oldWd)

	s := NewMemoryStore()
	s.Init()
	defer s.Close()

	err := s.SeedAllData()
	assert.NoError(t, err)

	courses, _ := s.GetAllCourses()
	assert.NotZero(t, len(courses))

	students, _ := s.GetAllStudents()
	assert.Len(t, students, 1)
}
