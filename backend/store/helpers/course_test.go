package helpers

import (
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TestBuildPrerequisiteGroupsSplitsMandatoryPrerequisitesIntoSingletonGroups(t *testing.T) {
	courseID := uuid.New()
	firstID := uuid.New()
	secondID := uuid.New()
	course := interfaces.CourseData{ID: courseID}
	deps := []interfaces.CourseDependencyData{
		{CourseID: courseID, RequiredCourseID: &firstID, DependencyType: enums.DependencyTypePrerequisite, AlternativeGroup: 0},
		{CourseID: courseID, RequiredCourseID: &secondID, DependencyType: enums.DependencyTypePrerequisite, AlternativeGroup: 0},
	}

	groups := buildPrerequisiteGroups(course, deps)
	items, ok := groups.([]gin.H)
	if !ok {
		t.Fatalf("expected []gin.H, got %T", groups)
	}
	if len(items) != 2 {
		t.Fatalf("expected 2 groups, got %d", len(items))
	}
	for i, item := range items {
		if item["group_id"] != i {
			t.Fatalf("expected group_id %d, got %v", i, item["group_id"])
		}
		courseIDs, ok := item["course_ids"].([]string)
		if !ok || len(courseIDs) != 1 {
			t.Fatalf("expected singleton group %d, got %#v", i, item["course_ids"])
		}
	}
}
