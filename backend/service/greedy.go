package service

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

// TODO: abstract out the planner into an interfaces and create DP planner, ILP planner and Linear Programming Relaxation
type GreedyPlanner struct {
	store interfaces.StoreBase
}

func NewGreedyPlanner(s interfaces.StoreBase) *GreedyPlanner {
	return &GreedyPlanner{store: s}
}

func (p *GreedyPlanner) GenerateRoadmap(
	passedCourseIDs []uuid.UUID,
	majorID uuid.UUID,
	currentSemester int,
	maxLoad float64,
	cohort int,
) (interface{}, error) {
	requirements, err := p.store.GetMajorRequirements(majorID)
	if err != nil {
		return nil, err
	}
	if len(requirements) == 0 {
		return map[string]interface{}{"error": "Major requirements not found"}, nil
	}

	allCourses, err := p.store.GetAllCourses()
	if err != nil {
		return nil, err
	}

	targetCourses := make(map[uuid.UUID]interfaces.CourseData)
	for _, req := range requirements {
		if c, ok := allCourses[req.CourseID]; ok {
			if cohort != 0 && len(c.AllowedCohorts) > 0 && !cohortInSlice(cohort, c.AllowedCohorts) {
				continue
			}
			targetCourses[req.CourseID] = c
		}
	}
	if len(targetCourses) == 0 {
		return map[string]interface{}{"error": "No courses found for major requirements"}, nil
	}

	allDeps, err := p.store.GetCourseDependencies()
	if err != nil {
		return nil, err
	}

	unlocksCount := make(map[uuid.UUID]int)
	prereqs := make(map[uuid.UUID][]uuid.UUID)
	coreqs := make(map[uuid.UUID][]uuid.UUID)

	for _, dep := range allDeps {
		switch dep.DependencyType {
		case enums.DependencyTypePrerequisite:
			prereqs[dep.CourseID] = append(prereqs[dep.CourseID], dep.RequiredCourseID)
			unlocksCount[dep.RequiredCourseID]++
		case enums.DependencyTypeCorequisite:
			coreqs[dep.CourseID] = append(coreqs[dep.CourseID], dep.RequiredCourseID)
		}
	}

	passedIDs := make(map[uuid.UUID]bool)
	for _, id := range passedCourseIDs {
		passedIDs[id] = true
	}

	coursesTodo := make(map[uuid.UUID]interfaces.CourseData)
	for cid, c := range targetCourses {
		if !passedIDs[cid] {
			coursesTodo[cid] = c
		}
	}

	currentSem := currentSemester
	var roadmap []map[string]interface{}

	for len(coursesTodo) > 0 {
		var available []interfaces.CourseData
		for cid, c := range coursesTodo {
			canTake := true

			for _, reqID := range prereqs[cid] {
				if !passedIDs[reqID] {
					canTake = false
					break
				}
			}
			if !canTake {
				continue
			}

			for _, reqID := range coreqs[cid] {
				if passedIDs[reqID] {
					continue
				}
				// Coreqs must be schedulable in the same semester. If the required
				// course isn't already passed, it must still be in todo so it can be
				// picked together.
				if _, inTodo := coursesTodo[reqID]; !inTodo {
					canTake = false
					break
				}
			}
			if !canTake {
				continue
			}

			available = append(available, c)
		}

		if len(available) == 0 {
			break
		}

		for i := 0; i < len(available); i++ {
			for j := i + 1; j < len(available); j++ {
				if unlocksCount[available[j].ID] > unlocksCount[available[i].ID] {
					available[i], available[j] = available[j], available[i]
				}
			}
		}

		var semCourses []interfaces.CourseData
		semLoad := 0.0
		isOddSem := currentSem%2 != 0

		for _, c := range available {
			if len(c.AvailableSemesters) > 0 {
				courseIsOdd := false
				for _, s := range c.AvailableSemesters {
					if s%2 != 0 {
						courseIsOdd = true
						break
					}
				}
				if isOddSem != courseIsOdd {
					continue
				}
			}

			canAdd := true
			totalCLoad := c.Workload
			var neededTogether []interfaces.CourseData

			for _, reqID := range coreqs[c.ID] {
				if !passedIDs[reqID] {
					if rc, inTodo := coursesTodo[reqID]; inTodo {
						totalCLoad += rc.Workload
						neededTogether = append(neededTogether, rc)
					} else {
						canAdd = false
						break
					}
				}
			}
			if !canAdd {
				continue
			}

			if semLoad+totalCLoad <= maxLoad {
				semCourses = append(semCourses, c)
				semLoad += c.Workload
				passedIDs[c.ID] = true
				delete(coursesTodo, c.ID)

				for _, rc := range neededTogether {
					semCourses = append(semCourses, rc)
					semLoad += rc.Workload
					passedIDs[rc.ID] = true
					delete(coursesTodo, rc.ID)
				}
			}
		}

		if len(semCourses) > 0 {
			var coursesOut []map[string]interface{}
			for _, c := range semCourses {
				coursesOut = append(coursesOut, map[string]interface{}{
					"id":       c.ID.String(),
					"title":    c.Title,
					"workload": c.Workload,
					"type":     string(c.CourseType),
				})
			}
			roadmap = append(roadmap, map[string]interface{}{
				"semester":   currentSem,
				"courses":    coursesOut,
				"total_load": semLoad,
			})
		}

		currentSem++
		if currentSem > 12 {
			break
		}
	}

	return roadmap, nil
}

func cohortInSlice(cohort int, cohorts []int) bool {
	for _, c := range cohorts {
		if c == cohort {
			return true
		}
	}
	return false
}
