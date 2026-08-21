package store

import (
	"crypto/sha256"
	"errors"
	"log/slog"
	"strings"
	"sync"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/metrics"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/helpers"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type legacyMajorRequirement struct {
	ID              uuid.UUID
	MajorID         uuid.UUID
	CourseID        uuid.UUID
	RequirementType enums.RequirementType
	Specializations pq.StringArray
}

type PostgresStore struct {
	db            *gorm.DB
	databaseURL   string
	adminPassword [32]byte
	Synced        bool
	syncMu        sync.Mutex
}

func (s *PostgresStore) Ready() bool {
	if s.adminPassword == [32]byte{} {
		return false
	}

	if !s.Synced || s.db == nil {
		return false
	}

	status := s.db.Select("1").Error
	if status != nil {
		slog.Error("failed to ping postgres", "error", status.Error())
		return false
	}
	return true
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
	err = registerDBMetricsCallbacks(s.db)
	if err != nil {
		return err
	}
	s.SetAdminPassword(password)
	err = s.db.AutoMigrate(
		&models.Course{},
		&models.Box{},
		&models.BoxEdge{},
		&models.Major{},
		&models.Specialization{},
		&models.CourseRestriction{},
		&models.CourseDependency{},
		&models.Student{},
		&models.DisciplineGroup{},
	)
	if err != nil {
		return err
	}
	return s.backfillLegacyRequirementBoxes()
}

func (s *PostgresStore) backfillLegacyRequirementBoxes() error {
	if !s.db.Migrator().HasTable("major_requirements") {
		return nil
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		rootOp := enums.LogicalOpAnd

		var majors []models.Major
		if err := tx.Find(&majors).Error; err != nil {
			return err
		}
		majorRoots := make(map[uuid.UUID]uuid.UUID, len(majors))
		for _, major := range majors {
			rootID := major.RequirementsBoxID
			if rootID == nil {
				createdID := uuid.New()
				if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, DoNothing: true}).Create(&models.Box{
					ID:        createdID,
					Kind:      enums.BoxKindLogical,
					Title:     major.Title + " requirements",
					LogicalOp: &rootOp,
				}).Error; err != nil {
					return err
				}
				if err := tx.Model(&models.Major{}).Where("id = ?", major.ID).Update("requirements_box_id", createdID).Error; err != nil {
					return err
				}
				rootID = &createdID
			}
			majorRoots[major.ID] = *rootID
		}

		var specs []models.Specialization
		if err := tx.Find(&specs).Error; err != nil {
			return err
		}
		specRoots := make(map[uuid.UUID]uuid.UUID, len(specs))
		specTitleToIDByMajor := make(map[uuid.UUID]map[string]uuid.UUID)
		for _, spec := range specs {
			rootID := spec.RequirementsBoxID
			if rootID == nil {
				createdID := uuid.New()
				if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, DoNothing: true}).Create(&models.Box{
					ID:        createdID,
					Kind:      enums.BoxKindLogical,
					Title:     spec.Title + " requirements",
					LogicalOp: &rootOp,
				}).Error; err != nil {
					return err
				}
				if err := tx.Model(&models.Specialization{}).Where("id = ?", spec.ID).Update("requirements_box_id", createdID).Error; err != nil {
					return err
				}
				rootID = &createdID
			}
			specRoots[spec.ID] = *rootID
			if specTitleToIDByMajor[spec.MajorID] == nil {
				specTitleToIDByMajor[spec.MajorID] = make(map[string]uuid.UUID)
			}
			specTitleToIDByMajor[spec.MajorID][strings.ToLower(strings.TrimSpace(spec.Title))] = spec.ID
		}

		var reqs []legacyMajorRequirement
		if err := tx.Table("major_requirements").Find(&reqs).Error; err != nil {
			return err
		}

		for _, req := range reqs {
			reqType := req.RequirementType
			leaf := models.Box{
				ID:              req.ID,
				Kind:            enums.BoxKindCourse,
				CourseID:        &req.CourseID,
				RequirementType: &reqType,
				Specializations: req.Specializations,
			}
			if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, DoNothing: true}).Create(&leaf).Error; err != nil {
				return err
			}

			if req.RequirementType != enums.RequirementTypeMajorChoice || len(req.Specializations) == 0 {
				parentID, ok := majorRoots[req.MajorID]
				if !ok {
					continue
				}
				edgeID := uuid.NewSHA1(uuid.NameSpaceOID, []byte(parentID.String()+"|"+req.ID.String()))
				if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, DoNothing: true}).Create(&models.BoxEdge{
					ID:          edgeID,
					ParentBoxID: parentID,
					ChildBoxID:  req.ID,
				}).Error; err != nil {
					return err
				}
				continue
			}

			majorSpecs := specTitleToIDByMajor[req.MajorID]
			for _, title := range req.Specializations {
				specID, ok := majorSpecs[strings.ToLower(strings.TrimSpace(title))]
				if !ok {
					continue
				}
				parentID, ok := specRoots[specID]
				if !ok {
					continue
				}
				edgeID := uuid.NewSHA1(uuid.NameSpaceOID, []byte(parentID.String()+"|"+req.ID.String()))
				if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, DoNothing: true}).Create(&models.BoxEdge{
					ID:          edgeID,
					ParentBoxID: parentID,
					ChildBoxID:  req.ID,
				}).Error; err != nil {
					return err
				}
			}
		}

		slog.Info("legacy major_requirements backfill complete", "majors", len(majors), "specializations", len(specs), "requirements", len(reqs))
		return nil
	})
}

func registerDBMetricsCallbacks(db *gorm.DB) error {
	err := db.Callback().Query().Before("gorm:query").Register("cu-roadmap:metrics:query", func(*gorm.DB) {
		metrics.ObserveDBQuery("query")
	})
	if err != nil {
		return err
	}
	err = db.Callback().Create().Before("gorm:create").Register("cu-roadmap:metrics:create", func(*gorm.DB) {
		metrics.ObserveDBQuery("create")
	})
	if err != nil {
		return err
	}
	err = db.Callback().Update().Before("gorm:update").Register("cu-roadmap:metrics:update", func(*gorm.DB) {
		metrics.ObserveDBQuery("update")
	})
	if err != nil {
		return err
	}
	err = db.Callback().Delete().Before("gorm:delete").Register("cu-roadmap:metrics:delete", func(*gorm.DB) {
		metrics.ObserveDBQuery("delete")
	})
	if err != nil {
		return err
	}
	err = db.Callback().Row().Before("gorm:row").Register("cu-roadmap:metrics:row", func(*gorm.DB) {
		metrics.ObserveDBQuery("row")
	})
	if err != nil {
		return err
	}
	err = db.Callback().Raw().Before("gorm:raw").Register("cu-roadmap:metrics:raw", func(*gorm.DB) {
		metrics.ObserveDBQuery("raw")
	})
	if err != nil {
		return err
	}
	return nil
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
	if err := s.db.Exec("DELETE FROM box_edges").Error; err != nil {
		return err
	}
	if err := s.db.Exec("DELETE FROM student_passed_courses").Error; err != nil {
		return err
	}
	if err := s.db.Exec("UPDATE students SET target_major_id = NULL").Error; err != nil {
		return err
	}
	if err := s.db.Exec("DELETE FROM course_dependencies").Error; err != nil {
		return err
	}
	if err := s.db.Exec("DELETE FROM specializations").Error; err != nil {
		return err
	}
	if err := s.db.Exec("DELETE FROM majors").Error; err != nil {
		return err
	}
	if err := s.db.Exec("DELETE FROM boxes").Error; err != nil {
		return err
	}
	if err := s.db.Exec("DELETE FROM courses").Error; err != nil {
		return err
	}
	return nil
}

func (s *PostgresStore) GetAllCourses() (map[uuid.UUID]interfaces.CourseData, error) {
	var courses []models.Course
	if err := s.db.Preload("CourseDependencies").Find(&courses).Error; err != nil {
		return nil, err
	}

	postrequisiteMap := buildPostrequisitesFromCourses(courses)

	out := make(map[uuid.UUID]interfaces.CourseData)
	for _, c := range courses {
		cd := helpers.ToCourseData(&c)
		cd.Postrequisites = postrequisiteMap[c.ID]
		out[c.ID] = cd
	}
	return out, nil
}

func buildPostrequisitesFromCourses(courses []models.Course) map[uuid.UUID][]uuid.UUID {
	m := make(map[uuid.UUID][]uuid.UUID)
	for _, c := range courses {
		for _, dep := range c.CourseDependencies {
			if dep.DependencyType == enums.DependencyTypePrerequisite && dep.RequiredCourseID != nil {
				m[*dep.RequiredCourseID] = append(m[*dep.RequiredCourseID], c.ID)
			}
		}
	}
	return m
}

func (s *PostgresStore) GetCourses(filter interfaces.CourseFilter) ([]interfaces.CourseData, error) {
	query := s.db.Preload("CourseDependencies")

	if len(filter.CohortYears) > 0 {
		years := make(pq.Int64Array, len(filter.CohortYears))
		for i, y := range filter.CohortYears {
			years[i] = int64(y)
		}
		query = query.Where("(allowed_cohorts IS NULL OR array_length(allowed_cohorts, 1) IS NULL OR allowed_cohorts && ?)", years)
	}

	if filter.Title != "" {
		query = query.Where("LOWER(title) LIKE ?", "%"+strings.ToLower(filter.Title)+"%")
	}

	if len(filter.CourseTypes) > 0 {
		query = query.Where("course_type IN ?", filter.CourseTypes)
	}

	if len(filter.Categories) > 0 {
		query = query.Where("category IN ?", filter.Categories)
	}

	if filter.WorkloadOp != "" {
		switch filter.WorkloadOp {
		case "<":
			query = query.Where("workload < ?", filter.WorkloadVal)
		case "=":
			query = query.Where("workload = ?", filter.WorkloadVal)
		case ">":
			query = query.Where("workload > ?", filter.WorkloadVal)
		}
	}

	var courses []models.Course
	if err := query.Find(&courses).Error; err != nil {
		return nil, err
	}

	postrequisiteMap := buildPostrequisitesFromCourses(courses)

	out := make([]interfaces.CourseData, len(courses))
	for i, c := range courses {
		out[i] = helpers.ToCourseData(&c)
		out[i].Postrequisites = postrequisiteMap[c.ID]
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
	cd := helpers.ToCourseData(&c)
	var deps []models.CourseDependency
	if err := s.db.Where("required_course_id = ? AND dependency_type = ?", courseID, enums.DependencyTypePrerequisite).Find(&deps).Error; err != nil {
		return nil, err
	}
	for _, dep := range deps {
		cd.Postrequisites = append(cd.Postrequisites, dep.CourseID)
	}
	return &cd, nil
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
			RequiredGroupID:  d.RequiredGroupID,
			DependencyType:   d.DependencyType,
			AlternativeGroup: d.AlternativeGroup,
		}
	}
	return out, nil
}

func (s *PostgresStore) CreateCourse(course interfaces.CourseData) (interfaces.CourseData, error) {
	if err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		UpdateAll: true,
	}).Create(new(helpers.ToCourseModel(course))).Error; err != nil {
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
		out[m.ID] = interfaces.MajorData{ID: m.ID, Title: m.Title, School: m.School, CohortYear: m.CohortYear, RequirementsBoxID: m.RequirementsBoxID}
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
	return &interfaces.MajorData{ID: m.ID, Title: m.Title, School: m.School, CohortYear: m.CohortYear, RequirementsBoxID: m.RequirementsBoxID}, nil
}

func (s *PostgresStore) CreateMajor(major interfaces.MajorData) (interfaces.MajorData, error) {
	if major.RequirementsBoxID == nil {
		rootOp := enums.LogicalOpAnd
		rootID := uuid.New()
		if _, err := s.CreateBox(interfaces.BoxData{ID: rootID, Kind: enums.BoxKindLogical, Title: major.Title + " requirements", LogicalOp: &rootOp}); err != nil {
			return major, err
		}
		major.RequirementsBoxID = &rootID
	}
	if err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		UpdateAll: true,
	}).Create(new(helpers.ToMajorModel(major))).Error; err != nil {
		return major, err
	}
	return major, nil
}

func (s *PostgresStore) UpdateMajor(major interfaces.MajorData) (interfaces.MajorData, error) {
	if err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"title", "school", "cohort_year", "requirements_box_id"}),
	}).Create(new(helpers.ToMajorModel(major))).Error; err != nil {
		return major, err
	}
	return major, nil
}

func (s *PostgresStore) DeleteMajor(majorID uuid.UUID) error {
	return s.db.Delete(&models.Major{}, majorID).Error
}

func (s *PostgresStore) GetAllBoxes() (map[uuid.UUID]interfaces.BoxData, error) {
	var boxes []models.Box
	if err := s.db.Find(&boxes).Error; err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]interfaces.BoxData, len(boxes))
	for _, box := range boxes {
		out[box.ID] = helpers.ToBoxData(&box)
	}
	return out, nil
}

func (s *PostgresStore) GetBoxByID(boxID uuid.UUID) (*interfaces.BoxData, error) {
	var box models.Box
	if err := s.db.First(&box, "id = ?", boxID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	boxData := helpers.ToBoxData(&box)
	return &boxData, nil
}

func (s *PostgresStore) CreateBox(box interfaces.BoxData) (interfaces.BoxData, error) {
	if err := s.db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, UpdateAll: true}).Create(new(helpers.ToBoxModel(box))).Error; err != nil {
		return box, err
	}
	return box, nil
}

func (s *PostgresStore) UpdateBox(box interfaces.BoxData) (interfaces.BoxData, error) {
	if err := s.db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, UpdateAll: true}).Create(new(helpers.ToBoxModel(box))).Error; err != nil {
		return box, err
	}
	return box, nil
}

func (s *PostgresStore) DeleteBox(boxID uuid.UUID) error {
	return s.db.Delete(&models.Box{}, "id = ?", boxID).Error
}

func (s *PostgresStore) GetBoxEdges() ([]interfaces.BoxEdgeData, error) {
	var edges []models.BoxEdge
	if err := s.db.Find(&edges).Error; err != nil {
		return nil, err
	}
	out := make([]interfaces.BoxEdgeData, len(edges))
	for i, edge := range edges {
		out[i] = interfaces.BoxEdgeData{ID: edge.ID, ParentBoxID: edge.ParentBoxID, ChildBoxID: edge.ChildBoxID, Position: edge.Position}
	}
	return out, nil
}

func (s *PostgresStore) CreateBoxEdge(edge interfaces.BoxEdgeData) (interfaces.BoxEdgeData, error) {
	model := models.BoxEdge{ID: edge.ID, ParentBoxID: edge.ParentBoxID, ChildBoxID: edge.ChildBoxID, Position: edge.Position}
	if err := s.db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "id"}}, UpdateAll: true}).Create(&model).Error; err != nil {
		return edge, err
	}
	return edge, nil
}

func (s *PostgresStore) DeleteBoxEdgesByParent(parentBoxID uuid.UUID) error {
	return s.db.Where("parent_box_id = ?", parentBoxID).Delete(&models.BoxEdge{}).Error
}

func (s *PostgresStore) DeleteBoxEdgesByChild(childBoxID uuid.UUID) error {
	return s.db.Where("child_box_id = ?", childBoxID).Delete(&models.BoxEdge{}).Error
}

func (s *PostgresStore) DeleteBoxEdge(id uuid.UUID) error {
	return s.db.Where("id = ?", id).Delete(&models.BoxEdge{}).Error
}

func (s *PostgresStore) CreateCourseDependency(dep interfaces.CourseDependencyData) (interfaces.CourseDependencyData, error) {
	d := models.CourseDependency{
		ID:               dep.ID,
		CourseID:         dep.CourseID,
		RequiredCourseID: dep.RequiredCourseID,
		RequiredGroupID:  dep.RequiredGroupID,
		DependencyType:   dep.DependencyType,
		AlternativeGroup: dep.AlternativeGroup,
	}
	if err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoNothing: true,
	}).Create(&d).Error; err != nil {
		return dep, err
	}
	return dep, nil
}

func (s *PostgresStore) DeleteCourseDependencies(courseID uuid.UUID) error {
	return s.db.Where("course_id = ?", courseID).Delete(&models.CourseDependency{}).Error
}

func (s *PostgresStore) DeleteCourseDependency(id uuid.UUID) error {
	return s.db.Where("id = ?", id).Delete(&models.CourseDependency{}).Error
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
	s.syncMu.Lock()
	defer s.syncMu.Unlock()
	s.Synced = false
	err := syncWithSheets(s)
	s.Synced = err == nil
	if err == nil {
		if cache := GetCacheStore(); cache != nil && cache.Ready() {
			_ = cache.DeleteByPrefix("courses:")
			_ = cache.DeleteByPrefix("majors:")
		}
	}
	return err
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

func (s *PostgresStore) GetSpecializationsByMajor(majorID uuid.UUID) ([]interfaces.SpecializationData, error) {
	var specs []models.Specialization
	if err := s.db.Where("major_id = ?", majorID).Find(&specs).Error; err != nil {
		return nil, err
	}
	out := make([]interfaces.SpecializationData, len(specs))
	for i, sp := range specs {
		out[i] = interfaces.SpecializationData{ID: sp.ID, MajorID: sp.MajorID, Title: sp.Title, RequirementsBoxID: sp.RequirementsBoxID}
	}
	return out, nil
}

func (s *PostgresStore) CreateSpecialization(spec interfaces.SpecializationData) (interfaces.SpecializationData, error) {
	if spec.RequirementsBoxID == nil {
		rootOp := enums.LogicalOpAnd
		rootID := uuid.New()
		if _, err := s.CreateBox(interfaces.BoxData{ID: rootID, Kind: enums.BoxKindLogical, Title: spec.Title + " requirements", LogicalOp: &rootOp}); err != nil {
			return spec, err
		}
		spec.RequirementsBoxID = &rootID
	}
	sModel := helpers.ToSpecializationModel(spec)
	if err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoNothing: true,
	}).Create(&sModel).Error; err != nil {
		return spec, err
	}
	return spec, nil
}

func (s *PostgresStore) DeleteSpecializations(majorID uuid.UUID) error {
	return s.db.Where("major_id = ?", majorID).Delete(&models.Specialization{}).Error
}

func (s *PostgresStore) UpdateSpecialization(spec interfaces.SpecializationData) (interfaces.SpecializationData, error) {
	sModel := helpers.ToSpecializationModel(spec)
	if err := s.db.Save(&sModel).Error; err != nil {
		return spec, err
	}
	return spec, nil
}

func (s *PostgresStore) CreateCourseRestriction(restriction interfaces.CourseRestrictionData) (interfaces.CourseRestrictionData, error) {
	rModel := models.CourseRestriction{
		ID:                  restriction.ID,
		SpecializationID:    restriction.SpecializationID,
		Semester:            restriction.Semester,
		Category:            restriction.Category,
		MinCourses:          restriction.MinCourses,
		MaxCourses:          restriction.MaxCourses,
		InternalDescription: restriction.InternalDescription,
	}
	if rModel.ID == uuid.Nil {
		rModel.ID = uuid.New()
	}
	if err := s.db.Create(&rModel).Error; err != nil {
		return restriction, err
	}
	restriction.ID = rModel.ID
	return restriction, nil
}

func (s *PostgresStore) UpdateCourseRestriction(restriction interfaces.CourseRestrictionData) (interfaces.CourseRestrictionData, error) {
	rModel := models.CourseRestriction{
		ID:                  restriction.ID,
		SpecializationID:    restriction.SpecializationID,
		Semester:            restriction.Semester,
		Category:            restriction.Category,
		MinCourses:          restriction.MinCourses,
		MaxCourses:          restriction.MaxCourses,
		InternalDescription: restriction.InternalDescription,
	}
	if err := s.db.Save(&rModel).Error; err != nil {
		return restriction, err
	}
	return restriction, nil
}

func (s *PostgresStore) DeleteCourseRestriction(restrictionID uuid.UUID) error {
	return s.db.Where("id = ?", restrictionID).Delete(&models.CourseRestriction{}).Error
}

func (s *PostgresStore) GetCourseRestrictionByID(restrictionID uuid.UUID) (*interfaces.CourseRestrictionData, error) {
	var r models.CourseRestriction
	if err := s.db.First(&r, "id = ?", restrictionID).Error; err != nil {
		return nil, err
	}
	result := &interfaces.CourseRestrictionData{
		ID:                  r.ID,
		SpecializationID:    r.SpecializationID,
		Semester:            r.Semester,
		Category:            r.Category,
		MinCourses:          r.MinCourses,
		MaxCourses:          r.MaxCourses,
		InternalDescription: r.InternalDescription,
	}
	return result, nil
}

func (s *PostgresStore) GetCourseRestrictionsBySpecialization(specializationID uuid.UUID) ([]interfaces.CourseRestrictionData, error) {
	var restrictions []models.CourseRestriction
	if err := s.db.Where("specialization_id = ?", specializationID).Order("semester, category").Find(&restrictions).Error; err != nil {
		return nil, err
	}
	out := make([]interfaces.CourseRestrictionData, len(restrictions))
	for i, r := range restrictions {
		out[i] = interfaces.CourseRestrictionData{
			ID:                  r.ID,
			SpecializationID:    r.SpecializationID,
			Semester:            r.Semester,
			Category:            r.Category,
			MinCourses:          r.MinCourses,
			MaxCourses:          r.MaxCourses,
			InternalDescription: r.InternalDescription,
		}
	}
	return out, nil
}
