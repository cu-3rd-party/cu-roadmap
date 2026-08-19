package requirements

import (
	"math"
	"sort"
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type DependencyAnalyzer struct {
	coursesByID     map[uuid.UUID]interfaces.CourseData
	prereqGroups    map[uuid.UUID]map[int][]uuid.UUID
	coreqMap        map[uuid.UUID][]uuid.UUID
	passedIDs       map[uuid.UUID]bool
	cohortYear      int
	currentSemester int
	resetWhenEmpty  bool
	earliestMemo    map[uuid.UUID]int
}

func NewDependencyAnalyzer(
	coursesByID map[uuid.UUID]interfaces.CourseData,
	deps []interfaces.CourseDependencyData,
	passedIDs map[uuid.UUID]bool,
	cohortYear int,
	currentSemester int,
	resetWhenEmpty bool,
) *DependencyAnalyzer {
	prereqGroups := make(map[uuid.UUID]map[int][]uuid.UUID)
	coreqMap := make(map[uuid.UUID][]uuid.UUID)
	for _, d := range deps {
		if d.RequiredCourseID == nil {
			continue
		}
		if d.DependencyType == enums.DependencyTypePrerequisite {
			if prereqGroups[d.CourseID] == nil {
				prereqGroups[d.CourseID] = make(map[int][]uuid.UUID)
			}
			prereqGroups[d.CourseID][d.AlternativeGroup] = append(prereqGroups[d.CourseID][d.AlternativeGroup], *d.RequiredCourseID)
		} else if d.DependencyType == enums.DependencyTypeCorequisite {
			coreqMap[d.CourseID] = append(coreqMap[d.CourseID], *d.RequiredCourseID)
		}
	}
	return &DependencyAnalyzer{
		coursesByID:     coursesByID,
		prereqGroups:    prereqGroups,
		coreqMap:        coreqMap,
		passedIDs:       passedIDs,
		cohortYear:      cohortYear,
		currentSemester: currentSemester,
		resetWhenEmpty:  resetWhenEmpty,
		earliestMemo:    make(map[uuid.UUID]int),
	}
}

func (a *DependencyAnalyzer) EarliestCompletionSemester(id uuid.UUID) int {
	return a.earliestCompletionSemester(id, make(map[uuid.UUID]bool))
}

func (a *DependencyAnalyzer) CourseCovered(id uuid.UUID) bool {
	if a.passedIDs[id] {
		return true
	}
	target, ok := a.coursesByID[id]
	if !ok {
		return false
	}
	group := strings.TrimSpace(target.AnalogGroup)
	if group == "" {
		return false
	}
	for passedID := range a.passedIDs {
		if passed, ok := a.coursesByID[passedID]; ok && strings.EqualFold(strings.TrimSpace(passed.AnalogGroup), group) {
			return true
		}
	}
	return false
}

func (a *DependencyAnalyzer) courseCanCover(id uuid.UUID) bool {
	return a.EarliestCompletionSemester(id) <= 8
}

func (a *DependencyAnalyzer) BuildCourseStatusDetails(courseIDs map[uuid.UUID]bool) ([]map[string]interface{}, []map[string]interface{}, []map[string]interface{}) {
	ids := make([]uuid.UUID, 0, len(courseIDs))
	for id := range courseIDs {
		ids = append(ids, id)
	}
	sort.Slice(ids, func(i, j int) bool { return ids[i].String() < ids[j].String() })
	covered := make([]map[string]interface{}, 0)
	canCover := make([]map[string]interface{}, 0)
	cannotCover := make([]map[string]interface{}, 0)
	for _, id := range ids {
		title := ""
		if course, ok := a.coursesByID[id]; ok {
			title = course.Title
		}
		item := map[string]interface{}{"course_id": id.String(), "title": title}
		if a.CourseCovered(id) {
			covered = append(covered, item)
		} else if a.courseCanCover(id) {
			canCover = append(canCover, item)
		} else {
			cannotCover = append(cannotCover, item)
		}
	}
	return covered, canCover, cannotCover
}

func (a *DependencyAnalyzer) CategorizeCourseIDs(courseIDs map[uuid.UUID]bool) ([]string, []string, []string) {
	ids := make([]uuid.UUID, 0, len(courseIDs))
	for id := range courseIDs {
		ids = append(ids, id)
	}
	sort.Slice(ids, func(i, j int) bool { return ids[i].String() < ids[j].String() })
	covered := make([]string, 0)
	canCover := make([]string, 0)
	cannotCover := make([]string, 0)
	for _, id := range ids {
		idStr := id.String()
		if a.CourseCovered(id) {
			covered = append(covered, idStr)
		} else if a.courseCanCover(id) {
			canCover = append(canCover, idStr)
		} else {
			cannotCover = append(cannotCover, idStr)
		}
	}
	return covered, canCover, cannotCover
}

func (a *DependencyAnalyzer) earliestCompletionSemester(id uuid.UUID, visited map[uuid.UUID]bool) int {
	if a.CourseCovered(id) {
		return 0
	}
	if sem, ok := a.earliestMemo[id]; ok {
		return sem
	}
	if visited[id] {
		return math.MaxInt32
	}
	course, ok := a.coursesByID[id]
	if !ok {
		return math.MaxInt32
	}
	if a.cohortYear != 0 && len(course.AllowedCohorts) > 0 && !containsInt(course.AllowedCohorts, a.cohortYear) {
		return math.MaxInt32
	}
	visited[id] = true
	readySemester := a.currentSemester
	if a.resetWhenEmpty {
		readySemester = 1
		if len(a.passedIDs) > 0 && a.currentSemester > 1 {
			readySemester = a.currentSemester
		}
	}
	for groupNum, group := range a.prereqGroups[id] {
		if groupNum == 0 {
			for _, pid := range group {
				prereqSem := a.earliestCompletionSemester(pid, visited)
				if prereqSem == math.MaxInt32 {
					delete(visited, id)
					return math.MaxInt32
				}
				if prereqSem+1 > readySemester {
					readySemester = prereqSem + 1
				}
			}
		} else {
			minGroupReadySem := math.MaxInt32
			for _, pid := range group {
				prereqSem := a.earliestCompletionSemester(pid, visited)
				if prereqSem != math.MaxInt32 && prereqSem+1 < minGroupReadySem {
					minGroupReadySem = prereqSem + 1
				}
			}
			if minGroupReadySem == math.MaxInt32 {
				delete(visited, id)
				return math.MaxInt32
			}
			if minGroupReadySem > readySemester {
				readySemester = minGroupReadySem
			}
		}
	}
	for _, pid := range a.coreqMap[id] {
		coreqSem := a.earliestCompletionSemester(pid, visited)
		if coreqSem == math.MaxInt32 {
			delete(visited, id)
			return math.MaxInt32
		}
		if coreqSem > readySemester {
			readySemester = coreqSem
		}
	}
	delete(visited, id)
	for sem := readySemester; sem <= 8; sem++ {
		if offeredInSemester(course, sem) {
			a.earliestMemo[id] = sem
			return sem
		}
	}
	return math.MaxInt32
}

func offeredInSemester(c interfaces.CourseData, semester int) bool {
	if len(c.AvailableSemesters) == 0 {
		return true
	}
	allOdd := true
	allEven := true
	for _, s := range c.AvailableSemesters {
		if s == semester {
			return true
		}
		if s%2 == 0 {
			allOdd = false
		} else {
			allEven = false
		}
	}
	if allOdd {
		return semester%2 != 0
	}
	if allEven {
		return semester%2 == 0
	}
	return false
}

func GroupCourseIDsByAnalog(courseIDs map[uuid.UUID]bool, coursesByID map[uuid.UUID]interfaces.CourseData) []map[uuid.UUID]bool {
	groups := []map[uuid.UUID]bool{}
	groupIndexByAnalog := make(map[string]int)
	for id := range courseIDs {
		course, ok := coursesByID[id]
		if ok && course.AnalogGroup != "" {
			if idx, exists := groupIndexByAnalog[course.AnalogGroup]; exists {
				groups[idx][id] = true
				continue
			}
		}
		idx := len(groups)
		if ok && course.AnalogGroup != "" {
			groupIndexByAnalog[course.AnalogGroup] = idx
		}
		groups = append(groups, map[uuid.UUID]bool{id: true})
	}
	return groups
}
