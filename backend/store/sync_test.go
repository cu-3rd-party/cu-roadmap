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
		{"Курс А", []string{"Курс А"}},
		{"Курс А, Курс Б", []string{"Курс А", "Курс Б"}},
		{"  Курс А ,  Курс Б  ", []string{"Курс А", "Курс Б"}},
	}
	for _, tc := range tests {
		result := SplitSheetTitles(tc.input)
		assert.Equal(t, tc.expected, result)
	}
}

func TestMapSheetRowToCourse(t *testing.T) {
	row := map[string]string{
		"Название курса":     "Тестовый курс",
		"Контекст":           "Описание",
		"Силлабус если есть": "https://cu.ru",
		"Тип курса":          "mandatory",
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
	assert.Equal(t, enums.CourseTypeMandatory, course.CourseType)
	assert.Equal(t, enums.CourseCategoryTech, course.Category)
	assert.Equal(t, []int{1, 3, 5, 7}, course.AvailableSemesters)
	assert.NotNil(t, course.RecommendedSemester)
	assert.Equal(t, 3, *course.RecommendedSemester)
	assert.Equal(t, 6.0, course.Workload)
	assert.Equal(t, []int{2024, 2025, 2026}, course.AllowedCohorts)
}

func TestMapSheetRowToCourseElective(t *testing.T) {
	row := map[string]string{
		"Название курса": "Факультатив",
		"Тип курса":      "факультатив",
		"Осень / весна":  "весна",
		"Рекомендованный к прохождению семестр": "",
		"Нагрузка": "",
	}
	course := MapSheetRowToCourse(row, enums.CourseCategorySoft)

	assert.Equal(t, "Факультатив", course.Title)
	assert.Equal(t, enums.CourseTypeElective, course.CourseType)
	assert.Equal(t, enums.CourseCategorySoft, course.Category)
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
	course := MapSheetRowToCourse(row, enums.CourseCategoryAI)
	assert.Equal(t, 7.5, course.Workload)
	assert.Equal(t, enums.CourseTypeOther, course.CourseType)

	row2 := map[string]string{
		"Название курса": "Курс 2",
		"Тип курса":      "other",
		"Осень / весна":  "",
		"workload":       "8",
	}
	course2 := MapSheetRowToCourse(row2, enums.CourseCategoryAI)
	assert.Equal(t, 8.0, course2.Workload)
}

func TestSyncFromSheetData(t *testing.T) {
	s := NewMemoryStore()
	s.Init()
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

	result, err := SyncFromSheetData(s, sheetsData)
	assert.NoError(t, err)
	assert.Equal(t, 2, result.Courses)
	assert.Equal(t, 1, result.Majors)
	assert.Equal(t, 2, result.MajorRequirements)

	majors, _ := s.GetAllMajors()
	assert.Len(t, majors, 1)
	for _, m := range majors {
		assert.Equal(t, "Software Engineering", m.Title)
		assert.Equal(t, "Tech", m.School)
	}

	courses, _ := s.GetAllCourses()
	assert.Len(t, courses, 2)

	deps, _ := s.GetCourseDependencies()
	assert.Len(t, deps, 1)
	assert.Equal(t, enums.DependencyTypePrerequisite, deps[0].DependencyType)
}

func TestSyncFromSheetDataWithMultipleMajors(t *testing.T) {
	s := NewMemoryStore()
	s.Init()
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

	result, err := SyncFromSheetData(s, sheetsData)
	assert.NoError(t, err)
	assert.Equal(t, 3, result.Courses)
	assert.Equal(t, 3, result.Majors)
	assert.Equal(t, 3, result.MajorRequirements)
}

func TestSyncFromSheetDataDeduplicatesCourses(t *testing.T) {
	s := NewMemoryStore()
	s.Init()
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

	result, err := SyncFromSheetData(s, sheetsData)
	assert.NoError(t, err)
	assert.Equal(t, 1, result.Courses)
	assert.Equal(t, 2, result.Majors)

	courses, _ := s.GetAllCourses()
	assert.Len(t, courses, 1)
}

func TestSyncFromSheetDataSkipsUnknownSheet(t *testing.T) {
	s := NewMemoryStore()
	s.Init()
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

	result, err := SyncFromSheetData(s, sheetsData)
	assert.NoError(t, err)
	assert.Equal(t, 0, result.Courses)
	assert.Equal(t, 0, result.Majors)
}

func TestSyncFromSheetDataWithCorequisites(t *testing.T) {
	s := NewMemoryStore()
	s.Init()
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

	result, err := SyncFromSheetData(s, sheetsData)
	assert.NoError(t, err)
	assert.Equal(t, 2, result.Courses)

	deps, _ := s.GetCourseDependencies()
	assert.Len(t, deps, 1)
	assert.Equal(t, enums.DependencyTypeCorequisite1, deps[0].DependencyType)
}

func TestSyncFromSheetDataWithEmojiPrefix(t *testing.T) {
	s := NewMemoryStore()
	s.Init()
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

	result, err := SyncFromSheetData(s, sheetsData)
	assert.NoError(t, err)
	assert.Equal(t, 2, result.Courses)
	assert.Equal(t, 1, result.Majors)

	deps, _ := s.GetCourseDependencies()
	assert.Len(t, deps, 1)
}

func TestSyncFromSheetDataEmptyCourseTitleSkipped(t *testing.T) {
	s := NewMemoryStore()
	s.Init()
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

	result, err := SyncFromSheetData(s, sheetsData)
	assert.NoError(t, err)
	assert.Equal(t, 1, result.Courses)

	courses, _ := s.GetAllCourses()
	assert.Len(t, courses, 1)
}
