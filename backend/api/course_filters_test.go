package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestFilterCourses_NoFilter(t *testing.T) {
	courses := []interfaces.CourseData{
		{ID: uuid.New(), Title: "A", CourseType: enums.CourseTypeMandatory, Category: enums.CourseCategoryTech, Workload: 3.0},
		{ID: uuid.New(), Title: "B", CourseType: enums.CourseTypeElective, Category: enums.CourseCategoryAI, Workload: 5.0},
	}
	f := CourseFilter{}
	result := filterCourses(courses, f)
	assert.Equal(t, courses, result)
}

func TestFilterCourses_CohortYears(t *testing.T) {
	courses := []interfaces.CourseData{
		{ID: uuid.New(), Title: "all", AllowedCohorts: nil},
		{ID: uuid.New(), Title: "2025", AllowedCohorts: []int{2025}},
		{ID: uuid.New(), Title: "2026", AllowedCohorts: []int{2026}},
		{ID: uuid.New(), Title: "both", AllowedCohorts: []int{2025, 2026}},
	}

	t.Run("single year match", func(t *testing.T) {
		f := CourseFilter{CohortYears: []int{2025}}
		result := filterCourses(courses, f)
		assert.Len(t, result, 3)
		for _, c := range result {
			assert.NotEqual(t, "2026", c.Title)
		}
	})

	t.Run("multiple years match", func(t *testing.T) {
		f := CourseFilter{CohortYears: []int{2025, 2026}}
		result := filterCourses(courses, f)
		assert.Len(t, result, 4)
	})

	t.Run("no match", func(t *testing.T) {
		f := CourseFilter{CohortYears: []int{2024}}
		result := filterCourses(courses, f)
		assert.Len(t, result, 1)
		assert.Equal(t, "all", result[0].Title)
	})

	t.Run("empty allowed cohorts passes all", func(t *testing.T) {
		c := []interfaces.CourseData{
			{ID: uuid.New(), Title: "no restriction", AllowedCohorts: nil},
			{ID: uuid.New(), Title: "empty slice", AllowedCohorts: []int{}},
		}
		f := CourseFilter{CohortYears: []int{2025}}
		result := filterCourses(c, f)
		assert.Len(t, result, 2)
	})
}

func TestFilterCourses_Title(t *testing.T) {
	courses := []interfaces.CourseData{
		{ID: uuid.New(), Title: "Образовательный курс"},
		{ID: uuid.New(), Title: "Python Programming"},
		{ID: uuid.New(), Title: "Data Science"},
	}

	t.Run("contains match", func(t *testing.T) {
		f := CourseFilter{Title: "образ"}
		result := filterCourses(courses, f)
		assert.Len(t, result, 1)
		assert.Equal(t, "Образовательный курс", result[0].Title)
	})

	t.Run("case insensitive", func(t *testing.T) {
		f := CourseFilter{Title: "python"}
		result := filterCourses(courses, f)
		assert.Len(t, result, 1)
		assert.Equal(t, "Python Programming", result[0].Title)
	})

	t.Run("no match", func(t *testing.T) {
		f := CourseFilter{Title: "nonexistent"}
		result := filterCourses(courses, f)
		assert.Empty(t, result)
	})
}

func TestFilterCourses_CourseTypes(t *testing.T) {
	courses := []interfaces.CourseData{
		{ID: uuid.New(), Title: "mandatory", CourseType: enums.CourseTypeMandatory},
		{ID: uuid.New(), Title: "elective", CourseType: enums.CourseTypeElective},
		{ID: uuid.New(), Title: "other", CourseType: enums.CourseTypeOther},
	}

	t.Run("single type", func(t *testing.T) {
		f := CourseFilter{CourseTypes: []enums.CourseType{enums.CourseTypeMandatory}}
		result := filterCourses(courses, f)
		assert.Len(t, result, 1)
		assert.Equal(t, "mandatory", result[0].Title)
	})

	t.Run("multiple types", func(t *testing.T) {
		f := CourseFilter{CourseTypes: []enums.CourseType{enums.CourseTypeMandatory, enums.CourseTypeElective}}
		result := filterCourses(courses, f)
		assert.Len(t, result, 2)
	})

	t.Run("no match", func(t *testing.T) {
		f := CourseFilter{CourseTypes: []enums.CourseType{"invalid"}}
		result := filterCourses(courses, f)
		assert.Empty(t, result)
	})
}

func TestFilterCourses_Categories(t *testing.T) {
	courses := []interfaces.CourseData{
		{ID: uuid.New(), Title: "tech", Category: enums.CourseCategoryTech},
		{ID: uuid.New(), Title: "ai", Category: enums.CourseCategoryAI},
		{ID: uuid.New(), Title: "stem", Category: enums.CourseCategorySTEM},
	}

	t.Run("single category", func(t *testing.T) {
		f := CourseFilter{Categories: []enums.CourseCategory{enums.CourseCategoryTech}}
		result := filterCourses(courses, f)
		assert.Len(t, result, 1)
		assert.Equal(t, "tech", result[0].Title)
	})

	t.Run("multiple categories", func(t *testing.T) {
		f := CourseFilter{Categories: []enums.CourseCategory{enums.CourseCategoryAI, enums.CourseCategorySTEM}}
		result := filterCourses(courses, f)
		assert.Len(t, result, 2)
	})

	t.Run("no match", func(t *testing.T) {
		f := CourseFilter{Categories: []enums.CourseCategory{enums.CourseCategoryFundamentals}}
		result := filterCourses(courses, f)
		assert.Empty(t, result)
	})
}

func TestFilterCourses_Workload(t *testing.T) {
	courses := []interfaces.CourseData{
		{ID: uuid.New(), Title: "light", Workload: 2.0},
		{ID: uuid.New(), Title: "medium", Workload: 4.0},
		{ID: uuid.New(), Title: "heavy", Workload: 6.0},
	}

	t.Run("less than", func(t *testing.T) {
		f := CourseFilter{WorkloadOp: "<", WorkloadVal: 4.0}
		result := filterCourses(courses, f)
		assert.Len(t, result, 1)
		assert.Equal(t, "light", result[0].Title)
	})

	t.Run("equal to", func(t *testing.T) {
		f := CourseFilter{WorkloadOp: "=", WorkloadVal: 4.0}
		result := filterCourses(courses, f)
		assert.Len(t, result, 1)
		assert.Equal(t, "medium", result[0].Title)
	})

	t.Run("greater than", func(t *testing.T) {
		f := CourseFilter{WorkloadOp: ">", WorkloadVal: 4.0}
		result := filterCourses(courses, f)
		assert.Len(t, result, 1)
		assert.Equal(t, "heavy", result[0].Title)
	})

	t.Run("no match", func(t *testing.T) {
		f := CourseFilter{WorkloadOp: "<", WorkloadVal: 1.0}
		result := filterCourses(courses, f)
		assert.Empty(t, result)
	})
}

func TestFilterCourses_Combined(t *testing.T) {
	courses := []interfaces.CourseData{
		{ID: uuid.New(), Title: "Python", CourseType: enums.CourseTypeMandatory, Category: enums.CourseCategoryTech, Workload: 4.0, AllowedCohorts: []int{2025}},
		{ID: uuid.New(), Title: "Math", CourseType: enums.CourseTypeMandatory, Category: enums.CourseCategorySTEM, Workload: 5.0, AllowedCohorts: []int{2025}},
		{ID: uuid.New(), Title: "Art", CourseType: enums.CourseTypeElective, Category: enums.CourseCategoryDesign, Workload: 3.0, AllowedCohorts: []int{2026}},
	}

	f := CourseFilter{
		CohortYears: []int{2025},
		Title:       "P",
		CourseTypes: []enums.CourseType{enums.CourseTypeMandatory},
		WorkloadOp:  ">",
		WorkloadVal: 3.0,
	}
	result := filterCourses(courses, f)
	assert.Len(t, result, 1)
	assert.Equal(t, "Python", result[0].Title)
}

func TestParseCourseFilter(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("all params", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("GET", "/?cohort_year=2024,2025&title=обр&course_type=mandatory,elective&category=ai,stem&workload=<5", nil)

		f := parseCourseFilter(c)
		assert.Equal(t, []int{2024, 2025}, f.CohortYears)
		assert.Equal(t, "обр", f.Title)
		assert.Equal(t, []enums.CourseType{enums.CourseTypeMandatory, enums.CourseTypeElective}, f.CourseTypes)
		assert.Equal(t, []enums.CourseCategory{enums.CourseCategoryAI, enums.CourseCategorySTEM}, f.Categories)
		assert.Equal(t, "<", f.WorkloadOp)
		assert.Equal(t, 5.0, f.WorkloadVal)
	})

	t.Run("no params", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("GET", "/", nil)

		f := parseCourseFilter(c)
		assert.Empty(t, f.CohortYears)
		assert.Empty(t, f.Title)
		assert.Empty(t, f.CourseTypes)
		assert.Empty(t, f.Categories)
		assert.Empty(t, f.WorkloadOp)
	})

	t.Run("single values", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("GET", "/?cohort_year=2025&course_type=mandatory&category=tech&workload=>3", nil)

		f := parseCourseFilter(c)
		assert.Equal(t, []int{2025}, f.CohortYears)
		assert.Equal(t, []enums.CourseType{enums.CourseTypeMandatory}, f.CourseTypes)
		assert.Equal(t, []enums.CourseCategory{enums.CourseCategoryTech}, f.Categories)
		assert.Equal(t, ">", f.WorkloadOp)
		assert.Equal(t, 3.0, f.WorkloadVal)
	})

	t.Run("workload empty prefix", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("GET", "/?workload=5", nil)

		f := parseCourseFilter(c)
		assert.Empty(t, f.WorkloadOp)
	})

	t.Run("cohort_year non-integer ignored", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("GET", "/?cohort_year=abc,2025", nil)

		f := parseCourseFilter(c)
		assert.Equal(t, []int{2025}, f.CohortYears)
	})
}

func TestGetCourses_WithCohortYearPathParam(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateCourse(interfaces.CourseData{
			ID: uuid.New(), Title: "only 2025", AllowedCohorts: []int{2025}, AvailableSemesters: []int{1}, Workload: 3.0,
		})
		s.CreateCourse(interfaces.CourseData{
			ID: uuid.New(), Title: "only 2026", AllowedCohorts: []int{2026}, AvailableSemesters: []int{1}, Workload: 3.0,
		})
		s.CreateCourse(interfaces.CourseData{
			ID: uuid.New(), Title: "all years", AvailableSemesters: []int{1}, Workload: 3.0,
		})
	})

	t.Run("path param filters by cohort", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/courses/2025", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		var courses []map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &courses)
		assert.Len(t, courses, 2)
		titles := make(map[string]bool)
		for _, c := range courses {
			titles[c["title"].(string)] = true
		}
		assert.True(t, titles["only 2025"])
		assert.True(t, titles["all years"])
	})

	t.Run("no param returns all", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		var courses []map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &courses)
		assert.Len(t, courses, 3)
	})

	t.Run("invalid cohort_year returns 400", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/courses/abc", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 400, w.Code)
	})
}

func TestGetCourses_WithQueryParams(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateCourse(interfaces.CourseData{
			ID: uuid.New(), Title: "Python", CourseType: enums.CourseTypeMandatory,
			Category: enums.CourseCategoryTech, Workload: 4.0, AvailableSemesters: []int{1},
		})
		s.CreateCourse(interfaces.CourseData{
			ID: uuid.New(), Title: "Design Basics", CourseType: enums.CourseTypeElective,
			Category: enums.CourseCategoryDesign, Workload: 3.0, AvailableSemesters: []int{1},
		})
		s.CreateCourse(interfaces.CourseData{
			ID: uuid.New(), Title: "Advanced AI", CourseType: enums.CourseTypeMandatory,
			Category: enums.CourseCategoryAI, Workload: 6.0, AvailableSemesters: []int{1},
		})
	})

	t.Run("filter by title", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/courses/?title=python", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		var courses []map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &courses)
		assert.Len(t, courses, 1)
		assert.Equal(t, "Python", courses[0]["title"])
	})

	t.Run("filter by course_type", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/courses/?course_type=elective", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		var courses []map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &courses)
		assert.Len(t, courses, 1)
		assert.Equal(t, "Design Basics", courses[0]["title"])
	})

	t.Run("filter by category", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/courses/?category=tech,ai", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		var courses []map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &courses)
		assert.Len(t, courses, 2)
	})

	t.Run("filter by workload less than", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/courses/?workload=<4", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		var courses []map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &courses)
		assert.Len(t, courses, 1)
		assert.Equal(t, "Design Basics", courses[0]["title"])
	})

	t.Run("combined filters", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/courses/?course_type=mandatory&workload=>3", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		var courses []map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &courses)
		assert.Len(t, courses, 2)
	})
}
