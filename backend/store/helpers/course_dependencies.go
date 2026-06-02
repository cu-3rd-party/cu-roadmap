package helpers

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/google/uuid"
)

func CreateCourseDependencies(s store.StoreBase, courseID uuid.UUID, dependencyIDs []string, dependencyType enums.DependencyType) error {
	for _, dependencyID := range dependencyIDs {
		requiredCourseID, err := uuid.Parse(dependencyID)
		if err != nil {
			continue
		}

		_, err = s.CreateCourseDependency(store.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         courseID,
			RequiredCourseID: requiredCourseID,
			DependencyType:   dependencyType,
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func ReplaceCourseDependencies(s store.StoreBase, courseID uuid.UUID, prerequisites []string, corequisites []string) error {
	if err := s.DeleteCourseDependencies(courseID); err != nil {
		return err
	}

	return SaveCourseDependencies(s, courseID, prerequisites, corequisites)
}

func SaveCourseDependencies(s store.StoreBase, courseID uuid.UUID, prerequisites []string, corequisites []string) error {
	if err := CreateCourseDependencies(s, courseID, prerequisites, enums.DependencyTypePrerequisite); err != nil {
		return err
	}

	return CreateCourseDependencies(s, courseID, corequisites, enums.DependencyTypeCorequisite)
}
