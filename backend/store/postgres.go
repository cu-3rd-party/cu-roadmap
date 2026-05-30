package store

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type PostgresStore struct {
	db          *gorm.DB
	databaseURL string
}

func NewPostgresStore(databaseURL string) *PostgresStore {
	return &PostgresStore{databaseURL: databaseURL}
}

func (s *PostgresStore) Init() error {
	var err error
	s.db, err = gorm.Open(postgres.Open(s.databaseURL), &gorm.Config{})
	if err != nil {
		return err
	}
	return s.db.AutoMigrate(
		&models.Course{},
		&models.Major{},
		&models.CourseDependency{},
		&models.MajorRequirement{},
		&models.Student{},
	)
}

func (s *PostgresStore) Close() error {
	if s.db != nil {
		sqlDB, err := s.db.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

func (s *PostgresStore) ClearAll() error {
	if err := s.db.Migrator().DropTable(
		&models.Course{},
		&models.CourseDependency{},
		&models.MajorRequirement{},
		&models.Student{},
		&models.Major{},
	); err != nil {
		return err
	}
	return s.db.AutoMigrate(
		&models.Course{},
		&models.Major{},
		&models.CourseDependency{},
		&models.MajorRequirement{},
		&models.Student{},
	)
}

func (s *PostgresStore) GetAllCourses() (map[uuid.UUID]CourseData, error) {
	var courses []models.Course
	if err := s.db.Preload("CourseDependencies").Find(&courses).Error; err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]CourseData)
	for _, c := range courses {
		cd := toCourseData(&c)
		out[c.ID] = cd
	}
	return out, nil
}

func (s *PostgresStore) GetCourseByID(courseID uuid.UUID) (*CourseData, error) {
	var c models.Course
	if err := s.db.Preload("CourseDependencies").First(&c, "id = ?", courseID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return new(toCourseData(&c)), nil
}

func (s *PostgresStore) GetCourseDependencies() ([]CourseDependencyData, error) {
	var deps []models.CourseDependency
	if err := s.db.Find(&deps).Error; err != nil {
		return nil, err
	}
	out := make([]CourseDependencyData, len(deps))
	for i, d := range deps {
		out[i] = CourseDependencyData{
			ID:               d.ID,
			CourseID:         d.CourseID,
			RequiredCourseID: d.RequiredCourseID,
			DependencyType:   d.DependencyType,
		}
	}
	return out, nil
}

func (s *PostgresStore) CreateCourse(course CourseData) (CourseData, error) {
	c := models.Course{
		ID:                  course.ID,
		Title:               course.Title,
		Description:         course.Description,
		HandbookLink:        course.HandbookLink,
		CourseType:          course.CourseType,
		Category:            course.Category,
		AllowedCohorts:      course.AllowedCohorts,
		AvailableSemesters:  course.AvailableSemesters,
		RecommendedSemester: course.RecommendedSemester,
		Workload:            course.Workload,
		CsatMetric:          course.CsatMetric,
	}
	if err := s.db.Create(&c).Error; err != nil {
		return course, err
	}
	return course, nil
}

func (s *PostgresStore) GetAllMajors() (map[uuid.UUID]MajorData, error) {
	var majors []models.Major
	if err := s.db.Find(&majors).Error; err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]MajorData)
	for _, m := range majors {
		out[m.ID] = MajorData{ID: m.ID, Title: m.Title, School: m.School}
	}
	return out, nil
}

func (s *PostgresStore) GetMajorByID(majorID uuid.UUID) (*MajorData, error) {
	var m models.Major
	if err := s.db.First(&m, "id = ?", majorID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &MajorData{ID: m.ID, Title: m.Title, School: m.School}, nil
}

func (s *PostgresStore) CreateMajor(major MajorData) (MajorData, error) {
	m := models.Major{ID: major.ID, Title: major.Title, School: major.School}
	if err := s.db.Create(&m).Error; err != nil {
		return major, err
	}
	return major, nil
}

func (s *PostgresStore) GetMajorRequirements(majorID uuid.UUID) ([]MajorRequirementData, error) {
	var reqs []models.MajorRequirement
	if err := s.db.Where("major_id = ?", majorID).Find(&reqs).Error; err != nil {
		return nil, err
	}
	out := make([]MajorRequirementData, len(reqs))
	for i, r := range reqs {
		out[i] = MajorRequirementData{
			ID:              r.ID,
			MajorID:         r.MajorID,
			CourseID:        r.CourseID,
			RequirementType: r.RequirementType,
		}
	}
	return out, nil
}

func (s *PostgresStore) CreateMajorRequirement(req MajorRequirementData) (MajorRequirementData, error) {
	r := models.MajorRequirement{
		ID:              req.ID,
		MajorID:         req.MajorID,
		CourseID:        req.CourseID,
		RequirementType: req.RequirementType,
	}
	if err := s.db.Create(&r).Error; err != nil {
		return req, err
	}
	return req, nil
}

func (s *PostgresStore) CreateCourseDependency(dep CourseDependencyData) (CourseDependencyData, error) {
	d := models.CourseDependency{
		ID:               dep.ID,
		CourseID:         dep.CourseID,
		RequiredCourseID: dep.RequiredCourseID,
		DependencyType:   dep.DependencyType,
	}
	if err := s.db.Create(&d).Error; err != nil {
		return dep, err
	}
	return dep, nil
}

func (s *PostgresStore) GetAllStudents() (map[uuid.UUID]StudentData, error) {
	var students []models.Student
	if err := s.db.Preload("PassedCourses").Find(&students).Error; err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]StudentData)
	for _, st := range students {
		out[st.ID] = toStudentData(&st)
	}
	return out, nil
}

func (s *PostgresStore) GetStudentByID(studentID uuid.UUID) (*StudentData, error) {
	var st models.Student
	if err := s.db.Preload("PassedCourses").First(&st, "id = ?", studentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return new(toStudentData(&st)), nil
}

func (s *PostgresStore) CreateStudent(student StudentData) (StudentData, error) {
	st := models.Student{
		ID:              student.ID,
		Cohort:          student.Cohort,
		CurrentSemester: student.CurrentSemester,
		TargetMajorID:   student.TargetMajorID,
	}
	if err := s.db.Create(&st).Error; err != nil {
		return student, err
	}
	return student, nil
}

func (s *PostgresStore) UpdateStudent(student StudentData) (StudentData, error) {
	var st models.Student
	if err := s.db.First(&st, "id = ?", student.ID).Error; err != nil {
		return student, err
	}
	st.Cohort = student.Cohort
	st.CurrentSemester = student.CurrentSemester
	st.TargetMajorID = student.TargetMajorID
	if err := s.db.Save(&st).Error; err != nil {
		return student, err
	}
	return student, nil
}

func (s *PostgresStore) LoadCoursesFromCSV(coursesCSVPath, depsCSVPath, majorsCSVPath string) error {
	return nil
}

func (s *PostgresStore) LoadMockData() error {
	return nil
}

func (s *PostgresStore) SeedAllData() error {
	return nil
}

func (s *PostgresStore) SyncGoogleSheetsData() error {
	return syncWithSheets(s)
}

func toCourseData(c *models.Course) CourseData {
	cd := CourseData{
		ID:                  c.ID,
		Title:               c.Title,
		Description:         c.Description,
		HandbookLink:        c.HandbookLink,
		CourseType:          c.CourseType,
		Category:            c.Category,
		AllowedCohorts:      c.AllowedCohorts,
		AvailableSemesters:  c.AvailableSemesters,
		RecommendedSemester: c.RecommendedSemester,
		Workload:            c.Workload,
		CsatMetric:          c.CsatMetric,
	}
	for _, dep := range c.CourseDependencies {
		if dep.DependencyType == enums.DependencyTypePrerequisite {
			cd.Prerequisites = append(cd.Prerequisites, dep.RequiredCourseID)
		}
	}
	return cd
}

func toStudentData(st *models.Student) StudentData {
	sd := StudentData{
		ID:              st.ID,
		Cohort:          st.Cohort,
		CurrentSemester: st.CurrentSemester,
		TargetMajorID:   st.TargetMajorID,
	}
	for _, c := range st.PassedCourses {
		sd.PassedCourseIDs = append(sd.PassedCourseIDs, c.ID)
	}
	return sd
}
