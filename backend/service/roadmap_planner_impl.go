package service

import (
	"math"
	"sort"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type roadmapSelectionStrategy func(*roadmapPlanningContext, int) []uuid.UUID

type roadmapPlanningContext struct {
	store         interfaces.StoreBase
	targetCourses map[uuid.UUID]interfaces.CourseData
	prereqs       map[uuid.UUID][]uuid.UUID
	coreqs        map[uuid.UUID][]uuid.UUID
	unlocksCount  map[uuid.UUID]int
	passedIDs     map[uuid.UUID]bool
	coursesTodo   map[uuid.UUID]interfaces.CourseData
	maxLoad       float64
}

type semesterBundle struct {
	courseIDs []uuid.UUID
	load      float64
	score     float64
}

func newRoadmapPlanningContext(
	store interfaces.StoreBase,
	passedCourseIDs []uuid.UUID,
	majorID uuid.UUID,
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
		return nil, map[string]interface{}{"error": "No courses found for major requirements"}, nil
	}

	allDeps, err := store.GetCourseDependencies()
	if err != nil {
		return nil, nil, err
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

	return &roadmapPlanningContext{
		store:         store,
		targetCourses: targetCourses,
		prereqs:       prereqs,
		coreqs:        coreqs,
		unlocksCount:  unlocksCount,
		passedIDs:     passedIDs,
		coursesTodo:   coursesTodo,
		maxLoad:       maxLoad,
	}, nil, nil
}

func generateRoadmapWithStrategy(
	store interfaces.StoreBase,
	passedCourseIDs []uuid.UUID,
	majorID uuid.UUID,
	currentSemester int,
	maxLoad float64,
	cohort int,
	selectSemester roadmapSelectionStrategy,
) (interface{}, error) {
	ctx, immediate, err := newRoadmapPlanningContext(store, passedCourseIDs, majorID, maxLoad, cohort)
	if err != nil || immediate != nil {
		return immediate, err
	}

	var roadmap []map[string]interface{}
	for semester := currentSemester; len(ctx.coursesTodo) > 0 && semester <= 12; semester++ {
		selected := selectSemester(ctx, semester)
		if len(selected) == 0 {
			break
		}

		courseIDs := make([]string, 0, len(selected))
		semLoad := 0.0
		for _, cid := range selected {
			course, ok := ctx.coursesTodo[cid]
			if !ok {
				continue
			}
			courseIDs = append(courseIDs, cid.String())
			semLoad += course.Workload
			ctx.passedIDs[cid] = true
			delete(ctx.coursesTodo, cid)
		}

		if len(courseIDs) == 0 {
			break
		}

		roadmap = append(roadmap, map[string]interface{}{
			"semester":   semester,
			"course_ids": courseIDs,
			"total_load": semLoad,
		})
	}

	return roadmap, nil
}

func availableCourseBundles(ctx *roadmapPlanningContext, semester int) []semesterBundle {
	available := make([]interfaces.CourseData, 0, len(ctx.coursesTodo))
	for cid, c := range ctx.coursesTodo {
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
			bundle.score = bundleScore(ctx, bundle.courseIDs)
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
	for _, reqID := range ctx.prereqs[cid] {
		if !ctx.passedIDs[reqID] {
			return false
		}
	}
	return true
}

func coreqsSchedulable(ctx *roadmapPlanningContext, cid uuid.UUID, semester int) bool {
	for _, reqID := range ctx.coreqs[cid] {
		if ctx.passedIDs[reqID] {
			continue
		}
		reqCourse, ok := ctx.coursesTodo[reqID]
		if !ok || !prereqsSatisfied(ctx, reqID) || !offeredInSemester(reqCourse, semester) {
			return false
		}
	}
	return true
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
		for _, reqID := range ctx.coreqs[curr] {
			if ctx.passedIDs[reqID] {
				continue
			}
			if _, ok := ctx.coursesTodo[reqID]; !ok {
				return semesterBundle{}, false
			}
			queue = append(queue, reqID)
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
	for _, s := range c.AvailableSemesters {
		if s == semester {
			return true
		}
	}
	return false
}

func bundleScore(ctx *roadmapPlanningContext, courseIDs []uuid.UUID) float64 {
	score := 0.0
	for _, cid := range courseIDs {
		course := ctx.targetCourses[cid]
		recommendedBonus := 0.0
		if course.RecommendedSemester != nil {
			recommendedBonus = 1.0 / float64(*course.RecommendedSemester+1)
		}
		score += 10 + float64(ctx.unlocksCount[cid])*3 + recommendedBonus - course.Workload*0.1
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
