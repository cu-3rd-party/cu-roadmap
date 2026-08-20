package store

import (
	"os"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/requirements"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type MemoryStoreTestSuite struct {
	suite.Suite
	s interfaces.StoreBase
}

func (s *MemoryStoreTestSuite) SetupTest() {
	s.s = NewMemoryStore()
	s.s.Init("admin")
}

func (s *MemoryStoreTestSuite) TearDownTest() {
	s.s.Close()
}

func (s *MemoryStoreTestSuite) TestCreateAndGetCourse() {
	course := interfaces.CourseData{
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
	c1 := interfaces.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 4.0}
	c2 := interfaces.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 4.0}
	s.s.CreateCourse(c1)
	s.s.CreateCourse(c2)

	courses, err := s.s.GetAllCourses()
	assert.NoError(s.T(), err)
	assert.Len(s.T(), courses, 2)
}

func (s *MemoryStoreTestSuite) TestGetCoursesIncludesPostrequisites() {
	base := interfaces.CourseData{ID: uuid.New(), Title: "Base", AvailableSemesters: []int{1}, Workload: 4.0}
	advanced := interfaces.CourseData{ID: uuid.New(), Title: "Advanced", AvailableSemesters: []int{2}, Workload: 4.0}
	coreqOnly := interfaces.CourseData{ID: uuid.New(), Title: "Coreq Only", AvailableSemesters: []int{2}, Workload: 4.0}

	_, _ = s.s.CreateCourse(base)
	_, _ = s.s.CreateCourse(advanced)
	_, _ = s.s.CreateCourse(coreqOnly)

	_, err := s.s.CreateCourseDependency(interfaces.CourseDependencyData{
		ID:               uuid.New(),
		CourseID:         advanced.ID,
		RequiredCourseID: &base.ID,
		DependencyType:   enums.DependencyTypePrerequisite,
	})
	assert.NoError(s.T(), err)

	_, err = s.s.CreateCourseDependency(interfaces.CourseDependencyData{
		ID:               uuid.New(),
		CourseID:         coreqOnly.ID,
		RequiredCourseID: &base.ID,
		DependencyType:   enums.DependencyTypeCorequisite,
	})
	assert.NoError(s.T(), err)

	courses, err := s.s.GetCourses(interfaces.CourseFilter{})
	assert.NoError(s.T(), err)

	byID := make(map[uuid.UUID]interfaces.CourseData, len(courses))
	for _, course := range courses {
		byID[course.ID] = course
	}

	assert.ElementsMatch(s.T(), []uuid.UUID{advanced.ID}, byID[base.ID].Postrequisites)
	assert.Empty(s.T(), byID[advanced.ID].Postrequisites)
	assert.Empty(s.T(), byID[coreqOnly.ID].Postrequisites)
	assert.ElementsMatch(s.T(), []uuid.UUID{base.ID}, byID[advanced.ID].Prerequisites)
}

func (s *MemoryStoreTestSuite) TestGetCourseByIDNotFound() {
	result, err := s.s.GetCourseByID(uuid.New())
	assert.NoError(s.T(), err)
	assert.Nil(s.T(), result)
}

func (s *MemoryStoreTestSuite) TestCreateAndGetMajor() {
	major := interfaces.MajorData{ID: uuid.New(), Title: "AI Engineering", School: "Tech", CohortYear: 2025}
	created, err := s.s.CreateMajor(major)
	assert.NoError(s.T(), err)
	assert.Equal(s.T(), major.ID, created.ID)

	retrieved, err := s.s.GetMajorByID(major.ID)
	assert.NoError(s.T(), err)
	assert.NotNil(s.T(), retrieved)
	assert.Equal(s.T(), "AI Engineering", retrieved.Title)
	assert.Equal(s.T(), "Tech", retrieved.School)
	assert.Equal(s.T(), 2025, retrieved.CohortYear)
}

func (s *MemoryStoreTestSuite) TestGetMajorByIDNotFound() {
	result, err := s.s.GetMajorByID(uuid.New())
	assert.NoError(s.T(), err)
	assert.Nil(s.T(), result)
}

func (s *MemoryStoreTestSuite) TestCreateAndGetCourseDependency() {
	c1 := interfaces.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 4.0}
	c2 := interfaces.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 4.0}
	s.s.CreateCourse(c1)
	s.s.CreateCourse(c2)

	dep := interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: &c1.ID, DependencyType: enums.DependencyTypePrerequisite}
	_, err := s.s.CreateCourseDependency(dep)
	assert.NoError(s.T(), err)

	deps, err := s.s.GetCourseDependencies()
	assert.NoError(s.T(), err)
	assert.Len(s.T(), deps, 1)
	assert.Equal(s.T(), c2.ID, deps[0].CourseID)
}

func (s *MemoryStoreTestSuite) TestCreateAndGetMajorRequirement() {
	major := interfaces.MajorData{ID: uuid.New(), Title: "Test Major", School: "Tech"}
	s.s.CreateMajor(major)
	c1 := interfaces.CourseData{ID: uuid.New(), Title: "C1", AvailableSemesters: []int{1}, Workload: 4.0}
	s.s.CreateCourse(c1)

	err := requirements.AddFlatRequirement(s.s, major.ID, requirements.FlatRequirementInput{ID: uuid.New(), CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
	assert.NoError(s.T(), err)

	reqs, err := requirements.NewResolver(s.s).ProjectMajorRequirements(major.ID)
	assert.NoError(s.T(), err)
	assert.Len(s.T(), reqs, 1)
}

func (s *MemoryStoreTestSuite) TestGetMajorRequirementsEmpty() {
	major := interfaces.MajorData{ID: uuid.New(), Title: "Empty Major", School: "Test"}
	s.s.CreateMajor(major)

	reqs, err := requirements.NewResolver(s.s).ProjectMajorRequirements(major.ID)
	assert.NoError(s.T(), err)
	assert.Len(s.T(), reqs, 0)
}

func (s *MemoryStoreTestSuite) TestCreateAndGetStudent() {
	student := interfaces.StudentData{ID: uuid.New(), Cohort: 2025, CurrentSemester: 3}
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
	s1 := interfaces.StudentData{ID: uuid.New(), Cohort: 2025, CurrentSemester: 1}
	s2 := interfaces.StudentData{ID: uuid.New(), Cohort: 2025, CurrentSemester: 2}
	s.s.CreateStudent(s1)
	s.s.CreateStudent(s2)

	students, err := s.s.GetAllStudents()
	assert.NoError(s.T(), err)
	assert.Len(s.T(), students, 2)
}

func (s *MemoryStoreTestSuite) TestUpdateStudent() {
	major := interfaces.MajorData{ID: uuid.New(), Title: "M", School: "T"}
	s.s.CreateMajor(major)
	student := interfaces.StudentData{ID: uuid.New(), Cohort: 2025, CurrentSemester: 3, TargetMajorID: &major.ID}
	s.s.CreateStudent(student)

	updated := interfaces.StudentData{
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
	course := interfaces.CourseData{ID: uuid.New(), Title: "To Be Cleared", AvailableSemesters: []int{1}, Workload: 3.0}
	s.s.CreateCourse(course)
	major := interfaces.MajorData{ID: uuid.New(), Title: "Test Major", School: "Tech"}
	s.s.CreateMajor(major)
	_ = requirements.AddFlatRequirement(s.s, major.ID, requirements.FlatRequirementInput{ID: uuid.New(), CourseID: course.ID})
	s.s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: course.ID, RequiredCourseID: &course.ID})

	courses, _ := s.s.GetAllCourses()
	assert.Len(s.T(), courses, 1)
	reqs, _ := requirements.NewResolver(s.s).ProjectMajorRequirements(major.ID)
	assert.Len(s.T(), reqs, 1)
	deps, _ := s.s.GetCourseDependencies()
	assert.Len(s.T(), deps, 1)

	s.s.ClearAll()

	courses, _ = s.s.GetAllCourses()
	assert.Len(s.T(), courses, 0) // Courses SHOULD be cleared

	reqs, _ = requirements.NewResolver(s.s).ProjectMajorRequirements(major.ID)
	assert.Len(s.T(), reqs, 0) // Requirements should be cleared

	deps, _ = s.s.GetCourseDependencies()
	assert.Len(s.T(), deps, 0) // Dependencies should be cleared
}

func (s *MemoryStoreTestSuite) TestSyncCreatesDisciplineGroupDependencyBoxes() {
	sheetsData := map[string][]map[string]string{
		"Разработка 2025": {
			{
				"Название курса": "Python Basics",
				"Тип курса":      "Major Core",
				"Поток":          "2025",
			},
			{
				"Название курса": "Advanced Python",
				"Тип курса":      "Major Core",
				"Поток":          "2025",
				"Пререквизиты":   "Python Basics",
			},
			{
				"Название курса": "Go Basics",
				"Тип курса":      "Major Core",
				"Поток":          "2025",
				"Кореквизиты":    "Python Basics",
			},
		},
	}
	sheetMapping := map[string]SheetMajorMapping{
		"Разработка 2025": {"Разработка", "Tech", enums.CourseCategorySWE},
	}

	_, err := SyncFromSheetData(s.s, sheetsData, sheetMapping)
	assert.NoError(s.T(), err)

	deps, err := s.s.GetCourseDependencies()
	assert.NoError(s.T(), err)
	assert.Len(s.T(), deps, 2)

	for _, dep := range deps {
		assert.NotNil(s.T(), dep.RequiredGroupID)
		assert.NotNil(s.T(), dep.RequiredCourseID)
	}

	groups, err := s.s.GetAllDisciplineGroups()
	assert.NoError(s.T(), err)
	assert.Len(s.T(), groups, 2)

	categories := []string{groups[0].Category, groups[1].Category}
	assert.Contains(s.T(), categories, "prerequisite")
	assert.Contains(s.T(), categories, "corequisite")
}

func TestMemoryStoreSuite(t *testing.T) {
	suite.Run(t, new(MemoryStoreTestSuite))
}

func TestLoadCoursesFromCSV(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
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
	s.Init("admin")
	defer s.Close()

	err := s.SeedAllData()
	assert.NoError(t, err)

	courses, _ := s.GetAllCourses()
	assert.NotZero(t, len(courses))

	students, _ := s.GetAllStudents()
	assert.Len(t, students, 1)
}
