package helpers

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

func CreateCourseDependencies(s interfaces.StoreBase, courseID uuid.UUID, dependencyIDs []string, dependencyType enums.DependencyType) error {
	for _, dependencyID := range dependencyIDs {
		id, err := uuid.Parse(dependencyID)
		if err != nil {
			continue
		}

		dg, _ := s.GetDisciplineGroupByID(id)
		var depData interfaces.CourseDependencyData
		if dg != nil {
			depData = interfaces.CourseDependencyData{
				ID:              uuid.New(),
				CourseID:        courseID,
				RequiredGroupID: &id,
				DependencyType:  dependencyType,
			}
		} else {
			depData = interfaces.CourseDependencyData{
				ID:               uuid.New(),
				CourseID:         courseID,
				RequiredCourseID: &id,
				DependencyType:   dependencyType,
			}
		}

		_, err = s.CreateCourseDependency(depData)
		if err != nil {
			return err
		}
	}

	return nil
}

func CreateCourseGroupDependencies(s interfaces.StoreBase, courseID uuid.UUID, groupIDs []string, dependencyType enums.DependencyType) error {
	for _, groupIDStr := range groupIDs {
		groupID, err := uuid.Parse(groupIDStr)
		if err != nil {
			continue
		}

		_, err = s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:              uuid.New(),
			CourseID:        courseID,
			RequiredGroupID: &groupID,
			DependencyType:  dependencyType,
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func ReplaceCourseDependencies(s interfaces.StoreBase, courseID uuid.UUID, prerequisites []string, corequisites []string, optionalGroupIDs ...[]string) error {
	if err := s.DeleteCourseDependencies(courseID); err != nil {
		return err
	}

	return SaveCourseDependencies(s, courseID, prerequisites, corequisites, optionalGroupIDs...)
}

func SaveCourseDependencies(s interfaces.StoreBase, courseID uuid.UUID, prerequisites []string, corequisites []string, optionalGroupIDs ...[]string) error {
	if err := CreateCourseDependencies(s, courseID, prerequisites, enums.DependencyTypePrerequisite); err != nil {
		return err
	}

	if err := CreateCourseDependencies(s, courseID, corequisites, enums.DependencyTypeCorequisite); err != nil {
		return err
	}

	if len(optionalGroupIDs) > 0 && len(optionalGroupIDs[0]) > 0 {
		if err := CreateCourseGroupDependencies(s, courseID, optionalGroupIDs[0], enums.DependencyTypePrerequisite); err != nil {
			return err
		}
	}

	if len(optionalGroupIDs) > 1 && len(optionalGroupIDs[1]) > 0 {
		if err := CreateCourseGroupDependencies(s, courseID, optionalGroupIDs[1], enums.DependencyTypeCorequisite); err != nil {
			return err
		}
	}

	return nil
}
