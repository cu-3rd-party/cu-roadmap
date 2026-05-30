package service

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/google/uuid"
)

// TODO: abstract out the planner into an interface and create DP planner, ILP planner and Linear Programming Relaxation
type GreedyPlanner struct {
	store store.StoreBase
}

func NewGreedyPlanner(s store.StoreBase) *GreedyPlanner {
	return &GreedyPlanner{store: s}
}

func (p *GreedyPlanner) GenerateRoadmap(
	passedCourseIDs []uuid.UUID,
	majorID uuid.UUID,
	currentSemester int,
	maxLoad float64,
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

	targetCourses := make(map[uuid.UUID]store.CourseData)
	for _, req := range requirements {
		if c, ok := allCourses[req.CourseID]; ok {
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
	coreqsType1 := make(map[uuid.UUID][]uuid.UUID)
	coreqsType2 := make(map[uuid.UUID][]uuid.UUID)

	for _, dep := range allDeps {
		switch dep.DependencyType {
		case enums.DependencyTypePrerequisite:
			prereqs[dep.CourseID] = append(prereqs[dep.CourseID], dep.RequiredCourseID)
			unlocksCount[dep.RequiredCourseID]++
		case enums.DependencyTypeCorequisite1:
			coreqsType1[dep.CourseID] = append(coreqsType1[dep.CourseID], dep.RequiredCourseID)
		case enums.DependencyTypeCorequisite2:
			coreqsType2[dep.CourseID] = append(coreqsType2[dep.CourseID], dep.RequiredCourseID)
		}
	}

	passedIDs := make(map[uuid.UUID]bool)
	for _, id := range passedCourseIDs {
		passedIDs[id] = true
	}

	coursesTodo := make(map[uuid.UUID]store.CourseData)
	for cid, c := range targetCourses {
		if !passedIDs[cid] {
			coursesTodo[cid] = c
		}
	}

	currentSem := currentSemester
	var roadmap []map[string]interface{}

	for len(coursesTodo) > 0 {
		var available []store.CourseData
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

			for _, reqID := range coreqsType2[cid] {
				if !passedIDs[reqID] {
					if _, inTodo := coursesTodo[reqID]; !inTodo {
						canTake = false
						break
					}
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

		var semCourses []store.CourseData
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
			var neededTogether []store.CourseData

			for _, reqID := range coreqsType1[c.ID] {
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
