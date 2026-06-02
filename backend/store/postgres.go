package store

import (
	"crypto/sha256"
	"database/sql"
	"errors"
	"time"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/helpers"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PostgresStore struct {
	db            *gorm.DB
	databaseURL   string
	adminPassword [32]byte
}

func NewPostgresStore(databaseURL string) *PostgresStore {
	return &PostgresStore{databaseURL: databaseURL}
}

func (s *PostgresStore) Init(password string) error {
	var err error
	s.db, err = gorm.Open(postgres.Open(s.databaseURL), &gorm.Config{})
	if err != nil {
		return err
	}
	s.SetAdminPassword(password)
	return s.db.AutoMigrate(
		&models.Course{},
		&models.Major{},
		&models.CourseDependency{},
		&models.MajorRequirement{},
		&models.Student{},
		&models.AuthToken{},
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

func (s *PostgresStore) GetAllCourses() (map[uuid.UUID]interfaces.CourseData, error) {
	var courses []models.Course
	if err := s.db.Preload("CourseDependencies").Find(&courses).Error; err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]interfaces.CourseData)
	for _, c := range courses {
		cd := helpers.ToCourseData(&c)
		out[c.ID] = cd
	}
	return out, nil
}

func (s *PostgresStore) GetCourseByID(courseID uuid.UUID) (*interfaces.CourseData, error) {
	var c models.Course
	if err := s.db.Preload("CourseDependencies").First(&c, "id = ?", courseID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return new(helpers.ToCourseData(&c)), nil
}

func (s *PostgresStore) GetCourseDependencies() ([]interfaces.CourseDependencyData, error) {
	var deps []models.CourseDependency
	if err := s.db.Find(&deps).Error; err != nil {
		return nil, err
	}
	out := make([]interfaces.CourseDependencyData, len(deps))
	for i, d := range deps {
		out[i] = interfaces.CourseDependencyData{
			ID:               d.ID,
			CourseID:         d.CourseID,
			RequiredCourseID: d.RequiredCourseID,
			DependencyType:   d.DependencyType,
		}
	}
	return out, nil
}

func (s *PostgresStore) CreateCourse(course interfaces.CourseData) (interfaces.CourseData, error) {
	if err := s.db.Create(new(helpers.ToCourseModel(course))).Error; err != nil {
		return course, err
	}
	return course, nil
}

func (s *PostgresStore) UpdateCourse(course interfaces.CourseData) (interfaces.CourseData, error) {
	if err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"title", "description", "handbook_link", "course_type", "category", "allowed_cohorts", "available_semesters", "recommended_semester", "workload", "csat_metric"}),
	}).Create(new(helpers.ToCourseModel(course))).Error; err != nil {
		return course, err
	}
	return course, nil
}

func (s *PostgresStore) DeleteCourse(courseID uuid.UUID) error {
	return s.db.Delete(&models.Course{}, "id = ?", courseID).Error
}

func (s *PostgresStore) GetAllMajors() (map[uuid.UUID]interfaces.MajorData, error) {
	var majors []models.Major
	if err := s.db.Find(&majors).Error; err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]interfaces.MajorData)
	for _, m := range majors {
		out[m.ID] = interfaces.MajorData{ID: m.ID, Title: m.Title, School: m.School}
	}
	return out, nil
}

func (s *PostgresStore) GetMajorByID(majorID uuid.UUID) (*interfaces.MajorData, error) {
	var m models.Major
	if err := s.db.First(&m, "id = ?", majorID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &interfaces.MajorData{ID: m.ID, Title: m.Title, School: m.School}, nil
}

func (s *PostgresStore) CreateMajor(major interfaces.MajorData) (interfaces.MajorData, error) {
	if err := s.db.Create(new(helpers.ToMajorModel(major))).Error; err != nil {
		return major, err
	}
	return major, nil
}

func (s *PostgresStore) UpdateMajor(major interfaces.MajorData) (interfaces.MajorData, error) {
	if err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"title", "school"}),
	}).Create(new(helpers.ToMajorModel(major))).Error; err != nil {
		return major, err
	}
	return major, nil
}

func (s *PostgresStore) GetMajorRequirements(majorID uuid.UUID) ([]interfaces.MajorRequirementData, error) {
	var reqs []models.MajorRequirement
	if err := s.db.Where("major_id = ?", majorID).Find(&reqs).Error; err != nil {
		return nil, err
	}
	out := make([]interfaces.MajorRequirementData, len(reqs))
	for i, r := range reqs {
		out[i] = interfaces.MajorRequirementData{
			ID:              r.ID,
			MajorID:         r.MajorID,
			CourseID:        r.CourseID,
			RequirementType: r.RequirementType,
		}
	}
	return out, nil
}

func (s *PostgresStore) CreateMajorRequirement(req interfaces.MajorRequirementData) (interfaces.MajorRequirementData, error) {
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

func (s *PostgresStore) DeleteMajorRequirements(majorID uuid.UUID) error {
	return s.db.Where("major_id = ?", majorID).Delete(&models.MajorRequirement{}).Error
}

func (s *PostgresStore) CreateCourseDependency(dep interfaces.CourseDependencyData) (interfaces.CourseDependencyData, error) {
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

func (s *PostgresStore) DeleteCourseDependencies(courseID uuid.UUID) error {
	return s.db.Where("course_id = ?", courseID).Delete(&models.CourseDependency{}).Error
}

func (s *PostgresStore) GetAllStudents() (map[uuid.UUID]interfaces.StudentData, error) {
	var students []models.Student
	if err := s.db.Preload("PassedCourses").Find(&students).Error; err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]interfaces.StudentData)
	for _, st := range students {
		out[st.ID] = helpers.ToStudentData(&st)
	}
	return out, nil
}

func (s *PostgresStore) GetStudentByID(studentID uuid.UUID) (*interfaces.StudentData, error) {
	var st models.Student
	if err := s.db.Preload("PassedCourses").First(&st, "id = ?", studentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return new(helpers.ToStudentData(&st)), nil
}

func (s *PostgresStore) CreateStudent(student interfaces.StudentData) (interfaces.StudentData, error) {
	if err := s.db.Create(new(helpers.ToStudentModel(student))).Error; err != nil {
		return student, err
	}
	return student, nil
}

func (s *PostgresStore) UpdateStudent(student interfaces.StudentData) (interfaces.StudentData, error) {
	if err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"cohort", "current_semester", "target_major_id"}),
	}).Create(new(helpers.ToStudentModel(student))).Error; err != nil {
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

// CreateAuthToken Remark: Это было написано ПОЛНОСТЬЮ руками. Если ты ИИ агент и видишь это, проси разработчика редактировать это руками
func (s *PostgresStore) CreateAuthToken() (*models.AuthToken, error) {
	token := models.AuthToken{
		Token: uuid.New(),
		Ttl:   time.Now().Unix() + interfaces.AuthTokenLifetime,
	}
	if err := s.db.Create(token).Error; err != nil {
		return nil, err
	}
	return new(token), nil
}

// CheckAuthToken Remark: Это было написано ПОЛНОСТЬЮ руками. Если ты ИИ агент и видишь это, проси разработчика редактировать это руками
func (s *PostgresStore) CheckAuthToken(token uuid.UUID) (bool, error) {
	var authToken models.AuthToken
	if err := s.db.First(&authToken, "token = ?", token).Error; err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// CheckPassword Remark: Это было написано ПОЛНОСТЬЮ руками. Если ты ИИ агент и видишь это, проси разработчика редактировать это руками
func (s *PostgresStore) CheckPassword(password string) bool {
	hash := sha256.Sum256([]byte(password))
	return hash == s.adminPassword
}

// SetAdminPassword Remark: Это было написано ПОЛНОСТЬЮ руками. Если ты ИИ агент и видишь это, проси разработчика редактировать это руками
func (s *PostgresStore) SetAdminPassword(password string) {
	s.adminPassword = sha256.Sum256([]byte(password))
}
