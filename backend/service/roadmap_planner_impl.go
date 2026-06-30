package service

import (
	"fmt"
	"math"
	"sort"
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type roadmapSelectionStrategy func(*roadmapPlanningContext, int) []uuid.UUID

type roadmapPlanningContext struct {
	store             interfaces.StoreBase
	allCourses        map[uuid.UUID]interfaces.CourseData
	targetCourses     map[uuid.UUID]interfaces.CourseData
	prereqGroups      map[uuid.UUID]map[int][]uuid.UUID // courseID -> groupNum -> []alternativeCourseIDs
	coreqs            map[uuid.UUID]map[int][]uuid.UUID
	unlocksCount      map[uuid.UUID]int
	passedIDs         map[uuid.UUID]bool
	coursesTodo       map[uuid.UUID]interfaces.CourseData
	coreCourseIDs     map[uuid.UUID]bool
	commonCourseIDs   map[uuid.UUID]bool
	reservedForFuture map[uuid.UUID]bool
	maxLoad           float64
	cohort            int
}

type semesterBundle struct {
	courseIDs []uuid.UUID
	load      float64
	score     float64
}

func newRoadmapPlanningContext(
	store interfaces.StoreBase,
	passedCourseIDs []uuid.UUID,
	plannedSemesters []schemas.PlannedSemester,
	majorID uuid.UUID,
	specializationID *uuid.UUID,
	maxLoad float64,
	cohort int,
) (*roadmapPlanningContext, interface{}, error) {
	requirements, err := store.GetMajorRequirements(majorID)
	if err != nil {
		return nil, nil, err
	}
	if len(requirements) == 0 {
		return nil, map[string]interface{}{"error": "Major requirements not found"}, nil
	}

	allCourses, err := store.GetAllCourses()
	if err != nil {
		return nil, nil, err
	}

	var specTitle *string
	if specializationID != nil {
		specs, err := store.GetSpecializationsByMajor(majorID)
		if err == nil {
			for _, s := range specs {
				if s.ID == *specializationID {
					t := s.Title
					specTitle = &t
					break
				}
			}
		}
	}

	for _, c := range allCourses {
		upperGroup := strings.ToUpper(c.AnalogGroup)
		if strings.Contains(upperGroup, "ОБЯЗ&ВРУЧНУЮ:") {
			continue // Mandatory but must be manually picked, skip auto-injection
		}
		if strings.Contains(upperGroup, "ОБЯЗ:") {
			fmt.Printf("DEBUG INJECT: Injecting %s (group: %s)\n", c.Title, c.AnalogGroup)
			requirements = append(requirements, interfaces.MajorRequirementData{
				CourseID:        c.ID,
				RequirementType: enums.RequirementTypeMajorCore,
			})
		}
	}

	// Collect fulfilled analog groups from passed and planned courses
	passedIDs := make(map[uuid.UUID]bool)
	for _, id := range passedCourseIDs {
		passedIDs[id] = true
	}

	// Also collect planned course IDs
	plannedIDs := make(map[uuid.UUID]bool)
	for _, ps := range plannedSemesters {
		for _, id := range ps.CourseIDs {
			plannedIDs[id] = true
		}
	}

	fulfilledAnalogGroups := make(map[string]bool)
	// Mark groups from passed courses
	for _, id := range passedCourseIDs {
		if c, ok := allCourses[id]; ok && c.AnalogGroup != "" && !shouldAutoForceExclusiveSemester(c, allCourses) {
			fulfilledAnalogGroups[c.AnalogGroup] = true
		}
	}
	// Mark groups from planned courses
	for _, ps := range plannedSemesters {
		for _, id := range ps.CourseIDs {
			if c, ok := allCourses[id]; ok && c.AnalogGroup != "" && !shouldAutoForceExclusiveSemester(c, allCourses) {
				fulfilledAnalogGroups[c.AnalogGroup] = true
			}
		}
	}

	targetCourses := make(map[uuid.UUID]interfaces.CourseData)
	coreCourseIDs := make(map[uuid.UUID]bool)
	commonCourseIDs := make(map[uuid.UUID]bool)
	for _, req := range requirements {
		if c, ok := allCourses[req.CourseID]; ok {
			if cohort != 0 && len(c.AllowedCohorts) > 0 && !cohortInSlice(cohort, c.AllowedCohorts) {
				continue
			}

			if req.RequirementType == enums.RequirementTypeMajorChoice && specTitle != nil {
				belongs := false
				for _, t := range req.Specializations {
					if t == *specTitle {
						belongs = true
						break
					}
				}
				if !belongs {
					continue
				}
			}

			// If the analog group is fulfilled by passed or planned courses,
			// we skip other courses of this group from being added to targetCourses.
			if c.AnalogGroup != "" && !shouldAutoForceExclusiveSemester(c, allCourses) && fulfilledAnalogGroups[c.AnalogGroup] {
				isTheFulfillingCourse := passedIDs[req.CourseID] || plannedIDs[req.CourseID]
				if !isTheFulfillingCourse {
					fmt.Printf("DEBUG: Skipping %s (group %s already fulfilled)\n", c.Title, c.AnalogGroup)
					continue
				}
			}

			targetCourses[req.CourseID] = c
			if c.AnalogGroup != "" {
				fmt.Printf("DEBUG: Added %s to targetCourses (group %s)\n", c.Title, c.AnalogGroup)
			}
			if !plannedIDs[req.CourseID] && (req.RequirementType == enums.RequirementTypeMajorCore || req.RequirementType == enums.RequirementTypeUniversity) {
				coreCourseIDs[req.CourseID] = true
			}
			if req.RequirementType == enums.RequirementTypeUniversity || c.Category == enums.CourseCategoryFundamentals {
				commonCourseIDs[req.CourseID] = true
			}
		}
	}
	if len(targetCourses) == 0 {
		return nil, map[string]interface{}{"error": "No courses found for major requirements"}, nil
	}

	allDeps, err := store.GetCourseDependencies()
	if err != nil {
		return nil, nil, err
	}

	unlocksCount := make(map[uuid.UUID]int)
	prereqGroups := make(map[uuid.UUID]map[int][]uuid.UUID)
	coreqs := make(map[uuid.UUID]map[int][]uuid.UUID)
	mandatoryReqs := make(map[uuid.UUID]bool)

	for _, dep := range allDeps {
		switch dep.DependencyType {
		case enums.DependencyTypePrerequisite:
			if prereqGroups[dep.CourseID] == nil {
				prereqGroups[dep.CourseID] = make(map[int][]uuid.UUID)
			}
			prereqGroups[dep.CourseID][dep.AlternativeGroup] = append(
				prereqGroups[dep.CourseID][dep.AlternativeGroup], dep.RequiredCourseID,
			)
			if dep.AlternativeGroup == 0 {
				mandatoryReqs[dep.RequiredCourseID] = true
			}
			unlocksCount[dep.RequiredCourseID]++
		case enums.DependencyTypeCorequisite:
			if coreqs[dep.CourseID] == nil {
				coreqs[dep.CourseID] = make(map[int][]uuid.UUID)
			}
			coreqs[dep.CourseID][dep.AlternativeGroup] = append(
				coreqs[dep.CourseID][dep.AlternativeGroup], dep.RequiredCourseID,
			)
			if dep.AlternativeGroup == 0 {
				mandatoryReqs[dep.RequiredCourseID] = true
			}
		}
	}

	// Prune targetCourses for AnalogGroup duplicates BEFORE resolving dependencies
	analogGroupKeepers := make(map[string]uuid.UUID)
	for id := range passedIDs {
		if c, ok := allCourses[id]; ok && c.AnalogGroup != "" && !shouldAutoForceExclusiveSemester(c, allCourses) {
			analogGroupKeepers[c.AnalogGroup] = id
		}
	}
	for id := range plannedIDs {
		if c, ok := allCourses[id]; ok && c.AnalogGroup != "" && !shouldAutoForceExclusiveSemester(c, allCourses) {
			analogGroupKeepers[c.AnalogGroup] = id
		}
	}

	for reqCourseID, reqCourse := range targetCourses {
		if reqCourse.AnalogGroup != "" && !shouldAutoForceExclusiveSemester(reqCourse, allCourses) {
			if existingID, exists := analogGroupKeepers[reqCourse.AnalogGroup]; exists {
				// Duplicate found!
				// If the existing one was explicitly passed/planned, we MUST keep it and drop the new one.
				if passedIDs[existingID] || plannedIDs[existingID] {
					fmt.Printf("DEBUG Prune: Keeping existing %s (passed/planned), dropping %s\n", allCourses[existingID].Title, reqCourse.Title)
					delete(targetCourses, reqCourseID)
					delete(coreCourseIDs, reqCourseID)
				} else {
					// Neither was passed/planned.
					// Prefer the one that is globally mandatory. If tied, prefer the one with more unlocks (base course).
					shouldReplace := false
					if mandatoryReqs[reqCourseID] && !mandatoryReqs[existingID] {
						shouldReplace = true
					} else if mandatoryReqs[reqCourseID] == mandatoryReqs[existingID] {
						if unlocksCount[reqCourseID] > unlocksCount[existingID] {
							shouldReplace = true
						} else if unlocksCount[reqCourseID] == unlocksCount[existingID] {
							// If exactly tied, prefer '🔴' or avoid '⚫️' just in case.
							if strings.Contains(reqCourse.Title, "🔴") && !strings.Contains(allCourses[existingID].Title, "🔴") {
								shouldReplace = true
							}
						}
					}

					if shouldReplace {
						fmt.Printf("DEBUG Prune: Replacing %s (unlocks %d) with %s (unlocks %d)\n", allCourses[existingID].Title, unlocksCount[existingID], reqCourse.Title, unlocksCount[reqCourseID])
						delete(targetCourses, existingID)
						delete(coreCourseIDs, existingID)
						analogGroupKeepers[reqCourse.AnalogGroup] = reqCourseID
					} else {
						fmt.Printf("DEBUG Prune: Dropping %s (unlocks %d), keeping %s (unlocks %d)\n", reqCourse.Title, unlocksCount[reqCourseID], allCourses[existingID].Title, unlocksCount[existingID])
						delete(targetCourses, reqCourseID)
						delete(coreCourseIDs, reqCourseID)
					}
				}
			} else {
				fmt.Printf("DEBUG Prune: First seen for %s is %s\n", reqCourse.AnalogGroup, reqCourse.Title)
				analogGroupKeepers[reqCourse.AnalogGroup] = reqCourseID
			}
		}
	}

	// Recursively resolve prerequisite and corequisite dependencies

	var resolveDependencies func(uuid.UUID, bool, bool)
	resolveDependencies = func(cid uuid.UUID, parentIsCore bool, parentIsCommon bool) {
		for groupNum, altIDs := range prereqGroups[cid] {
			if groupNum == 0 {
				// All are mandatory
				for _, reqID := range altIDs {
					if parentIsCore {
						coreCourseIDs[reqID] = true
					}
					if parentIsCommon {
						commonCourseIDs[reqID] = true
					}
					if _, exists := targetCourses[reqID]; !exists {
						if c, ok := allCourses[reqID]; ok {
							if cohort != 0 && len(c.AllowedCohorts) > 0 && !cohortInSlice(cohort, c.AllowedCohorts) {
								continue
							}
							fmt.Printf("DEBUG Add: %s added %s (mandatory)\n", allCourses[cid].Title, c.Title)
							targetCourses[reqID] = c
							resolveDependencies(reqID, parentIsCore, parentIsCommon)
						}
					} else if parentIsCore && !coreCourseIDs[reqID] {
						coreCourseIDs[reqID] = true
						if parentIsCommon {
							commonCourseIDs[reqID] = true
						}
						resolveDependencies(reqID, true, parentIsCommon)
					} else if parentIsCommon && !commonCourseIDs[reqID] {
						commonCourseIDs[reqID] = true
						resolveDependencies(reqID, parentIsCore, true)
					}
				}
			} else {
				// Pick one alternative
				var pickedReqID *uuid.UUID
				for _, reqID := range altIDs {
					if passedIDs[reqID] || plannedIDs[reqID] {
						pickedReqID = &reqID
						break
					}
					if _, exists := targetCourses[reqID]; exists {
						pickedReqID = &reqID
						break
					}
				}
				if pickedReqID == nil && len(altIDs) > 0 {
					// Prefer alternatives that are mandatory for other courses
					for _, reqID := range altIDs {
						if mandatoryReqs[reqID] {
							pickedReqID = &reqID
							break
						}
					}

					// Avoid picking an alternative whose AnalogGroup is already fulfilled by another course in targetCourses
					if pickedReqID == nil {
						for _, reqID := range altIDs {
							if c, ok := allCourses[reqID]; ok {
								if c.AnalogGroup == "" {
									pickedReqID = &reqID
									break
								}
								groupFulfilled := false
								for _, tc := range targetCourses {
									if tc.AnalogGroup == c.AnalogGroup {
										groupFulfilled = true
										break
									}
								}
								if !groupFulfilled {
									pickedReqID = &reqID
									break
								}
							}
						}
					}
					if pickedReqID == nil {
						pickedReqID = &altIDs[0]
					}
				}
				if pickedReqID != nil {
					reqID := *pickedReqID
					if parentIsCore {
						coreCourseIDs[reqID] = true
					}
					if parentIsCommon {
						commonCourseIDs[reqID] = true
					}
					if _, exists := targetCourses[reqID]; !exists {
						if c, ok := allCourses[reqID]; ok {
							if cohort != 0 && len(c.AllowedCohorts) > 0 && !cohortInSlice(cohort, c.AllowedCohorts) {
								continue
							}
							fmt.Printf("DEBUG Add: %s added %s (mandatory)\n", allCourses[cid].Title, c.Title)
							targetCourses[reqID] = c
							resolveDependencies(reqID, parentIsCore, parentIsCommon)
						}
					} else if parentIsCore && !coreCourseIDs[reqID] {
						coreCourseIDs[reqID] = true
						if parentIsCommon {
							commonCourseIDs[reqID] = true
						}
						resolveDependencies(reqID, true, parentIsCommon)
					} else if parentIsCommon && !commonCourseIDs[reqID] {
						commonCourseIDs[reqID] = true
						resolveDependencies(reqID, parentIsCore, true)
					}
				}
			}
		}

		for groupNum, altIDs := range coreqs[cid] {
			if groupNum == 0 {
				// All are mandatory
				for _, reqID := range altIDs {
					if parentIsCore {
						coreCourseIDs[reqID] = true
					}
					if parentIsCommon {
						commonCourseIDs[reqID] = true
					}
					if _, exists := targetCourses[reqID]; !exists {
						if c, ok := allCourses[reqID]; ok {
							if cohort != 0 && len(c.AllowedCohorts) > 0 && !cohortInSlice(cohort, c.AllowedCohorts) {
								continue
							}
							fmt.Printf("DEBUG Add: %s added %s (mandatory)\n", allCourses[cid].Title, c.Title)
							targetCourses[reqID] = c
							resolveDependencies(reqID, parentIsCore, parentIsCommon)
						}
					} else if parentIsCore && !coreCourseIDs[reqID] {
						coreCourseIDs[reqID] = true
						if parentIsCommon {
							commonCourseIDs[reqID] = true
						}
						resolveDependencies(reqID, true, parentIsCommon)
					} else if parentIsCommon && !commonCourseIDs[reqID] {
						commonCourseIDs[reqID] = true
						resolveDependencies(reqID, parentIsCore, true)
					}
				}
			} else {
				// Pick one alternative
				var pickedReqID *uuid.UUID
				for _, reqID := range altIDs {
					if passedIDs[reqID] || plannedIDs[reqID] {
						pickedReqID = &reqID
						break
					}
					if _, exists := targetCourses[reqID]; exists {
						pickedReqID = &reqID
						break
					}
				}
				if pickedReqID == nil && len(altIDs) > 0 {
					// Prefer alternatives that are mandatory for other courses
					for _, reqID := range altIDs {
						if mandatoryReqs[reqID] {
							pickedReqID = &reqID
							break
						}
					}

					// Avoid picking an alternative whose AnalogGroup is already fulfilled by another course in targetCourses
					if pickedReqID == nil {
						for _, reqID := range altIDs {
							if c, ok := allCourses[reqID]; ok {
								if c.AnalogGroup == "" {
									pickedReqID = &reqID
									break
								}
								groupFulfilled := false
								for _, tc := range targetCourses {
									if tc.AnalogGroup == c.AnalogGroup {
										groupFulfilled = true
										break
									}
								}
								if !groupFulfilled {
									pickedReqID = &reqID
									break
								}
							}
						}
					}
					if pickedReqID == nil {
						pickedReqID = &altIDs[0]
					}
				}
				if pickedReqID != nil {
					reqID := *pickedReqID
					if parentIsCore {
						coreCourseIDs[reqID] = true
					}
					if parentIsCommon {
						commonCourseIDs[reqID] = true
					}
					if _, exists := targetCourses[reqID]; !exists {
						if c, ok := allCourses[reqID]; ok {
							if cohort != 0 && len(c.AllowedCohorts) > 0 && !cohortInSlice(cohort, c.AllowedCohorts) {
								continue
							}
							fmt.Printf("DEBUG Add: %s added %s (mandatory)\n", allCourses[cid].Title, c.Title)
							targetCourses[reqID] = c
							resolveDependencies(reqID, parentIsCore, parentIsCommon)
						}
					} else if parentIsCore && !coreCourseIDs[reqID] {
						coreCourseIDs[reqID] = true
						if parentIsCommon {
							commonCourseIDs[reqID] = true
						}
						resolveDependencies(reqID, true, parentIsCommon)
					} else if parentIsCommon && !commonCourseIDs[reqID] {
						commonCourseIDs[reqID] = true
						resolveDependencies(reqID, parentIsCore, true)
					}
				}
			}
		}
	}

	initialCIDs := make([]uuid.UUID, 0, len(targetCourses))
	for cid := range targetCourses {
		initialCIDs = append(initialCIDs, cid)
	}
	for _, cid := range initialCIDs {
		resolveDependencies(cid, coreCourseIDs[cid], commonCourseIDs[cid])
	}

	coursesTodo := make(map[uuid.UUID]interfaces.CourseData)
	for cid, c := range targetCourses {
		if !passedIDs[cid] {
			coursesTodo[cid] = c
		}
	}

	return &roadmapPlanningContext{
		store:             store,
		allCourses:        allCourses,
		targetCourses:     targetCourses,
		prereqGroups:      prereqGroups,
		coreqs:            coreqs,
		unlocksCount:      unlocksCount,
		passedIDs:         passedIDs,
		coursesTodo:       coursesTodo,
		coreCourseIDs:     coreCourseIDs,
		commonCourseIDs:   commonCourseIDs,
		reservedForFuture: make(map[uuid.UUID]bool),
		maxLoad:           maxLoad,
		cohort:            cohort,
	}, nil, nil
}

func generateRoadmapWithStrategy(
	store interfaces.StoreBase,
	passedCourseIDs []uuid.UUID,
	plannedSemesters []schemas.PlannedSemester,
	majorID uuid.UUID,
	specializationID *uuid.UUID,
	currentSemester int,
	maxLoad float64,
	cohort int,
	selectSemester roadmapSelectionStrategy,
) (interface{}, error) {
	ctx, immediate, err := newRoadmapPlanningContext(store, passedCourseIDs, plannedSemesters, majorID, specializationID, maxLoad, cohort)
	if err != nil || immediate != nil {
		return immediate, err
	}

	plannedBySem := make(map[int][]uuid.UUID)
	allCourses, _ := store.GetAllCourses()
	for _, ps := range plannedSemesters {
		plannedBySem[ps.Semester] = append(plannedBySem[ps.Semester], ps.CourseIDs...)
		for _, cid := range ps.CourseIDs {
			if !ctx.passedIDs[cid] {
				ctx.reservedForFuture[cid] = true
				if _, ok := ctx.coursesTodo[cid]; !ok {
					if c, exists := allCourses[cid]; exists {
						ctx.coursesTodo[cid] = c
					}
				}
			}
		}
	}

	forcedCourseIDs := make(map[uuid.UUID]int)
	for cid, course := range ctx.coursesTodo {
		if !shouldAutoForceExclusiveSemester(course, allCourses) {
			continue
		}
		semester := course.AvailableSemesters[0]
		forcedCourseIDs[cid] = semester
		ctx.reservedForFuture[cid] = true
	}

	for cid, semester := range forcedCourseIDs {
		if _, exists := plannedBySem[semester]; !exists {
			plannedBySem[semester] = []uuid.UUID{}
		}
		plannedBySem[semester] = append(plannedBySem[semester], cid)
	}

	var roadmap []map[string]interface{}
	backfillSemesters := make(map[int]bool)
	for semester := range plannedBySem {
		if semester < currentSemester {
			backfillSemesters[semester] = true
		}
	}
	for _, semester := range forcedCourseIDs {
		if semester < currentSemester {
			backfillSemesters[semester] = true
		}
	}

	orderedBackfillSemesters := make([]int, 0, len(backfillSemesters))
	for semester := range backfillSemesters {
		orderedBackfillSemesters = append(orderedBackfillSemesters, semester)
	}
	sort.Ints(orderedBackfillSemesters)

	for _, semester := range orderedBackfillSemesters {
		semLoad := 0.0
		var courseIDs []string
		var newlyPassed []uuid.UUID
		if planned, ok := plannedBySem[semester]; ok {
			for _, cid := range planned {
				if course, exists := ctx.coursesTodo[cid]; exists {
					courseIDs = append(courseIDs, cid.String())
					semLoad += course.Workload
					newlyPassed = append(newlyPassed, cid)
					delete(ctx.coursesTodo, cid)
					delete(ctx.reservedForFuture, cid)
				}
			}
			delete(plannedBySem, semester)
		}

		prefillCommonMandatoryCourses(ctx, semester, &courseIDs, &newlyPassed, &semLoad)

		supplementSemesterPlan(ctx, semester, &courseIDs, &newlyPassed, &semLoad)

		for _, cid := range newlyPassed {
			ctx.passedIDs[cid] = true
		}

		if len(courseIDs) == 0 {
			continue
		}

		roadmap = append(roadmap, map[string]interface{}{
			"semester":   semester,
			"course_ids": courseIDs,
			"total_load": semLoad,
		})
	}

	for semester := currentSemester; (len(ctx.coursesTodo) > 0 || len(plannedBySem) > 0) && semester <= 12; semester++ {
		semLoad := 0.0
		var courseIDs []string

		var newlyPassed []uuid.UUID
		if planned, ok := plannedBySem[semester]; ok {
			for _, cid := range planned {
				if course, exists := ctx.coursesTodo[cid]; exists {
					courseIDs = append(courseIDs, cid.String())
					semLoad += course.Workload
					newlyPassed = append(newlyPassed, cid)
					delete(ctx.coursesTodo, cid)
					delete(ctx.reservedForFuture, cid)
				}
			}
			delete(plannedBySem, semester)
		}

		prefillCommonMandatoryCourses(ctx, semester, &courseIDs, &newlyPassed, &semLoad)

		originalMaxLoad := ctx.maxLoad
		ctx.maxLoad = math.Max(0, originalMaxLoad-semLoad)

		selected := selectSemester(ctx, semester)

		ctx.maxLoad = originalMaxLoad

		if len(selected) > 0 {
			for _, cid := range selected {
				course, ok := ctx.coursesTodo[cid]
				if !ok {
					continue
				}
				courseIDs = append(courseIDs, cid.String())
				semLoad += course.Workload
				newlyPassed = append(newlyPassed, cid)
				delete(ctx.coursesTodo, cid)
			}
		}

		supplementSemesterPlan(ctx, semester, &courseIDs, &newlyPassed, &semLoad)

		for _, cid := range newlyPassed {
			ctx.passedIDs[cid] = true
		}

		if len(courseIDs) == 0 {
			continue
		}

		roadmap = append(roadmap, map[string]interface{}{
			"semester":   semester,
			"course_ids": courseIDs,
			"total_load": semLoad,
		})
	}

	for cid := range ctx.coreCourseIDs {
		if _, stillTodo := ctx.coursesTodo[cid]; stillTodo {
			courseName := ctx.targetCourses[cid].Title
			return nil, fmt.Errorf("Не удалось добавить обязательный курс '%s' в план (проверьте семестры или пререквизиты)", courseName)
		}
	}

	return roadmap, nil
}

func availableCourseBundles(ctx *roadmapPlanningContext, semester int) []semesterBundle {
	available := make([]interfaces.CourseData, 0, len(ctx.coursesTodo))
	for cid, c := range ctx.coursesTodo {
		if ctx.reservedForFuture[cid] {
			continue
		}
		if !prereqsSatisfied(ctx, cid) || !offeredInSemester(c, semester) {
			continue
		}
		if !coreqsSchedulable(ctx, cid, semester) {
			continue
		}
		available = append(available, c)
	}

	bundlesByKey := make(map[string]semesterBundle)
	for _, c := range available {
		bundle, ok := buildBundle(ctx, c.ID, semester)
		if !ok || bundle.load > ctx.maxLoad {
			continue
		}
		key := bundleKey(bundle.courseIDs)
		if _, exists := bundlesByKey[key]; !exists {
			bundle.score = bundleScore(ctx, bundle.courseIDs, semester)
			bundlesByKey[key] = bundle
		}
	}

	bundles := make([]semesterBundle, 0, len(bundlesByKey))
	for _, bundle := range bundlesByKey {
		bundles = append(bundles, bundle)
	}
	sort.Slice(bundles, func(i, j int) bool {
		if bundles[i].score == bundles[j].score {
			if bundles[i].load == bundles[j].load {
				return bundleKey(bundles[i].courseIDs) < bundleKey(bundles[j].courseIDs)
			}
			return bundles[i].load < bundles[j].load
		}
		return bundles[i].score > bundles[j].score
	})
	return bundles
}

func selectGreedySemester(ctx *roadmapPlanningContext, semester int) []uuid.UUID {
	bundles := availableCourseBundles(ctx, semester)
	selected := make([]uuid.UUID, 0)
	selectedSet := make(map[uuid.UUID]bool)
	remainingLoad := ctx.maxLoad

	for _, bundle := range bundles {
		if bundle.load > remainingLoad || overlaps(selectedSet, bundle.courseIDs) {
			continue
		}
		for _, cid := range bundle.courseIDs {
			if !selectedSet[cid] {
				selectedSet[cid] = true
				selected = append(selected, cid)
			}
		}
		remainingLoad -= bundle.load
	}

	return selected
}

func selectDPSemester(ctx *roadmapPlanningContext, semester int) []uuid.UUID {
	bundles := availableCourseBundles(ctx, semester)
	if len(bundles) == 0 {
		return nil
	}

	scale := 2.0
	capacity := int(math.Round(ctx.maxLoad * scale))
	type state struct {
		score float64
		pick  []int
	}

	dp := make([]state, capacity+1)
	for i := range dp {
		dp[i].score = math.Inf(-1)
	}
	dp[0].score = 0

	for i, bundle := range bundles {
		weight := int(math.Round(bundle.load * scale))
		for _cap := capacity; _cap >= weight; _cap-- {
			prev := dp[_cap-weight]
			if math.IsInf(prev.score, -1) {
				continue
			}
			if overlapsWithPicks(prev.pick, bundles, bundle.courseIDs) {
				continue
			}
			candidate := prev.score + bundle.score
			if candidate > dp[_cap].score {
				nextPick := append([]int{}, prev.pick...)
				nextPick = append(nextPick, i)
				dp[_cap] = state{score: candidate, pick: nextPick}
			}
		}
	}

	best := dp[0]
	for _, st := range dp {
		if st.score > best.score {
			best = st
		}
	}

	return flattenBundlePicks(best.pick, bundles)
}

func selectILPSemester(ctx *roadmapPlanningContext, semester int) []uuid.UUID {
	bundles := availableCourseBundles(ctx, semester)
	if len(bundles) == 0 {
		return nil
	}

	bestScore := 0.0
	var best []uuid.UUID
	selectedSet := make(map[uuid.UUID]bool)

	var search func(index int, remainingLoad float64, currentScore float64, current []uuid.UUID)
	search = func(index int, remainingLoad float64, currentScore float64, current []uuid.UUID) {
		if index == len(bundles) {
			if currentScore > bestScore {
				bestScore = currentScore
				best = append([]uuid.UUID{}, current...)
			}
			return
		}

		upperBound := currentScore
		for i := index; i < len(bundles); i++ {
			upperBound += math.Max(bundles[i].score, 0)
		}
		if upperBound <= bestScore {
			return
		}

		search(index+1, remainingLoad, currentScore, current)

		bundle := bundles[index]
		if bundle.load > remainingLoad || overlaps(selectedSet, bundle.courseIDs) {
			return
		}
		for _, cid := range bundle.courseIDs {
			selectedSet[cid] = true
		}
		next := append(append([]uuid.UUID{}, current...), bundle.courseIDs...)
		search(index+1, remainingLoad-bundle.load, currentScore+bundle.score, next)
		for _, cid := range bundle.courseIDs {
			delete(selectedSet, cid)
		}
	}

	search(0, ctx.maxLoad, 0, nil)
	return dedupeCourseIDs(best)
}

func selectLPRelaxationSemester(ctx *roadmapPlanningContext, semester int) []uuid.UUID {
	bundles := availableCourseBundles(ctx, semester)
	if len(bundles) == 0 {
		return nil
	}

	sort.Slice(bundles, func(i, j int) bool {
		ratioI := bundles[i].score / math.Max(bundles[i].load, 1)
		ratioJ := bundles[j].score / math.Max(bundles[j].load, 1)
		if ratioI == ratioJ {
			return bundles[i].score > bundles[j].score
		}
		return ratioI > ratioJ
	})

	fractionalPriority := make(map[uuid.UUID]float64)
	remaining := ctx.maxLoad
	for _, bundle := range bundles {
		fraction := math.Min(1, remaining/math.Max(bundle.load, 1e-9))
		if fraction <= 0 {
			continue
		}
		for _, cid := range bundle.courseIDs {
			fractionalPriority[cid] += fraction * bundle.score / float64(len(bundle.courseIDs))
		}
		remaining -= math.Min(bundle.load, remaining)
		if remaining <= 0 {
			break
		}
	}

	for i := range bundles {
		bundle := &bundles[i]
		bundle.score = 0
		for _, cid := range bundle.courseIDs {
			bundle.score += fractionalPriority[cid]
		}
	}

	selected := make([]uuid.UUID, 0)
	selectedSet := make(map[uuid.UUID]bool)
	remaining = ctx.maxLoad
	for _, bundle := range bundles {
		if bundle.load > remaining || overlaps(selectedSet, bundle.courseIDs) {
			continue
		}
		for _, cid := range bundle.courseIDs {
			if !selectedSet[cid] {
				selectedSet[cid] = true
				selected = append(selected, cid)
			}
		}
		remaining -= bundle.load
	}

	return selected
}

func prereqsSatisfied(ctx *roadmapPlanningContext, cid uuid.UUID) bool {
	groups := ctx.prereqGroups[cid]
	for groupNum, altIDs := range groups {
		if groupNum == 0 {
			// Group 0: each dependency is mandatory (AND)
			for _, reqID := range altIDs {
				if !ctx.passedIDs[reqID] {
					return false
				}
			}
		} else {
			// Groups >= 1: any one alternative being passed is sufficient (OR)
			anyPassed := false
			for _, reqID := range altIDs {
				if ctx.passedIDs[reqID] {
					anyPassed = true
					break
				}
			}
			if !anyPassed {
				return false
			}
		}
	}
	return true
}

func coreqsSchedulable(ctx *roadmapPlanningContext, cid uuid.UUID, semester int) bool {
	for _, altIDs := range ctx.coreqs[cid] {
		anySchedulable := false
		for _, reqID := range altIDs {
			if ctx.passedIDs[reqID] {
				anySchedulable = true
				break
			}
			if ctx.reservedForFuture[reqID] {
				continue
			}
			if reqCourse, ok := ctx.coursesTodo[reqID]; ok && prereqsSatisfied(ctx, reqID) && offeredInSemester(reqCourse, semester) {
				anySchedulable = true
				break
			}
			if hasEquivalentPrerequisiteRelation(ctx, cid, reqID) {
				if reqCourse, ok := ctx.coursesTodo[reqID]; ok && offeredInSemester(reqCourse, semester) {
					anySchedulable = true
					break
				}
			}
		}
		if !anySchedulable {
			return false
		}
	}
	return true
}

func hasEquivalentPrerequisiteRelation(ctx *roadmapPlanningContext, courseID, requiredCourseID uuid.UUID) bool {
	for _, altIDs := range ctx.prereqGroups[courseID] {
		for _, id := range altIDs {
			if id == requiredCourseID {
				return true
			}
		}
	}
	return false
}

func prefillCommonMandatoryCourses(
	ctx *roadmapPlanningContext,
	semester int,
	courseIDs *[]string,
	newlyPassed *[]uuid.UUID,
	semLoad *float64,
) {
	currentSet := make(map[uuid.UUID]bool, len(*newlyPassed))
	for _, cid := range *newlyPassed {
		currentSet[cid] = true
	}

	for {
		added := tryAddSupplementalBundle(ctx, semester, currentSet, courseIDs, newlyPassed, semLoad, func(course interfaces.CourseData) bool {
			return ctx.commonCourseIDs[course.ID]
		}, func(course interfaces.CourseData) int {
			score := 3000
			if shouldAutoForceExclusiveSemester(course, ctx.allCourses) {
				score += 2000
			}
			if course.RecommendedSemester != nil {
				delta := *course.RecommendedSemester - semester
				if delta < 0 {
					delta = -delta
				}
				score += max(0, 200-delta)
			}
			if len(course.AvailableSemesters) == 1 && course.AvailableSemesters[0] == semester {
				score += 1000
			}
			return score
		})
		if !added {
			return
		}
	}
}

func supplementSemesterPlan(
	ctx *roadmapPlanningContext,
	semester int,
	courseIDs *[]string,
	newlyPassed *[]uuid.UUID,
	semLoad *float64,
) {
	currentSet := make(map[uuid.UUID]bool, len(*newlyPassed))
	for _, cid := range *newlyPassed {
		currentSet[cid] = true
	}
	if len(currentSet) == 0 {
		return
	}

	hasSTEM := semesterHasCategory(ctx, currentSet, enums.CourseCategorySTEM)
	hasSoft := semesterHasCategory(ctx, currentSet, enums.CourseCategorySoft)
	hasScienceStudio := hasPassedMatchingCourse(ctx, isScienceStudio) || semesterHasMatchingCourse(ctx, currentSet, isScienceStudio)
	hasBusinessStudio := hasPassedMatchingCourse(ctx, isBusinessStudio) || semesterHasMatchingCourse(ctx, currentSet, isBusinessStudio)

	if semester <= 4 && !hasScienceStudio {
		if tryAddSupplementalBundle(ctx, semester, currentSet, courseIDs, newlyPassed, semLoad, func(course interfaces.CourseData) bool {
			return isScienceStudio(course)
		}, nil) {
			hasScienceStudio = true
			hasSTEM = true
		}
	}

	if semester <= 4 && !hasBusinessStudio {
		if tryAddSupplementalBundle(ctx, semester, currentSet, courseIDs, newlyPassed, semLoad, func(course interfaces.CourseData) bool {
			return isBusinessStudio(course)
		}, nil) {
			hasBusinessStudio = true
			hasSTEM = true
		}
	}

	if !hasSTEM {
		preferScienceStudio := semester < 4 && !hasScienceStudio
		preferBusinessStudio := semester < 4 && !hasBusinessStudio
		if tryAddSupplementalBundle(ctx, semester, currentSet, courseIDs, newlyPassed, semLoad, func(course interfaces.CourseData) bool {
			return course.Category == enums.CourseCategorySTEM
		}, func(course interfaces.CourseData) int {
			score := 0
			if preferScienceStudio && isScienceStudio(course) {
				score += 2000
			}
			if preferBusinessStudio && isBusinessStudio(course) {
				score += 1900
			}
			return score
		}) {
			hasSTEM = true
			hasScienceStudio = hasScienceStudio || semesterHasMatchingCourse(ctx, currentSet, isScienceStudio)
			hasBusinessStudio = hasBusinessStudio || semesterHasMatchingCourse(ctx, currentSet, isBusinessStudio)
		}
	}

	if semester > 1 && !hasSoft {
		if tryAddSupplementalBundle(ctx, semester, currentSet, courseIDs, newlyPassed, semLoad, func(course interfaces.CourseData) bool {
			return course.Category == enums.CourseCategorySoft
		}, nil) {
			hasSoft = true
		}
	}
}

func tryAddSupplementalBundle(
	ctx *roadmapPlanningContext,
	semester int,
	currentSet map[uuid.UUID]bool,
	courseIDs *[]string,
	newlyPassed *[]uuid.UUID,
	semLoad *float64,
	predicate func(interfaces.CourseData) bool,
	extraPriority func(interfaces.CourseData) int,
) bool {
	type candidate struct {
		id       uuid.UUID
		priority int
		load     float64
		title    string
	}

	candidates := make([]candidate, 0)
	for id, course := range ctx.allCourses {
		if ctx.passedIDs[id] || currentSet[id] || ctx.reservedForFuture[id] {
			continue
		}
		if !courseAllowedForCohort(course, ctx.cohort) || !predicate(course) {
			continue
		}
		if course.AnalogGroup != "" && analogGroupFulfilled(ctx, currentSet, course) {
			continue
		}

		priority := 0
		if _, ok := ctx.coursesTodo[id]; ok {
			priority += 1000
		}
		if course.RecommendedSemester != nil {
			delta := *course.RecommendedSemester - semester
			if delta < 0 {
				delta = -delta
			}
			priority += max(0, 100-delta)
		}
		if extraPriority != nil {
			priority += extraPriority(course)
		}

		candidates = append(candidates, candidate{
			id:       id,
			priority: priority,
			load:     course.Workload,
			title:    course.Title,
		})
	}

	sort.Slice(candidates, func(i, j int) bool {
		if candidates[i].priority == candidates[j].priority {
			if candidates[i].load == candidates[j].load {
				if candidates[i].title == candidates[j].title {
					return candidates[i].id.String() < candidates[j].id.String()
				}
				return candidates[i].title < candidates[j].title
			}
			return candidates[i].load < candidates[j].load
		}
		return candidates[i].priority > candidates[j].priority
	})

	for pass := 0; pass < 2; pass++ {
		enforceLoad := pass == 0
		for _, candidate := range candidates {
			bundle, ok := buildSupplementalBundle(ctx, candidate.id, semester, currentSet)
			if !ok || overlaps(currentSet, bundle.courseIDs) {
				continue
			}
			if enforceLoad && *semLoad+bundle.load > ctx.maxLoad {
				continue
			}

			for _, cid := range bundle.courseIDs {
				if currentSet[cid] {
					continue
				}
				course := ctx.allCourses[cid]
				currentSet[cid] = true
				*courseIDs = append(*courseIDs, cid.String())
				*newlyPassed = append(*newlyPassed, cid)
				*semLoad += course.Workload
				delete(ctx.coursesTodo, cid)
				delete(ctx.reservedForFuture, cid)
			}
			return true
		}
	}

	return false
}

func buildSupplementalBundle(
	ctx *roadmapPlanningContext,
	cid uuid.UUID,
	semester int,
	currentSet map[uuid.UUID]bool,
) (semesterBundle, bool) {
	bundleSet := make(map[uuid.UUID]bool)
	queue := []uuid.UUID{cid}
	load := 0.0

	for len(queue) > 0 {
		curr := queue[len(queue)-1]
		queue = queue[:len(queue)-1]
		if bundleSet[curr] || ctx.passedIDs[curr] || currentSet[curr] {
			continue
		}

		course, ok := ctx.allCourses[curr]
		if !ok || !courseAllowedForCohort(course, ctx.cohort) || !prereqsSatisfied(ctx, curr) || !offeredInSemester(course, semester) {
			return semesterBundle{}, false
		}

		bundleSet[curr] = true
		load += course.Workload

		for _, altIDs := range ctx.coreqs[curr] {
			pickedReqID := uuid.Nil
			for _, reqID := range altIDs {
				if ctx.passedIDs[reqID] || currentSet[reqID] || bundleSet[reqID] {
					pickedReqID = reqID
					break
				}
				if ctx.reservedForFuture[reqID] {
					continue
				}
				reqCourse, ok := ctx.allCourses[reqID]
				if !ok || !courseAllowedForCohort(reqCourse, ctx.cohort) || !offeredInSemester(reqCourse, semester) {
					continue
				}
				if prereqsSatisfied(ctx, reqID) || hasEquivalentPrerequisiteRelation(ctx, curr, reqID) {
					pickedReqID = reqID
					break
				}
			}
			if pickedReqID == uuid.Nil {
				return semesterBundle{}, false
			}
			if !ctx.passedIDs[pickedReqID] && !currentSet[pickedReqID] {
				queue = append(queue, pickedReqID)
			}
		}
	}

	courseIDs := make([]uuid.UUID, 0, len(bundleSet))
	for id := range bundleSet {
		courseIDs = append(courseIDs, id)
	}
	sort.Slice(courseIDs, func(i, j int) bool { return courseIDs[i].String() < courseIDs[j].String() })

	return semesterBundle{courseIDs: courseIDs, load: load}, true
}

func semesterHasCategory(ctx *roadmapPlanningContext, currentSet map[uuid.UUID]bool, category enums.CourseCategory) bool {
	for cid := range currentSet {
		if course, ok := ctx.allCourses[cid]; ok && course.Category == category {
			return true
		}
	}
	return false
}

func semesterHasMatchingCourse(ctx *roadmapPlanningContext, currentSet map[uuid.UUID]bool, predicate func(interfaces.CourseData) bool) bool {
	for cid := range currentSet {
		if course, ok := ctx.allCourses[cid]; ok && predicate(course) {
			return true
		}
	}
	return false
}

func hasPassedMatchingCourse(ctx *roadmapPlanningContext, predicate func(interfaces.CourseData) bool) bool {
	for cid := range ctx.passedIDs {
		if course, ok := ctx.allCourses[cid]; ok && predicate(course) {
			return true
		}
	}
	return false
}

func isScienceStudio(course interfaces.CourseData) bool {
	return strings.Contains(strings.ToLower(course.AnalogGroup), "научн")
}

func isBusinessStudio(course interfaces.CourseData) bool {
	return strings.Contains(strings.ToLower(course.AnalogGroup), "бизнес")
}

func analogGroupFulfilled(ctx *roadmapPlanningContext, currentSet map[uuid.UUID]bool, course interfaces.CourseData) bool {
	if course.AnalogGroup == "" || shouldAutoForceExclusiveSemester(course, ctx.allCourses) {
		return false
	}
	for cid := range currentSet {
		if scheduled, ok := ctx.allCourses[cid]; ok && scheduled.AnalogGroup == course.AnalogGroup {
			return true
		}
	}
	for cid := range ctx.passedIDs {
		if scheduled, ok := ctx.allCourses[cid]; ok && scheduled.AnalogGroup == course.AnalogGroup {
			return true
		}
	}
	return false
}

func courseAllowedForCohort(course interfaces.CourseData, cohort int) bool {
	if cohort == 0 || len(course.AllowedCohorts) == 0 {
		return true
	}
	return cohortInSlice(cohort, course.AllowedCohorts)
}

func shouldAutoForceExclusiveSemester(course interfaces.CourseData, allCourses map[uuid.UUID]interfaces.CourseData) bool {
	if course.Category != enums.CourseCategoryFundamentals {
		return false
	}
	if !strings.Contains(strings.ToUpper(course.AnalogGroup), "ОБЯЗ:") {
		return false
	}
	if len(course.AvailableSemesters) != 1 {
		return false
	}

	group := strings.TrimSpace(course.AnalogGroup)
	if group == "" {
		return false
	}

	count := 0
	for _, other := range allCourses {
		if other.ID == course.ID {
			continue
		}
		if strings.EqualFold(strings.TrimSpace(other.AnalogGroup), group) {
			count++
		}
	}
	return count == 0
}

func buildBundle(ctx *roadmapPlanningContext, cid uuid.UUID, semester int) (semesterBundle, bool) {
	bundleSet := make(map[uuid.UUID]bool)
	queue := []uuid.UUID{cid}
	load := 0.0

	for len(queue) > 0 {
		curr := queue[len(queue)-1]
		queue = queue[:len(queue)-1]
		if bundleSet[curr] || ctx.passedIDs[curr] {
			continue
		}
		course, ok := ctx.coursesTodo[curr]
		if !ok || !prereqsSatisfied(ctx, curr) || !offeredInSemester(course, semester) {
			return semesterBundle{}, false
		}
		bundleSet[curr] = true
		load += course.Workload
		for _, altIDs := range ctx.coreqs[curr] {
			pickedReqID := uuid.Nil
			for _, reqID := range altIDs {
				if ctx.passedIDs[reqID] {
					pickedReqID = reqID
					break
				}
				if _, ok := ctx.coursesTodo[reqID]; ok {
					pickedReqID = reqID
					break
				}
			}
			if pickedReqID == uuid.Nil {
				return semesterBundle{}, false
			}
			if !ctx.passedIDs[pickedReqID] {
				queue = append(queue, pickedReqID)
			}
		}
	}

	courseIDs := make([]uuid.UUID, 0, len(bundleSet))
	for id := range bundleSet {
		courseIDs = append(courseIDs, id)
	}
	sort.Slice(courseIDs, func(i, j int) bool { return courseIDs[i].String() < courseIDs[j].String() })

	return semesterBundle{courseIDs: courseIDs, load: load}, true
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

	// Sheet sync stores seasonal availability as repeated odd/even semesters
	// (for example, 1/3/5/7 for autumn, 2/4/6/8 for spring).
	if allOdd {
		return semester%2 != 0
	}
	if allEven {
		return semester%2 == 0
	}
	return false
}

func bundleScore(ctx *roadmapPlanningContext, courseIDs []uuid.UUID, semester int) float64 {
	score := 0.0
	for _, cid := range courseIDs {
		course := ctx.targetCourses[cid]
		recommendedBonus := 0.0
		if course.RecommendedSemester != nil {
			recommendedBonus = 1.0 / float64(*course.RecommendedSemester+1)
		}

		obyazBonus := 0.0
		if strings.Contains(strings.ToUpper(course.AnalogGroup), "ОБЯЗ:") {
			if semester <= 4 {
				obyazBonus = 1000.0 // heavily prioritize in first 4 semesters
			} else {
				obyazBonus = 500.0 // still try to take it ASAP if delayed
			}
		}

		score += 10 + float64(ctx.unlocksCount[cid])*3 + recommendedBonus - course.Workload*0.1 + obyazBonus
		if obyazBonus > 0 {
			fmt.Printf("DEBUG BUNDLE: Course %s got obyazBonus %.1f, total score %.1f\n", course.Title, obyazBonus, score)
		}
	}
	return score
}

func overlaps(existing map[uuid.UUID]bool, candidate []uuid.UUID) bool {
	for _, cid := range candidate {
		if existing[cid] {
			return true
		}
	}
	return false
}

func overlapsWithPicks(picks []int, bundles []semesterBundle, candidate []uuid.UUID) bool {
	seen := make(map[uuid.UUID]bool)
	for _, idx := range picks {
		for _, cid := range bundles[idx].courseIDs {
			seen[cid] = true
		}
	}
	return overlaps(seen, candidate)
}

func flattenBundlePicks(picks []int, bundles []semesterBundle) []uuid.UUID {
	selected := make([]uuid.UUID, 0)
	seen := make(map[uuid.UUID]bool)
	for _, idx := range picks {
		for _, cid := range bundles[idx].courseIDs {
			if !seen[cid] {
				seen[cid] = true
				selected = append(selected, cid)
			}
		}
	}
	return selected
}

func dedupeCourseIDs(courseIDs []uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]bool)
	out := make([]uuid.UUID, 0, len(courseIDs))
	for _, cid := range courseIDs {
		if !seen[cid] {
			seen[cid] = true
			out = append(out, cid)
		}
	}
	return out
}

func bundleKey(courseIDs []uuid.UUID) string {
	parts := make([]string, 0, len(courseIDs))
	for _, cid := range courseIDs {
		parts = append(parts, cid.String())
	}
	return joinStrings(parts, ",")
}

func joinStrings(parts []string, sep string) string {
	if len(parts) == 0 {
		return ""
	}
	result := parts[0]
	for i := 1; i < len(parts); i++ {
		result += sep + parts[i]
	}
	return result
}
