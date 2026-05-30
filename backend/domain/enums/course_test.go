package enums

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCourseCategoryEnumMatching(t *testing.T) {
	assert.Equal(t, CourseCategoryFundamentals, CourseCategory("fundamentals"))
	assert.Equal(t, CourseCategoryAI, CourseCategory("ai"))
	assert.Equal(t, CourseCategoryDesign, CourseCategory("design"))
	// TODO: finish this
}

func TestCourseTypeEnumMatching(t *testing.T) {
	assert.Equal(t, CourseTypeMandatory, CourseType("mandatory"))
	assert.Equal(t, CourseTypeElective, CourseType("elective"))
	assert.Equal(t, CourseTypeOther, CourseType("other"))
}
