package store

import (
	"encoding/csv"
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
)

type MemoryStore struct {
	mu                 sync.RWMutex
	courses            map[uuid.UUID]CourseData
	majors             map[uuid.UUID]MajorData
	majorRequirements  []MajorRequirementData
	courseDependencies []CourseDependencyData
	students           map[uuid.UUID]StudentData
	coursesByTitle     map[string]uuid.UUID
	majorsByTitle      map[string]uuid.UUID
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		courses:        make(map[uuid.UUID]CourseData),
		majors:         make(map[uuid.UUID]MajorData),
		students:       make(map[uuid.UUID]StudentData),
		coursesByTitle: make(map[string]uuid.UUID),
		majorsByTitle:  make(map[string]uuid.UUID),
	}
}

func (s *MemoryStore) Init() error  { return nil }
func (s *MemoryStore) Close() error { return nil }

func (s *MemoryStore) ClearAll() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.courses = make(map[uuid.UUID]CourseData)
	s.majors = make(map[uuid.UUID]MajorData)
	s.majorRequirements = nil
	s.courseDependencies = nil
	s.students = make(map[uuid.UUID]StudentData)
	s.coursesByTitle = make(map[string]uuid.UUID)
	s.majorsByTitle = make(map[string]uuid.UUID)
	return nil
}

func (s *MemoryStore) GetAllCourses() (map[uuid.UUID]CourseData, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[uuid.UUID]CourseData, len(s.courses))
	for id, c := range s.courses {
		c.Prerequisites = s.getPrereqsLocked(id)
		c.Corequisites = s.getCoreqsLocked(id)
		out[id] = c
	}
	return out, nil
}

func (s *MemoryStore) getPrereqsLocked(courseID uuid.UUID) []uuid.UUID {
	var prereqs []uuid.UUID
	for _, dep := range s.courseDependencies {
		if dep.CourseID == courseID && dep.DependencyType == enums.DependencyTypePrerequisite {
			prereqs = append(prereqs, dep.RequiredCourseID)
		}
	}
	return prereqs
}

func (s *MemoryStore) getCoreqsLocked(courseID uuid.UUID) []uuid.UUID {
	var coreqs []uuid.UUID
	for _, dep := range s.courseDependencies {
		if dep.CourseID == courseID && dep.DependencyType == enums.DependencyTypeCorequisite1 {
			coreqs = append(coreqs, dep.RequiredCourseID)
		}
	}
	return coreqs
}

func (s *MemoryStore) GetCourseByID(courseID uuid.UUID) (*CourseData, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c, ok := s.courses[courseID]
	if !ok {
		return nil, nil
	}
	c.Prerequisites = s.getPrereqsLocked(courseID)
	c.Corequisites = s.getCoreqsLocked(courseID)
	return &c, nil
}

func (s *MemoryStore) GetCourseDependencies() ([]CourseDependencyData, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]CourseDependencyData, len(s.courseDependencies))
	copy(out, s.courseDependencies)
	return out, nil
}

func (s *MemoryStore) CreateCourse(course CourseData) (CourseData, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.courses[course.ID] = course
	s.coursesByTitle[course.Title] = course.ID
	return course, nil
}

func (s *MemoryStore) UpdateCourse(course CourseData) (CourseData, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	oldCourse, exists := s.courses[course.ID]
	if exists && oldCourse.Title != course.Title {
		delete(s.coursesByTitle, oldCourse.Title)
	}
	s.courses[course.ID] = course
	s.coursesByTitle[course.Title] = course.ID
	return course, nil
}

func (s *MemoryStore) DeleteCourse(courseID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	course, exists := s.courses[courseID]
	if exists {
		delete(s.coursesByTitle, course.Title)
		delete(s.courses, courseID)
	}
	return nil
}

func (s *MemoryStore) GetAllMajors() (map[uuid.UUID]MajorData, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[uuid.UUID]MajorData, len(s.majors))
	for id, m := range s.majors {
		out[id] = m
	}
	return out, nil
}

func (s *MemoryStore) GetMajorByID(majorID uuid.UUID) (*MajorData, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	m, ok := s.majors[majorID]
	if !ok {
		return nil, nil
	}
	return &m, nil
}

func (s *MemoryStore) CreateMajor(major MajorData) (MajorData, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.majors[major.ID] = major
	s.majorsByTitle[major.Title] = major.ID
	return major, nil
}

func (s *MemoryStore) UpdateMajor(major MajorData) (MajorData, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	oldMajor, exists := s.majors[major.ID]
	if exists && oldMajor.Title != major.Title {
		delete(s.majorsByTitle, oldMajor.Title)
	}
	s.majors[major.ID] = major
	s.majorsByTitle[major.Title] = major.ID
	return major, nil
}

func (s *MemoryStore) DeleteMajor(majorID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	major, exists := s.majors[majorID]
	if exists {
		delete(s.majorsByTitle, major.Title)
		delete(s.majors, majorID)
	}
	return nil
}

func (s *MemoryStore) GetMajorRequirements(majorID uuid.UUID) ([]MajorRequirementData, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []MajorRequirementData
	for _, r := range s.majorRequirements {
		if r.MajorID == majorID {
			out = append(out, r)
		}
	}
	return out, nil
}

func (s *MemoryStore) CreateMajorRequirement(req MajorRequirementData) (MajorRequirementData, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.majorRequirements = append(s.majorRequirements, req)
	return req, nil
}

func (s *MemoryStore) DeleteMajorRequirements(majorID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	var newReqs []MajorRequirementData
	for _, r := range s.majorRequirements {
		if r.MajorID != majorID {
			newReqs = append(newReqs, r)
		}
	}
	s.majorRequirements = newReqs
	return nil
}

func (s *MemoryStore) CreateCourseDependency(dep CourseDependencyData) (CourseDependencyData, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.courseDependencies = append(s.courseDependencies, dep)
	return dep, nil
}

func (s *MemoryStore) DeleteCourseDependencies(courseID uuid.UUID) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var newDeps []CourseDependencyData
	for _, d := range s.courseDependencies {
		if d.CourseID != courseID {
			newDeps = append(newDeps, d)
		}
	}
	s.courseDependencies = newDeps
	return nil
}

func (s *MemoryStore) GetAllStudents() (map[uuid.UUID]StudentData, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[uuid.UUID]StudentData, len(s.students))
	for id, st := range s.students {
		out[id] = st
	}
	return out, nil
}

func (s *MemoryStore) GetStudentByID(studentID uuid.UUID) (*StudentData, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	st, ok := s.students[studentID]
	if !ok {
		return nil, nil
	}
	return &st, nil
}

func (s *MemoryStore) CreateStudent(student StudentData) (StudentData, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.students[student.ID] = student
	return student, nil
}

func (s *MemoryStore) UpdateStudent(student StudentData) (StudentData, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.students[student.ID] = student
	return student, nil
}

func (s *MemoryStore) LoadCoursesFromCSV(coursesCSVPath, depsCSVPath, majorsCSVPath string) error {
	s.ClearAll()

	recommended := calculateRecommendedSemesters(coursesCSVPath, depsCSVPath)

	csvIDToUUID := make(map[string]uuid.UUID)

	f, err := os.Open(coursesCSVPath)
	if err != nil {
		return err
	}
	defer f.Close()

	reader := csv.NewReader(f)
	headers, _ := reader.Read()
	_ = headers
	rows, _ := reader.ReadAll()
	for _, row := range rows {
		uid := uuid.New()
		csvID := row[0]
		csvIDToUUID[csvID] = uid

		workload := parseFloat(row[6])
		courseType := enums.CourseType(row[4])
		category := enums.CourseCategory(row[5])
		sems := parseSemesters(row[3])
		var recSem *int
		if r, ok := recommended[csvID]; ok {
			recSem = &r
		}

		desc := row[2]
		s.courses[uid] = CourseData{
			ID:                  uid,
			Title:               row[1],
			Description:         &desc,
			CourseType:          courseType,
			Category:            category,
			AvailableSemesters:  sems,
			RecommendedSemester: recSem,
			Workload:            workload,
		}
		s.coursesByTitle[row[1]] = uid
	}

	// Load majors
	mf, err := os.Open(majorsCSVPath)
	if err != nil {
		return err
	}
	defer mf.Close()
	mreader := csv.NewReader(mf)
	mreader.Read()
	mrows, _ := mreader.ReadAll()
	for _, row := range mrows {
		uid := uuid.New()
		school := "Business"
		if containsAny(row[1], "AI", "Software") {
			school = "Tech"
		}
		s.majors[uid] = MajorData{ID: uid, Title: row[1], School: school}
		s.majorsByTitle[row[1]] = uid
	}

	// Load dependencies
	df, err := os.Open(depsCSVPath)
	if err != nil {
		return err
	}
	defer df.Close()
	dreader := csv.NewReader(df)
	dreader.Read()
	drows, _ := dreader.ReadAll()
	for _, row := range drows {
		cid, ok1 := csvIDToUUID[row[0]]
		rid, ok2 := csvIDToUUID[row[1]]
		if !ok1 || !ok2 {
			continue
		}
		s.courseDependencies = append(s.courseDependencies, CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         cid,
			RequiredCourseID: rid,
			DependencyType:   enums.DependencyType(row[2]),
		})
	}

	return nil
}

func (s *MemoryStore) LoadMockData() error {
	allCourses := s.courses
	allMajors := s.majors

	coursesByTitle := make(map[string]CourseData)
	for _, c := range allCourses {
		coursesByTitle[c.Title] = c
	}
	majorsByTitle := make(map[string]MajorData)
	for _, m := range allMajors {
		majorsByTitle[m.Title] = m
	}

	sweCourses := []string{
		"Разработка на Python. Основной",
		"Разработка на Python. Углублённый",
		"Алгоритмы и структуры данных I",
		"Алгоритмы и структуры данных 2",
		"Архитектура компьютера и ОС",
		"Архитектура компьютера и ОС 2",
		"Базы данных",
		"Основы промышленной разработки",
		"Основы разработки на Go",
		"Web-разработка",
	}
	aiCourses := []string{
		"Разработка на Python. Основной",
		"Разработка на Python. Углублённый",
		"Machine Learning",
		"Deep Learning",
		"Введение в ИИ",
		"Теория вероятностей и матстатистика",
		"Математическая статистика",
		"Линейная алгебра и геометрия",
		"Математический анализ",
	}
	businessCourses := []string{
		"Введение в экономику",
		"Основы бизнес-аналитики",
		"Основы финансов",
		"Микроэкономика I",
		"Макроэкономика I",
		"Основы маркетинга",
		"Теория игр",
		"Эконометрика I",
		"Финансы. Основной уровень",
		"Теория вероятностей и матстатистика",
		"Математическая статистика",
	}
	commonCourses := []string{
		"Командная работа по Agile",
		"Стресс-менеджмент",
		"Информационная безопасность",
	}

	mapping := map[string][]string{
		"Software Engineering": sweCourses,
		"AI":                   aiCourses,
		"Business":             businessCourses,
		"Common (All Majors)":  commonCourses,
	}

	for majorTitle, courseTitles := range mapping {
		major, ok := majorsByTitle[majorTitle]
		if !ok {
			continue
		}
		for _, title := range courseTitles {
			c, ok := coursesByTitle[title]
			if !ok {
				continue
			}
			s.majorRequirements = append(s.majorRequirements, MajorRequirementData{
				ID:              uuid.New(),
				MajorID:         major.ID,
				CourseID:        c.ID,
				RequirementType: enums.RequirementTypeMajorCore,
			})
		}
	}

	if sweMajor, ok := majorsByTitle["Software Engineering"]; ok {
		student := StudentData{
			ID:              uuid.New(),
			Cohort:          2025,
			CurrentSemester: 3,
			TargetMajorID:   &sweMajor.ID,
			PassedCourseIDs: []uuid.UUID{
				coursesByTitle["Разработка на Python. Основной"].ID,
				coursesByTitle["Архитектура компьютера и ОС"].ID,
				coursesByTitle["Командная работа по Agile"].ID,
			},
		}
		s.students[student.ID] = student
	}

	return nil
}

func (s *MemoryStore) SeedAllData() error {
	if err := s.LoadCoursesFromCSV("courses.csv", "course_dependencies.csv", "majors.csv"); err != nil {
		return err
	}
	return s.LoadMockData()
}

func (s *MemoryStore) SyncGoogleSheetsData() error {
	return syncWithSheets(s)
}

func parseSemesters(s string) []int {
	var out []int
	for _, p := range splitCSV(s) {
		out = append(out, p)
	}
	return out
}

func parseFloat(s string) float64 {
	var val float64
	_, _ = fmt.Sscanf(s, "%f", &val)
	return val
}

func splitCSV(s string) []int {
	var out []int
	for _, part := range strings.Split(s, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		var v int
		if _, err := fmt.Sscanf(part, "%d", &v); err == nil {
			out = append(out, v)
		}
	}
	return out
}

func containsAny(s string, substrs ...string) bool {
	for _, sub := range substrs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}

func calculateRecommendedSemesters(coursesPath, depsPath string) map[string]int {
	type courseInfo struct {
		Semesters []int
	}
	courses := make(map[string]courseInfo)
	depsByCourse := make(map[string][]string)

	if f, err := os.Open(coursesPath); err == nil {
		defer f.Close()
		r := csv.NewReader(f)
		r.Read()
		rows, _ := r.ReadAll()
		for _, row := range rows {
			courses[row[0]] = courseInfo{Semesters: parseSemesters(row[3])}
		}
	}
	if f, err := os.Open(depsPath); err == nil {
		defer f.Close()
		r := csv.NewReader(f)
		r.Read()
		rows, _ := r.ReadAll()
		for _, row := range rows {
			if row[2] == "prerequisite" {
				depsByCourse[row[0]] = append(depsByCourse[row[0]], row[1])
			}
		}
	}

	memo := make(map[string]int)
	var computeDepth func(cid string, visited map[string]bool) int
	computeDepth = func(cid string, visited map[string]bool) int {
		if v, ok := memo[cid]; ok {
			return v
		}
		if visited[cid] {
			memo[cid] = 0
			return 0
		}
		visited[cid] = true
		prereqs := depsByCourse[cid]
		if len(prereqs) == 0 {
			memo[cid] = 0
		} else {
			maxD := 0
			for _, p := range prereqs {
				if d := computeDepth(p, visited); d > maxD {
					maxD = d
				}
			}
			memo[cid] = maxD + 1
		}
		delete(visited, cid)
		return memo[cid]
	}

	for cid := range courses {
		computeDepth(cid, make(map[string]bool))
	}

	recommended := make(map[string]int)
	for cid, depth := range memo {
		courseSems := courses[cid].Semesters
		if len(courseSems) == 0 {
			recommended[cid] = depth + 1
			continue
		}
		firstAvail := courseSems[0]
		var rec int
		if firstAvail%2 == 1 && firstAvail <= depth+1 {
			if (depth+1)%2 == 1 {
				rec = depth + 1
			} else {
				rec = depth + 2
			}
		} else if firstAvail%2 == 0 && firstAvail <= depth+1 {
			if (depth+1)%2 == 0 {
				rec = depth + 1
			} else {
				rec = depth + 2
			}
		} else {
			rec = depth + 1
		}
		if rec < firstAvail {
			rec = firstAvail
		}
		recommended[cid] = rec
	}
	return recommended
}

func ptr[T any](v T) *T {
	return &v
}
