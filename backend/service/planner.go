package service

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type PlannerService struct {
	store        interfaces.StoreBase
	depsByCourse map[uuid.UUID][]interfaces.CourseDependencyData
}

func NewPlannerService(s interfaces.StoreBase) *PlannerService {
	return &PlannerService{
		store:        s,
		depsByCourse: make(map[uuid.UUID][]interfaces.CourseDependencyData),
	}
}

func (s *PlannerService) loadDependencies() error {
	deps, err := s.store.GetCourseDependencies()
	if err != nil {
		return err
	}
	s.depsByCourse = make(map[uuid.UUID][]interfaces.CourseDependencyData)
	for _, dep := range deps {
		s.depsByCourse[dep.CourseID] = append(s.depsByCourse[dep.CourseID], dep)
	}
	return nil
}

func (s *PlannerService) GetAllCourses() (map[uuid.UUID]interfaces.CourseData, error) {
	return s.store.GetAllCourses()
}

func (s *PlannerService) FindPathToCourse(
	targetCourseID uuid.UUID,
	passedIDs map[uuid.UUID]bool,
	currentSemester int,
	maxLoad float64,
) ([]map[string]interface{}, error) {
	if err := s.loadDependencies(); err != nil {
		return nil, err
	}
	allCourses, err := s.GetAllCourses()
	if err != nil {
		return nil, err
	}

	target, ok := allCourses[targetCourseID]
	if !ok {
		return []map[string]interface{}{
			{"error": "Target course not found"},
		}, nil
	}
	_ = target

	neededIDs := make(map[uuid.UUID]bool)
	toCheck := []uuid.UUID{targetCourseID}
	for len(toCheck) > 0 {
		currID := toCheck[len(toCheck)-1]
		toCheck = toCheck[:len(toCheck)-1]
		if passedIDs[currID] || neededIDs[currID] {
			continue
		}
		neededIDs[currID] = true
		for _, dep := range s.depsByCourse[currID] {
			if dep.DependencyType == enums.DependencyTypePrerequisite {
				toCheck = append(toCheck, dep.RequiredCourseID)
			}
		}
	}

	coursesTodo := make(map[uuid.UUID]interfaces.CourseData)
	for cid := range neededIDs {
		if c, ok := allCourses[cid]; ok {
			coursesTodo[cid] = c
		}
	}

	currentPassed := make(map[uuid.UUID]bool)
	for id := range passedIDs {
		currentPassed[id] = true
	}

	var roadmap []map[string]interface{}
	currentSem := currentSemester

	for len(coursesTodo) > 0 {
		var available []interfaces.CourseData
		for cid, c := range coursesTodo {
			canTake := true
			for _, dep := range s.depsByCourse[cid] {
				if dep.DependencyType == enums.DependencyTypePrerequisite && !currentPassed[dep.RequiredCourseID] {
					canTake = false
					break
				}
			}
			if canTake {
				available = append(available, c)
			}
		}

		if len(available) == 0 {
			roadmap = append(roadmap, map[string]interface{}{
				"semester": currentSem,
				"error":    "Cannot satisfy dependencies for remaining courses.",
			})
			break
		}

		isOdd := currentSem%2 != 0
		var availableOffered []interfaces.CourseData
		for _, c := range available {
			if len(c.AvailableSemesters) > 0 {
				courseIsOdd := false
				for _, s := range c.AvailableSemesters {
					if s%2 != 0 {
						courseIsOdd = true
						break
					}
				}
				if isOdd != courseIsOdd {
					continue
				}
			}
			availableOffered = append(availableOffered, c)
		}

		if len(availableOffered) == 0 {
			roadmap = append(roadmap, map[string]interface{}{
				"semester": currentSem,
				"courses":  []interface{}{},
				"status":   "Waiting for correct semester offering",
			})
		} else {
			var semCourses []interfaces.CourseData
			semLoad := 0.0
			for _, c := range availableOffered {
				if semLoad+c.Workload <= maxLoad {
					semCourses = append(semCourses, c)
					semLoad += c.Workload
				}
			}
			var semCoursesOut []map[string]interface{}
			for _, c := range semCourses {
				currentPassed[c.ID] = true
				delete(coursesTodo, c.ID)
				semCoursesOut = append(semCoursesOut, map[string]interface{}{
					"id":       c.ID.String(),
					"title":    c.Title,
					"workload": c.Workload,
				})
			}
			roadmap = append(roadmap, map[string]interface{}{
				"semester":   currentSem,
				"courses":    semCoursesOut,
				"total_load": semLoad,
			})
		}

		currentSem++
		if currentSem > 20 {
			break
		}
	}

	return roadmap, nil
}
