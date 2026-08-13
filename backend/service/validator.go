package service

import (
	"fmt"
	"strings"

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
	restrictionsMap map[string][]interfaces.CourseRestrictionData,
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

	for _, c := range coursesInSem {
		if len(c.AvailableSemesters) > 0 {
			courseAvailable := false
			for _, s := range c.AvailableSemesters {
				if s == currentSemNum {
					courseAvailable = true
					break
				}
			}
			if !courseAvailable {
				messages = append(messages, schemas.ValidationMessage{
					Level:    "error",
					Message:  formatWrongSemester(c.Title, currentSemNum),
					CourseID: &c.ID,
				})
			}
		}
	}

	for _, course := range v.AllCourses {
		if !shouldAutoForceExclusiveSemester(course, v.AllCourses) {
			continue
		}
		if course.AvailableSemesters == nil || len(course.AvailableSemesters) == 0 {
			continue
		}
		if course.AvailableSemesters[0] != currentSemNum {
			continue
		}
		if inSemIDs[course.ID] || previouslyPassedIDs[course.ID] {
			continue
		}
		messages = append(messages, schemas.ValidationMessage{
			Level:    "error",
			Message:  fmt.Sprintf("Курс '%s' является обязательным к прохождению в %d-м семестре", course.Title, currentSemNum),
			CourseID: &course.ID,
		})
	}

	hasSTEM := false
	hasScienceStudio := false
	hasBusinessStudio := false

	// Check previously passed courses for studios
	for id := range previouslyPassedIDs {
		if rc, ok := v.AllCourses[id]; ok {
			lowerGroup := strings.ToLower(rc.AnalogGroup)
			if strings.Contains(lowerGroup, "научн") {
				hasScienceStudio = true
			}
			if strings.Contains(lowerGroup, "бизнес") {
				hasBusinessStudio = true
			}
		}
	}

	var hasSoft bool
	for _, c := range coursesInSem {
		if c.Category == enums.CourseCategorySTEM {
			hasSTEM = true
		}
		if c.Category == enums.CourseCategorySoft {
			hasSoft = true
		}
		lowerGroup := strings.ToLower(c.AnalogGroup)
		if strings.Contains(lowerGroup, "научн") {
			hasScienceStudio = true
		}
		if strings.Contains(lowerGroup, "бизнес") {
			hasBusinessStudio = true
		}
	}

	if !hasSTEM && len(coursesInSem) > 0 {
		messages = append(messages, schemas.ValidationMessage{
			Level:   "error",
			Message: "Необходимо выбрать хотя бы один STEM-курс каждый семестр",
		})
	}

	if !hasSoft && currentSemNum > 1 && len(coursesInSem) > 0 {
		messages = append(messages, schemas.ValidationMessage{
			Level:   "error",
			Message: "Необходимо выбрать хотя бы один Soft-курс каждый семестр, начиная со второго",
		})
	}

	if currentSemNum == 4 {
		if !hasScienceStudio {
			messages = append(messages, schemas.ValidationMessage{
				Level:   "error",
				Message: "За первые 4 семестра необходимо пройти хотя бы одну научную студию",
			})
		}
		if !hasBusinessStudio {
			messages = append(messages, schemas.ValidationMessage{
				Level:   "error",
				Message: "За первые 4 семестра необходимо пройти хотя бы одну бизнес-студию",
			})
		}
	} else if currentSemNum > 4 {
		// Strictly, if they didn't pass it in the first 4 semesters, it's a violation.
		// Since we don't have exact semester timestamps for previouslyPassedIDs in ValidateSemester,
		// if they are in sem > 4 and still don't have it, it's definitely a violation.
		if !hasScienceStudio {
			messages = append(messages, schemas.ValidationMessage{
				Level:   "error",
				Message: "Необходимо было пройти хотя бы одну научную студию за первые 4 семестра",
			})
		}
		if !hasBusinessStudio {
			messages = append(messages, schemas.ValidationMessage{
				Level:   "error",
				Message: "Необходимо было пройти хотя бы одну бизнес-студию за первые 4 семестра",
			})
		}
	}

	for _, c := range coursesInSem {
		// Group dependencies by alternative group number
		prereqGroupsByNum := make(map[int][]interfaces.CourseDependencyData)
		var coreqDeps []interfaces.CourseDependencyData
		for _, dep := range v.depsByCourse[c.ID] {
			if dep.DependencyType == enums.DependencyTypePrerequisite {
				prereqGroupsByNum[dep.AlternativeGroup] = append(prereqGroupsByNum[dep.AlternativeGroup], dep)
			} else if dep.DependencyType == enums.DependencyTypeCorequisite {
				coreqDeps = append(coreqDeps, dep)
			}
		}

		// Validate prerequisite groups
		for groupNum, deps := range prereqGroupsByNum {
			if groupNum == 0 {
				// Group 0: each dependency is mandatory (AND)
				for _, dep := range deps {
					reqTitle := "Неизвестный курс"
					if rc, ok := v.AllCourses[dep.RequiredCourseID]; ok {
						reqTitle = rc.Title
					}
					if !v.isCoursePassedOrPlanned(dep.RequiredCourseID, nil, previouslyPassedIDs, false, true) {
						messages = append(messages, schemas.ValidationMessage{
							Level:    "error",
							Message:  formatMissingPrereq(c.Title, reqTitle),
							CourseID: &c.ID,
						})
					}
				}
			} else {
				// Groups >= 1: any one alternative being passed is sufficient (OR)
				anyPassed := false
				var altTitles []string
				for _, dep := range deps {
					reqTitle := "Неизвестный курс"
					if rc, ok := v.AllCourses[dep.RequiredCourseID]; ok {
						reqTitle = rc.Title
					}
					altTitles = append(altTitles, reqTitle)
					if v.isCoursePassedOrPlanned(dep.RequiredCourseID, nil, previouslyPassedIDs, false, true) {
						anyPassed = true
					}
				}
				if !anyPassed {
					messages = append(messages, schemas.ValidationMessage{
						Level:    "error",
						Message:  formatMissingPrereqAlternatives(c.Title, altTitles),
						CourseID: &c.ID,
					})
				}
			}
		}

		// Validate corequisites
		for _, dep := range coreqDeps {
			reqTitle := "Неизвестный курс"
			if rc, ok := v.AllCourses[dep.RequiredCourseID]; ok {
				reqTitle = rc.Title
			}

			satisfied := v.isCoursePassedOrPlanned(dep.RequiredCourseID, inSemIDs, nil, true, false)
			if !satisfied && v.hasEquivalentPrerequisite(dep.CourseID, dep.RequiredCourseID) {
				satisfied = v.isCoursePassedOrPlanned(dep.RequiredCourseID, nil, previouslyPassedIDs, false, true)
			}

			if !satisfied {
				messages = append(messages, schemas.ValidationMessage{
					Level:    "error",
					Message:  formatMissingCoreq(c.Title, reqTitle),
					CourseID: &c.ID,
				})
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

	// Validate restrictions
	if len(restrictionsMap) > 0 {
		restrictionMsgs := v.ValidateRestrictions(coursesInSem, currentSemNum, restrictionsMap)
		messages = append(messages, restrictionMsgs...)
		for _, m := range restrictionMsgs {
			if m.Level == "error" {
				isValid = false
			}
		}
	}

	return schemas.ValidationResult{
		IsValid:   isValid,
		Messages:  messages,
		TotalLoad: totalLoad,
	}
}

// ValidateRestrictions checks if the courses in a semester satisfy the min/max restrictions
// for each course category for a given specialization.
func (v *RoadmapValidator) ValidateRestrictions(
	coursesInSem []interfaces.CourseData,
	currentSemNum int,
	restrictionsMap map[string][]interfaces.CourseRestrictionData,
) []schemas.ValidationMessage {
	var messages []schemas.ValidationMessage

	// Count courses by category in this semester
	categoryCounts := make(map[enums.CourseCategory]int)
	for _, c := range coursesInSem {
		categoryCounts[c.Category]++
	}

	// Check each restriction for this semester
	for specTitle, restrictions := range restrictionsMap {
		for _, r := range restrictions {
			if r.Semester != currentSemNum {
				continue
			}

			count := categoryCounts[r.Category]
			
			// Check minimum
			if count < r.MinCourses {
				messages = append(messages, schemas.ValidationMessage{
					Level:   "error",
					Message: fmt.Sprintf("[%s] В %d-м семестре необходимо выбрать минимум %d курсов категории '%s' (выбрано: %d)", 
						specTitle, currentSemNum, r.MinCourses, r.Category, count),
				})
			}

			// Check maximum
			if count > r.MaxCourses {
				messages = append(messages, schemas.ValidationMessage{
					Level:   "error",
					Message: fmt.Sprintf("[%s] В %d-м семестре можно выбрать максимум %d курсов категории '%s' (выбрано: %d)", 
						specTitle, currentSemNum, r.MaxCourses, r.Category, count),
				})
			}
		}
	}

	return messages
}

func (v *RoadmapValidator) ValidateFullRoadmap(
	roadmapData []map[string]interface{},
	initialPassedIDs map[uuid.UUID]bool,
	maxLoad float64,
	requiredCourseIDs map[uuid.UUID]bool,
	restrictionsMap map[string][]interfaces.CourseRestrictionData,
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

		res := v.ValidateSemester(courses, currentPassed, semNum, maxLoad, restrictionsMap)

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

	if len(results) > 0 && len(requiredCourseIDs) > 0 {
		lastSem := results[len(results)-1]
		msgs := lastSem["messages"].([]map[string]interface{})
		isValid := lastSem["valid"].(bool)

		for reqID := range requiredCourseIDs {
			if !currentPassed[reqID] {
				isValid = false
				reqTitle := "Неизвестный курс"
				if rc, ok := v.AllCourses[reqID]; ok {
					reqTitle = rc.Title
				}

				msgs = append(msgs, map[string]interface{}{
					"level":     "error",
					"message":   fmt.Sprintf("На ваш мейджор это обязательный курс: %s", reqTitle),
					"course_id": reqID.String(),
				})
			}
		}

		lastSem["messages"] = msgs
		lastSem["valid"] = isValid
	}

	return results
}

func (v *RoadmapValidator) hasEquivalentPrerequisite(courseID, requiredCourseID uuid.UUID) bool {
	for _, dep := range v.depsByCourse[courseID] {
		if dep.DependencyType == enums.DependencyTypePrerequisite && dep.RequiredCourseID == requiredCourseID {
			return true
		}
	}
	return false
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

func formatMissingPrereqAlternatives(courseTitle string, altTitles []string) string {
	return fmt.Sprintf("Для '%s' нужен один из пререквизитов: %s", courseTitle, strings.Join(altTitles, " / "))
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

func (v *RoadmapValidator) isCoursePassedOrPlanned(
	requiredCourseID uuid.UUID,
	inSemIDs map[uuid.UUID]bool,
	previouslyPassedIDs map[uuid.UUID]bool,
	checkInSem bool,
	checkPassed bool,
) bool {
	if checkInSem && inSemIDs[requiredCourseID] {
		return true
	}
	if checkPassed && previouslyPassedIDs[requiredCourseID] {
		return true
	}

	reqCourse, ok := v.AllCourses[requiredCourseID]
	if !ok || reqCourse.AnalogGroup == "" {
		return false
	}

	if checkInSem {
		for id := range inSemIDs {
			if pc, ok := v.AllCourses[id]; ok && analogGroupsIntersect(pc.AnalogGroup, reqCourse.AnalogGroup) {
				return true
			}
		}
	}
	if checkPassed {
		for id := range previouslyPassedIDs {
			if pc, ok := v.AllCourses[id]; ok && analogGroupsIntersect(pc.AnalogGroup, reqCourse.AnalogGroup) {
				return true
			}
		}
	}

	return false
}
