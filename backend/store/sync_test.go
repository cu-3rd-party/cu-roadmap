package store

import (
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestNormalizeSheetTitle(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"\U0001f4d6 Введение в Python", "Введение в Python"},
		{"\u26a1 Алгоритмы", "Алгоритмы"},
		{"\U0001f534 Линал", "Линал"},
		{"Обычный курс", "Обычный курс"},
		{"  С пробелами  ", "С пробелами"},
		{"Программирование C++", "Программирование С++"},
		{"", ""},
	}
	for _, tc := range tests {
		result := NormalizeSheetTitle(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

func TestSplitSheetTitles(t *testing.T) {
	tests := []struct {
		input    string
		expected []string
	}{
		{"", nil},
		{"  ", nil},
		{"-", nil},
		{"нет", nil},
		{"Курс А", []string{"Курс А"}},
		{"Курс А, Курс Б", []string{"Курс А", "Курс Б"}},
		{"  Курс А ,  Курс Б  ", []string{"Курс А", "Курс Б"}},
		{"Курс А\nКурс Б", []string{"Курс А", "Курс Б"}},
		{"Курс А; Курс Б", []string{"Курс А", "Курс Б"}},
	}
	for _, tc := range tests {
		result := SplitSheetTitles(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

func TestParseAllowedCohorts(t *testing.T) {
	tests := []struct {
		input    string
		expected []int
	}{
		{"", nil},
		{"2025-2029", []int{2025}},
		{"2025-2029, 2026-2030", []int{2025, 2026}},
		{"2024-2028", []int{2024}},
		{"2026-2030", []int{2026}},
		{"2024-2028, 2025-2029", []int{2024, 2025}},
		{"2024-2028/2025-2029", []int{2024, 2025}},
		{"\"2024, 2025, 2026\"", []int{2024, 2025, 2026}},
	}
	for _, tc := range tests {
		result := parseAllowedCohorts(tc.input)
		assert.Equal(t, tc.expected, result, "input: %q", tc.input)
	}
}

func TestMapSheetRowToCourseSupportsXLSXHeaderVariants(t *testing.T) {
	row := map[string]string{
		"Название курса": "Программирование C++",
		"Контекст, чтобы правильно отобразить на траектории\nесли есть": "Desc",
		"Силлабус\nесли есть": "https://example.com",
		"Тип курса":           "major core",
		"Поток":               "2024–2028/2025-2029",
		"Осень / весна":       "сквозной",
		"Рекомендованный к прохождению семестр": "1 семестр, 2 семестр",
		"Нагрузка": "6",
	}
	c := MapSheetRowToCourse(row, enums.CourseCategoryTech)
	assert.Equal(t, "Программирование C++", c.Title)
	assert.NotNil(t, c.Description)
	assert.Equal(t, "Desc", *c.Description)
	assert.NotNil(t, c.HandbookLink)
	assert.Equal(t, "https://example.com", *c.HandbookLink)
	assert.Equal(t, []int{1, 2, 3, 4, 5, 6, 7, 8}, c.AvailableSemesters)
	assert.NotNil(t, c.RecommendedSemester)
	assert.Equal(t, 1, *c.RecommendedSemester)
	assert.Equal(t, []int{2024, 2025}, c.AllowedCohorts)
}

func TestSyncFromSheetDataParsesXLSXLikeRows(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	sheetsData := map[string][]map[string]string{
		"2024 Разработка": {
			{
				"Название курса": "Основы промышленной разработки",
				"Тип курса":      "major core",
				"Осень / весна":  "осень",
				"Поток":          "2026-2030",
				"Нагрузка":       "5",
				"Пререквизиты":   "нет",
				"Кореквизиты ":   "-",
			},
			{
				"Название курса": "Основы фронтенд-разработки",
				"Тип курса":      "major core",
				"Осень / весна":  "осень",
				"Поток":          "2026-2030",
				"Нагрузка":       "5",
				"Пререквизиты":   "Основы промышленной разработки",
				"Кореквизиты ":   "нет",
			},
		},
		"Soft": {
			{
				"Название курса": "Целеполагание, планирование и самоорганизация",
				"Тип курса":      "flex",
				"Семестр":        "5",
				"Поток":          "\"2024, 2025, 2026\"",
			},
		},
		"STEM": {
			{
				"Название курса": "Искусство и наука",
				"Тип курса":      "flex",
				"Поток":          "2024–2028",
				"Пререквизиты":   "-",
				"Кореквизиты":    "-",
			},
		},
	}

	sheetMapping := map[string]SheetMajorMapping{
		"2024 Разработка": {"Разработка", "Tech", enums.CourseCategoryTech},
		"Soft":            {"Common", "Common", enums.CourseCategorySoft},
		"STEM":            {"Common", "Common", enums.CourseCategorySTEM},
	}

	result, err := SyncFromSheetData(s, sheetsData, sheetMapping)
	assert.NoError(t, err)
	assert.Equal(t, 4, result.Courses)
	assert.Equal(t, 4, result.Majors)

	deps, _ := s.GetCourseDependencies()
	assert.Len(t, deps, 1)
	assert.Equal(t, enums.DependencyTypePrerequisite, deps[0].DependencyType)
}

func TestMapSheetRowToCourse(t *testing.T) {
	row := map[string]string{
		"Название курса":     "Тестовый курс",
		"Контекст":           "Описание",
		"Силлабус если есть": "https://cu.ru",
		"Тип курса":          "mandatory",
		"Поток":              "2025-2029, 2026-2030",
		"Осень / весна":      "осень",
		"Рекомендованный к прохождению семестр": "3",
		"Нагрузка": "6.0",
	}
	course := MapSheetRowToCourse(row, enums.CourseCategoryTech)

	assert.Equal(t, "Тестовый курс", course.Title)
	assert.NotEqual(t, uuid.Nil, course.ID)
	assert.NotNil(t, course.Description)
	assert.Equal(t, "Описание", *course.Description)
	assert.NotNil(t, course.HandbookLink)
	assert.Equal(t, "https://cu.ru", *course.HandbookLink)

	assert.Equal(t, []int{1, 3, 5, 7}, course.AvailableSemesters)
	assert.NotNil(t, course.RecommendedSemester)
	assert.Equal(t, 3, *course.RecommendedSemester)
	assert.Equal(t, 6.0, course.Workload)
	assert.Equal(t, []int{2025, 2026}, course.AllowedCohorts)
}

func TestMapSheetRowToCourseElective(t *testing.T) {
	row := map[string]string{
		"Название курса": "Факультатив",
		"Тип курса":      "факультатив",
		"Осень / весна":  "весна",
		"Рекомендованный к прохождению семестр": "",
		"Нагрузка": "",
	}
	course := MapSheetRowToCourse(row, enums.CourseCategoryTech)

	assert.Equal(t, "Факультатив", course.Title)

	assert.Equal(t, []int{2, 4, 6, 8}, course.AvailableSemesters)
	assert.Nil(t, course.RecommendedSemester)
	assert.Equal(t, 5.0, course.Workload)
}

func TestMapSheetRowToCourseWorkloadVariants(t *testing.T) {
	row := map[string]string{
		"Название курса": "Курс",
		"Тип курса":      "other",
		"Осень / весна":  "",
		"Нагрузка":       "7.5",
	}
	course := MapSheetRowToCourse(row, enums.CourseCategoryTech)
	assert.Equal(t, 7.5, course.Workload)

	row2 := map[string]string{
		"Название курса": "Курс 2",
		"Тип курса":      "other",
		"Осень / весна":  "",
		"workload":       "8",
	}
	course2 := MapSheetRowToCourse(row2, enums.CourseCategoryTech)
	assert.Equal(t, 8.0, course2.Workload)
}

func TestSyncFromSheetData(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	sheetsData := map[string][]map[string]string{
		"Разработка": {
			{
				"Название курса": "Python",
				"Контекст":       "Язык программирования",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "5",
				"Пререквизиты":   "",
				"Кореквизиты":    "",
			},
			{
				"Название курса": "Go",
				"Контекст":       "Ещё один язык",
				"Тип курса":      "mandatory",
				"Осень / весна":  "весна",
				"Нагрузка":       "4",
				"Пререквизиты":   "Python",
				"Кореквизиты":    "",
			},
		},
	}

	sheetMapping := map[string]SheetMajorMapping{
		"Разработка": {"Разработка", "Tech", enums.CourseCategoryTech},
	}

	result, err := SyncFromSheetData(s, sheetsData, sheetMapping)
	assert.NoError(t, err)
	assert.Equal(t, 2, result.Courses)
	assert.Equal(t, 1, result.Majors)
	assert.Equal(t, 2, result.MajorRequirements)

	majors, _ := s.GetAllMajors()
	assert.Len(t, majors, 1)
	for _, m := range majors {
		assert.Equal(t, "Разработка", m.Title)
		assert.Equal(t, "Tech", m.School)
		assert.Equal(t, 0, m.CohortYear)
	}

	courses, _ := s.GetAllCourses()
	assert.Len(t, courses, 2)

	deps, _ := s.GetCourseDependencies()
	assert.Len(t, deps, 1)
	assert.Equal(t, enums.DependencyTypePrerequisite, deps[0].DependencyType)
}

func TestSyncFromSheetDataWithMultipleMajors(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	sheetsData := map[string][]map[string]string{
		"Бизнес и аналитика": {
			{
				"Название курса": "Экономика",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "4",
				"Пререквизиты":   "",
				"Кореквизиты":    "",
			},
		},
		"Искусственный интеллект": {
			{
				"Название курса": "ML",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "5",
				"Пререквизиты":   "",
				"Кореквизиты":    "",
			},
		},
		"Разработка": {
			{
				"Название курса": "Базы данных",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "5",
				"Пререквизиты":   "",
				"Кореквизиты":    "",
			},
		},
	}

	sheetMapping := map[string]SheetMajorMapping{
		"Бизнес и аналитика":      {"Бизнес и аналитика", "Business", enums.CourseCategoryBusiness},
		"Искусственный интеллект": {"Искусственный интеллект", "Tech", enums.CourseCategoryAI},
		"Разработка":              {"Разработка", "Tech", enums.CourseCategoryTech},
	}

	result, err := SyncFromSheetData(s, sheetsData, sheetMapping)
	assert.NoError(t, err)
	assert.Equal(t, 3, result.Courses)
	assert.Equal(t, 3, result.Majors)
	assert.Equal(t, 3, result.MajorRequirements)
}

func TestSyncFromSheetDataDeduplicatesCourses(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	sheetsData := map[string][]map[string]string{
		"Разработка": {
			{
				"Название курса": "Python",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "5",
				"Пререквизиты":   "",
				"Кореквизиты":    "",
			},
			{
				"Название курса": "Python",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "5",
				"Пререквизиты":   "",
				"Кореквизиты":    "",
			},
		},
		"Искусственный интеллект": {
			{
				"Название курса": "Python",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "5",
				"Пререквизиты":   "",
				"Кореквизиты":    "",
			},
		},
	}

	sheetMapping := map[string]SheetMajorMapping{
		"Разработка":              {"Разработка", "Tech", enums.CourseCategoryTech},
		"Искусственный интеллект": {"Искусственный интеллект", "Tech", enums.CourseCategoryAI},
	}

	result, err := SyncFromSheetData(s, sheetsData, sheetMapping)
	assert.NoError(t, err)
	assert.Equal(t, 1, result.Courses)
	assert.Equal(t, 2, result.Majors)

	courses, _ := s.GetAllCourses()
	assert.Len(t, courses, 1)
}

func TestSyncFromSheetDataMajorsAreCohortSpecificAndRequirementTypeRespectsMajorCoreChoice(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	sheetsData := map[string][]map[string]string{
		"2026 Искусственный интеллект": {
			{
				"Название курса": "Дискретная математика",
				"Тип курса":      "major core",
				"Поток":          "2026-2030",
				"Осень / весна":  "осень",
				"Нагрузка":       "5",
			},
			{
				"Название курса": "Публичные выступления",
				"Тип курса":      "major choice",
				"Поток":          "2026-2030",
				"Осень / весна":  "весна",
				"Нагрузка":       "5",
			},
		},
		"2025 Искусственный интеллект": {
			{
				"Название курса": "Дискретная математика",
				"Тип курса":      "major core",
				"Поток":          "2025-2029",
				"Осень / весна":  "осень",
				"Нагрузка":       "5",
			},
		},
	}

	sheetMapping := map[string]SheetMajorMapping{
		"2026 Искусственный интеллект": {"Искусственный интеллект", "Tech", enums.CourseCategoryAI},
		"2025 Искусственный интеллект": {"Искусственный интеллект", "Tech", enums.CourseCategoryAI},
	}

	result, err := SyncFromSheetData(s, sheetsData, sheetMapping)
	assert.NoError(t, err)
	assert.Equal(t, 3, result.Courses)
	assert.Equal(t, 2, result.Majors)

	majors, _ := s.GetAllMajors()
	found := map[int]uuid.UUID{}
	for _, m := range majors {
		assert.Equal(t, "Искусственный интеллект", m.Title)
		found[m.CohortYear] = m.ID
	}
	_, ok := found[2026]
	assert.True(t, ok)
	_, ok = found[2025]
	assert.True(t, ok)

	courses, _ := s.GetAllCourses()
	var discID uuid.UUID
	var speakID uuid.UUID
	for _, c := range courses {
		if c.Title == "Дискретная математика" {
			discID = c.ID
		}
		if c.Title == "Публичные выступления" {
			speakID = c.ID
		}
	}
	assert.NotEqual(t, uuid.Nil, discID)
	assert.NotEqual(t, uuid.Nil, speakID)

	reqs2026, _ := s.GetMajorRequirements(found[2026])
	// We expect 2 requirements from the mock data
	assert.True(t, len(reqs2026) >= 2)
	for _, r := range reqs2026 {
		if r.CourseID == discID {
			assert.Equal(t, enums.RequirementTypeMajorCore, r.RequirementType)
		}
		if r.CourseID == speakID {
			assert.Equal(t, enums.RequirementTypeMajorChoice, r.RequirementType)
		}
	}
}

func TestSyncFromSheetDataSkipsUnknownSheet(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	sheetsData := map[string][]map[string]string{
		"Unknown Sheet": {
			{
				"Название курса": "Test",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "3",
			},
		},
	}

	sheetMapping := map[string]SheetMajorMapping{}

	result, err := SyncFromSheetData(s, sheetsData, sheetMapping)
	assert.NoError(t, err)
	assert.Equal(t, 0, result.Courses)
	assert.Equal(t, 0, result.Majors)
}

func TestSyncFromSheetDataWithCorequisites(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	sheetsData := map[string][]map[string]string{
		"Разработка": {
			{
				"Название курса": "Теория",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "3",
				"Пререквизиты":   "",
				"Кореквизиты":    "",
			},
			{
				"Название курса": "Практика",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "4",
				"Пререквизиты":   "",
				"Кореквизиты":    "Теория",
			},
		},
	}

	sheetMapping := map[string]SheetMajorMapping{
		"Разработка": {"Разработка", "Tech", enums.CourseCategoryTech},
	}

	result, err := SyncFromSheetData(s, sheetsData, sheetMapping)
	assert.NoError(t, err)
	assert.Equal(t, 2, result.Courses)

	deps, _ := s.GetCourseDependencies()
	if !assert.Len(t, deps, 1) {
		return
	}
	assert.Equal(t, enums.DependencyTypeCorequisite, deps[0].DependencyType)
}

func TestSyncFromSheetDataWithEmojiPrefix(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	sheetsData := map[string][]map[string]string{
		"Разработка": {
			{
				"Название курса": "\U0001f4d6 Python",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "5",
				"Пререквизиты":   "\u26a1 Базовая математика",
				"Кореквизиты":    "",
			},
			{
				"Название курса": "\u26a1 Базовая математика",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "4",
				"Пререквизиты":   "",
				"Кореквизиты":    "",
			},
		},
	}

	sheetMapping := map[string]SheetMajorMapping{
		"Разработка": {"Разработка", "Tech", enums.CourseCategoryTech},
	}

	result, err := SyncFromSheetData(s, sheetsData, sheetMapping)
	assert.NoError(t, err)
	assert.Equal(t, 2, result.Courses)
	assert.Equal(t, 1, result.Majors)

	deps, _ := s.GetCourseDependencies()
	assert.Len(t, deps, 1)
}

func TestSyncFromSheetDataEmptyCourseTitleSkipped(t *testing.T) {
	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	sheetsData := map[string][]map[string]string{
		"Разработка": {
			{
				"Название курса": "",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "3",
			},
			{
				"Название курса": "Real Course",
				"Тип курса":      "mandatory",
				"Осень / весна":  "осень",
				"Нагрузка":       "4",
			},
		},
	}

	sheetMapping := map[string]SheetMajorMapping{
		"Разработка": {"Разработка", "Tech", enums.CourseCategoryTech},
	}

	result, err := SyncFromSheetData(s, sheetsData, sheetMapping)
	assert.NoError(t, err)
	assert.Equal(t, 1, result.Courses)

	courses, _ := s.GetAllCourses()
	assert.Len(t, courses, 1)
}

func TestGuessSheetMapping(t *testing.T) {
	tests := []struct {
		input  string
		mapped bool
		major  string
		school string
	}{
		{"Бизнес и аналитика", true, "Бизнес и аналитика", "Business"},
		{"Искусственный интеллект", true, "Искусственный интеллект", "Tech"},
		{"Разработка", true, "Разработка", "Tech"},
		{"Business", true, "Бизнес и аналитика", "Business"},
		{"Дизайн", true, "Дизайн", "Design"},
		{"Design", true, "Дизайн", "Design"},
		{"Software Engineering", true, "Разработка", "Tech"},
		{"Общие курсы", true, "Общие", "Common"},
		{"общая математика", true, "Общие", "Common"},
		{"Совершенно неизвестное название", false, "", ""},
	}
	for _, tc := range tests {
		mapping, ok := guessSheetMapping(tc.input)
		assert.Equal(t, tc.mapped, ok, "input: %q", tc.input)
		if ok {
			assert.Equal(t, tc.major, mapping.MajorTitle, "input: %q", tc.input)
			assert.Equal(t, tc.school, mapping.School, "input: %q", tc.input)
		}
	}
}
