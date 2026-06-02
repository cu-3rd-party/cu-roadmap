package service

import (
	"fmt"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type RoadmapValidator struct {
	AllCourses   map[uuid.UUID]interfaces.CourseData
	depsByCourse map[uuid.UUID][]interfaces.CourseDependencyData
}

func NewRoadmapValidator(allCourses map[uuid.UUID]interfaces.CourseData) *RoadmapValidator {
	return &RoadmapValidator{
		AllCourses:   allCourses,
		depsByCourse: make(map[uuid.UUID][]interfaces.CourseDependencyData),
	}
}

func (v *RoadmapValidator) LoadDependencies(s interfaces.StoreBase) error {
	deps, err := s.GetCourseDependencies()
	if err != nil {
		return err
	}
	v.depsByCourse = make(map[uuid.UUID][]interfaces.CourseDependencyData)
	for _, dep := range deps {
		v.depsByCourse[dep.CourseID] = append(v.depsByCourse[dep.CourseID], dep)
	}
	return nil
}

func CreateValidatorFromStore(s interfaces.StoreBase) (*RoadmapValidator, error) {
	allCourses, err := s.GetAllCourses()
	if err != nil {
		return nil, err
	}
	v := NewRoadmapValidator(allCourses)
	if err := v.LoadDependencies(s); err != nil {
		return nil, err
	}
	return v, nil
}

func (v *RoadmapValidator) ValidateSemester(
	coursesInSem []interfaces.CourseData,
	previouslyPassedIDs map[uuid.UUID]bool,
	currentSemNum int,
	maxLoad float64,
) schemas.ValidationResult {
	var messages []schemas.ValidationMessage
	totalLoad := 0.0
	for _, c := range coursesInSem {
		totalLoad += c.Workload
	}
	inSemIDs := make(map[uuid.UUID]bool)
	for _, c := range coursesInSem {
		inSemIDs[c.ID] = true
	}

	if totalLoad > maxLoad {
		messages = append(messages, schemas.ValidationMessage{
			Level:   "warning",
			Message: formatLoadExceeded(totalLoad, maxLoad),
		})
	}

	isOdd := currentSemNum%2 != 0
	for _, c := range coursesInSem {
		if len(c.AvailableSemesters) > 0 {
			courseIsOdd := false
			for _, s := range c.AvailableSemesters {
				if s%2 != 0 {
					courseIsOdd = true
					break
				}
			}
			if isOdd != courseIsOdd {
				messages = append(messages, schemas.ValidationMessage{
					Level:    "error",
					Message:  formatWrongSemester(c.Title, currentSemNum),
					CourseID: &c.ID,
				})
			}
		}
	}

	for _, c := range coursesInSem {
		for _, dep := range v.depsByCourse[c.ID] {
			reqID := dep.RequiredCourseID
			reqTitle := "Неизвестный курс"
			if rc, ok := v.AllCourses[reqID]; ok {
				reqTitle = rc.Title
			}

			if dep.DependencyType == enums.DependencyTypePrerequisite {
				if !previouslyPassedIDs[reqID] {
					messages = append(messages, schemas.ValidationMessage{
						Level:    "error",
						Message:  formatMissingPrereq(c.Title, reqTitle),
						CourseID: &c.ID,
					})
				}
			} else if dep.DependencyType == enums.DependencyTypeCorequisite {
				if !inSemIDs[reqID] {
					messages = append(messages, schemas.ValidationMessage{
						Level:    "error",
						Message:  formatMissingCoreq(c.Title, reqTitle),
						CourseID: &c.ID,
					})
				}
			}
		}
	}

	isValid := true
	for _, m := range messages {
		if m.Level == "error" {
			isValid = false
			break
		}
	}

	return schemas.ValidationResult{
		IsValid:   isValid,
		Messages:  messages,
		TotalLoad: totalLoad,
	}
}

func (v *RoadmapValidator) ValidateFullRoadmap(
	roadmapData []map[string]interface{},
	initialPassedIDs map[uuid.UUID]bool,
	maxLoad float64,
) []map[string]interface{} {
	var results []map[string]interface{}
	currentPassed := make(map[uuid.UUID]bool)
	for id := range initialPassedIDs {
		currentPassed[id] = true
	}

	for _, semData := range roadmapData {
		semNum := toInt(semData["semester"])
		courseIDs := parseCourseIDs(semData["course_ids"])

		var courses []interfaces.CourseData
		for _, cid := range courseIDs {
			if c, ok := v.AllCourses[cid]; ok {
				courses = append(courses, c)
			}
		}

		res := v.ValidateSemester(courses, currentPassed, semNum, maxLoad)

		var msgs []map[string]interface{}
		for _, m := range res.Messages {
			msg := map[string]interface{}{
				"level":   m.Level,
				"message": m.Message,
			}
			if m.CourseID != nil {
				msg["course_id"] = m.CourseID.String()
			}
			msgs = append(msgs, msg)
		}

		results = append(results, map[string]interface{}{
			"semester":   semNum,
			"valid":      res.IsValid,
			"total_load": res.TotalLoad,
			"messages":   msgs,
		})

		for _, c := range courses {
			currentPassed[c.ID] = true
		}
	}

	return results
}

func formatLoadExceeded(total, max float64) string {
	return fmt.Sprintf("Превышена нагрузка (%.1f > %.1f)", total, max)
}

func formatWrongSemester(title string, sem int) string {
	return fmt.Sprintf("Курс '%s' не читается в %d-м семестре", title, sem)
}

func formatMissingPrereq(courseTitle, reqTitle string) string {
	return fmt.Sprintf("Для '%s' нужен пререквизит: %s", courseTitle, reqTitle)
}

func formatMissingCoreq(courseTitle, reqTitle string) string {
	return fmt.Sprintf("'%s' и '%s' должны изучаться одновременно", courseTitle, reqTitle)
}

func toInt(v interface{}) int {
	switch n := v.(type) {
	case int:
		return n
	case float64:
		return int(n)
	}
	return 0
}

func parseCourseIDs(v interface{}) []uuid.UUID {
	var ids []uuid.UUID
	switch raw := v.(type) {
	case []interface{}:
		for _, r := range raw {
			if s, ok := r.(string); ok {
				ids = append(ids, uuid.MustParse(s))
			}
		}
	case []string:
		for _, s := range raw {
			ids = append(ids, uuid.MustParse(s))
		}
	}
	return ids
}
