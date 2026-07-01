package requirements

import (
	"fmt"
	"sort"
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type Store interface {
	GetAllBoxes() (map[uuid.UUID]interfaces.BoxData, error)
	GetBoxEdges() ([]interfaces.BoxEdgeData, error)
	GetAllMajors() (map[uuid.UUID]interfaces.MajorData, error)
	GetMajorByID(majorID uuid.UUID) (*interfaces.MajorData, error)
	GetSpecializationsByMajor(majorID uuid.UUID) ([]interfaces.SpecializationData, error)
	GetAllCourses() (map[uuid.UUID]interfaces.CourseData, error)
}

type Graph struct {
	Boxes    map[uuid.UUID]interfaces.BoxData
	Children map[uuid.UUID][]interfaces.BoxEdgeData
	Parents  map[uuid.UUID][]interfaces.BoxEdgeData
	Courses  map[uuid.UUID]interfaces.CourseData
}

type LeafSelection struct {
	BoxID    uuid.UUID
	CourseID uuid.UUID
	Depth    int
}

type Resolver struct {
	store Store
}

func NewResolver(store Store) *Resolver {
	return &Resolver{store: store}
}

func (r *Resolver) LoadGraph() (*Graph, error) {
	boxes, err := r.store.GetAllBoxes()
	if err != nil {
		return nil, err
	}
	edges, err := r.store.GetBoxEdges()
	if err != nil {
		return nil, err
	}
	courses, err := r.store.GetAllCourses()
	if err != nil {
		return nil, err
	}
	g := &Graph{
		Boxes:    boxes,
		Children: make(map[uuid.UUID][]interfaces.BoxEdgeData),
		Parents:  make(map[uuid.UUID][]interfaces.BoxEdgeData),
		Courses:  courses,
	}
	for _, edge := range edges {
		g.Children[edge.ParentBoxID] = append(g.Children[edge.ParentBoxID], edge)
		g.Parents[edge.ChildBoxID] = append(g.Parents[edge.ChildBoxID], edge)
	}
	for parentID := range g.Children {
		sort.Slice(g.Children[parentID], func(i, j int) bool {
			if g.Children[parentID][i].Position == g.Children[parentID][j].Position {
				return g.Children[parentID][i].ChildBoxID.String() < g.Children[parentID][j].ChildBoxID.String()
			}
			return g.Children[parentID][i].Position < g.Children[parentID][j].Position
		})
	}
	return g, nil
}

func (g *Graph) DescendantLeaves(rootID uuid.UUID) ([]interfaces.BoxData, error) {
	visitedPath := make(map[uuid.UUID]bool)
	var out []interfaces.BoxData
	var walk func(uuid.UUID) error
	walk = func(boxID uuid.UUID) error {
		if visitedPath[boxID] {
			return fmt.Errorf("requirement graph cycle detected at %s", boxID)
		}
		box, ok := g.Boxes[boxID]
		if !ok {
			return fmt.Errorf("box %s not found", boxID)
		}
		visitedPath[boxID] = true
		defer delete(visitedPath, boxID)

		if box.Kind == enums.BoxKindCourse {
			out = append(out, box)
			return nil
		}
		for _, edge := range g.Children[boxID] {
			if err := walk(edge.ChildBoxID); err != nil {
				return err
			}
		}
		return nil
	}
	if err := walk(rootID); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *Resolver) ProjectMajorRequirements(majorID uuid.UUID) ([]interfaces.MajorRequirementData, error) {
	g, err := r.LoadGraph()
	if err != nil {
		return nil, err
	}
	major, err := r.store.GetMajorByID(majorID)
	if err != nil || major == nil || major.RequirementsBoxID == nil {
		return nil, err
	}
	leaves, err := g.DescendantLeaves(*major.RequirementsBoxID)
	if err != nil {
		return nil, err
	}
	specs, err := r.store.GetSpecializationsByMajor(majorID)
	if err != nil {
		return nil, err
	}
	for _, spec := range specs {
		if spec.RequirementsBoxID == nil {
			continue
		}
		specLeaves, err := g.DescendantLeaves(*spec.RequirementsBoxID)
		if err != nil {
			return nil, err
		}
		leaves = append(leaves, specLeaves...)
	}

	byBoxID := make(map[uuid.UUID]interfaces.MajorRequirementData)
	for _, leaf := range leaves {
		if leaf.Kind != enums.BoxKindCourse || leaf.CourseID == nil {
			continue
		}
		reqType := enums.RequirementTypeMajorCore
		if leaf.RequirementType != nil {
			reqType = *leaf.RequirementType
		}
		current, ok := byBoxID[leaf.ID]
		if !ok {
			current = interfaces.MajorRequirementData{
				ID:              leaf.ID,
				MajorID:         majorID,
				CourseID:        *leaf.CourseID,
				RequirementType: reqType,
				Specializations: append([]string(nil), leaf.Specializations...),
			}
		} else {
			current.Specializations = mergeStrings(current.Specializations, leaf.Specializations)
		}
		byBoxID[leaf.ID] = current
	}

	out := make([]interfaces.MajorRequirementData, 0, len(byBoxID))
	for _, req := range byBoxID {
		out = append(out, req)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].CourseID == out[j].CourseID {
			return out[i].ID.String() < out[j].ID.String()
		}
		return out[i].CourseID.String() < out[j].CourseID.String()
	})
	return out, nil
}

func (r *Resolver) ProjectAllMajorRequirements() ([]interfaces.MajorRequirementData, error) {
	majors, err := r.store.GetAllMajors()
	if err != nil {
		return nil, err
	}
	var out []interfaces.MajorRequirementData
	for majorID := range majors {
		reqs, err := r.ProjectMajorRequirements(majorID)
		if err != nil {
			return nil, err
		}
		out = append(out, reqs...)
	}
	return out, nil
}

func (r *Resolver) ResolveTargetCourseIDs(
	majorID uuid.UUID,
	specializationID *uuid.UUID,
	passedCourseIDs map[uuid.UUID]bool,
	plannedCourseIDs map[uuid.UUID]bool,
	cohort int,
) ([]uuid.UUID, error) {
	g, err := r.LoadGraph()
	if err != nil {
		return nil, err
	}
	major, err := r.store.GetMajorByID(majorID)
	if err != nil || major == nil || major.RequirementsBoxID == nil {
		return nil, err
	}
	selected := make(map[uuid.UUID]LeafSelection)
	if err := g.resolveBox(*major.RequirementsBoxID, passedCourseIDs, plannedCourseIDs, cohort, 0, selected); err != nil {
		return nil, err
	}
	if specializationID != nil {
		specs, err := r.store.GetSpecializationsByMajor(majorID)
		if err != nil {
			return nil, err
		}
		for _, spec := range specs {
			if spec.ID == *specializationID && spec.RequirementsBoxID != nil {
				if err := g.resolveBox(*spec.RequirementsBoxID, passedCourseIDs, plannedCourseIDs, cohort, 0, selected); err != nil {
					return nil, err
				}
				break
			}
		}
	}
	ids := make([]uuid.UUID, 0, len(selected))
	for _, leaf := range selected {
		ids = append(ids, leaf.CourseID)
	}
	sort.Slice(ids, func(i, j int) bool { return ids[i].String() < ids[j].String() })
	return ids, nil
}

func (g *Graph) resolveBox(
	boxID uuid.UUID,
	passedCourseIDs map[uuid.UUID]bool,
	plannedCourseIDs map[uuid.UUID]bool,
	cohort int,
	depth int,
	selected map[uuid.UUID]LeafSelection,
) error {
	box, ok := g.Boxes[boxID]
	if !ok {
		return fmt.Errorf("box %s not found", boxID)
	}
	switch box.Kind {
	case enums.BoxKindCourse:
		if box.CourseID == nil {
			return nil
		}
		course, ok := g.Courses[*box.CourseID]
		if !ok {
			return nil
		}
		if cohort != 0 && len(course.AllowedCohorts) > 0 && !containsInt(course.AllowedCohorts, cohort) {
			return nil
		}
		if isCourseSatisfied(course, g.Courses, passedCourseIDs, plannedCourseIDs) {
			return nil
		}
		selected[box.ID] = LeafSelection{BoxID: box.ID, CourseID: *box.CourseID, Depth: depth}
		return nil
	case enums.BoxKindLogical:
		children := g.Children[boxID]
		if len(children) == 0 {
			return nil
		}
		op := enums.LogicalOpAnd
		if box.LogicalOp != nil {
			op = *box.LogicalOp
		}
		switch op {
		case enums.LogicalOpAnd:
			for _, edge := range children {
				if err := g.resolveBox(edge.ChildBoxID, passedCourseIDs, plannedCourseIDs, cohort, depth+1, selected); err != nil {
					return err
				}
			}
		case enums.LogicalOpOr, enums.LogicalOpXor:
			best, err := g.pickBestBranch(children, passedCourseIDs, plannedCourseIDs, cohort)
			if err != nil {
				return err
			}
			if best != nil {
				return g.resolveBox(best.ChildBoxID, passedCourseIDs, plannedCourseIDs, cohort, depth+1, selected)
			}
		}
		return nil
	case enums.BoxKindOptional:
		children := g.Children[boxID]
		if len(children) == 0 {
			return nil
		}
		return g.resolveOptional(children[0].ChildBoxID, box.RequiredCount, passedCourseIDs, plannedCourseIDs, cohort, depth+1, selected)
	default:
		return nil
	}
}

func (g *Graph) resolveOptional(
	childBoxID uuid.UUID,
	requiredCount int,
	passedCourseIDs map[uuid.UUID]bool,
	plannedCourseIDs map[uuid.UUID]bool,
	cohort int,
	depth int,
	selected map[uuid.UUID]LeafSelection,
) error {
	options, err := g.collectAtomicLeaves(childBoxID, passedCourseIDs, plannedCourseIDs, cohort)
	if err != nil {
		return err
	}
	if len(options) == 0 {
		return nil
	}
	satisfied := 0
	unsatisfied := make([]LeafSelection, 0, len(options))
	for _, option := range options {
		course := g.Courses[option.CourseID]
		if isCourseSatisfied(course, g.Courses, passedCourseIDs, plannedCourseIDs) {
			satisfied++
			continue
		}
		unsatisfied = append(unsatisfied, option)
	}
	need := requiredCount - satisfied
	if need <= 0 {
		return nil
	}
	sort.Slice(unsatisfied, func(i, j int) bool {
		left := g.Courses[unsatisfied[i].CourseID]
		right := g.Courses[unsatisfied[j].CourseID]
		if left.Workload == right.Workload {
			return unsatisfied[i].CourseID.String() < unsatisfied[j].CourseID.String()
		}
		return left.Workload < right.Workload
	})
	if need > len(unsatisfied) {
		need = len(unsatisfied)
	}
	for _, option := range unsatisfied[:need] {
		selected[option.BoxID] = LeafSelection{BoxID: option.BoxID, CourseID: option.CourseID, Depth: depth}
	}
	return nil
}

func (g *Graph) collectAtomicLeaves(
	rootID uuid.UUID,
	passedCourseIDs map[uuid.UUID]bool,
	plannedCourseIDs map[uuid.UUID]bool,
	cohort int,
) ([]LeafSelection, error) {
	var out []LeafSelection
	seen := make(map[uuid.UUID]bool)
	var walk func(uuid.UUID, int) error
	walk = func(boxID uuid.UUID, depth int) error {
		box, ok := g.Boxes[boxID]
		if !ok {
			return fmt.Errorf("box %s not found", boxID)
		}
		switch box.Kind {
		case enums.BoxKindCourse:
			if box.CourseID == nil || seen[box.ID] {
				return nil
			}
			course, ok := g.Courses[*box.CourseID]
			if !ok {
				return nil
			}
			if cohort != 0 && len(course.AllowedCohorts) > 0 && !containsInt(course.AllowedCohorts, cohort) {
				return nil
			}
			seen[box.ID] = true
			out = append(out, LeafSelection{BoxID: box.ID, CourseID: *box.CourseID, Depth: depth})
		case enums.BoxKindLogical, enums.BoxKindOptional:
			for _, edge := range g.Children[boxID] {
				if err := walk(edge.ChildBoxID, depth+1); err != nil {
					return err
				}
			}
		}
		return nil
	}
	if err := walk(rootID, 0); err != nil {
		return nil, err
	}
	return out, nil
}

func (g *Graph) pickBestBranch(
	children []interfaces.BoxEdgeData,
	passedCourseIDs map[uuid.UUID]bool,
	plannedCourseIDs map[uuid.UUID]bool,
	cohort int,
) (*interfaces.BoxEdgeData, error) {
	var best *interfaces.BoxEdgeData
	bestScore := int(^uint(0) >> 1)
	for i := range children {
		options, err := g.collectAtomicLeaves(children[i].ChildBoxID, passedCourseIDs, plannedCourseIDs, cohort)
		if err != nil {
			return nil, err
		}
		score := 0
		for _, option := range options {
			course := g.Courses[option.CourseID]
			if isCourseSatisfied(course, g.Courses, passedCourseIDs, plannedCourseIDs) {
				continue
			}
			score += 1
			score += int(course.Workload * 10)
		}
		if score < bestScore {
			bestScore = score
			best = &children[i]
		}
	}
	return best, nil
}

func isCourseSatisfied(
	target interfaces.CourseData,
	allCourses map[uuid.UUID]interfaces.CourseData,
	passedCourseIDs map[uuid.UUID]bool,
	plannedCourseIDs map[uuid.UUID]bool,
) bool {
	if passedCourseIDs[target.ID] || plannedCourseIDs[target.ID] {
		return true
	}
	group := strings.TrimSpace(target.AnalogGroup)
	if group == "" {
		return false
	}
	for courseID := range passedCourseIDs {
		if course, ok := allCourses[courseID]; ok && strings.EqualFold(strings.TrimSpace(course.AnalogGroup), group) {
			return true
		}
	}
	for courseID := range plannedCourseIDs {
		if course, ok := allCourses[courseID]; ok && strings.EqualFold(strings.TrimSpace(course.AnalogGroup), group) {
			return true
		}
	}
	return false
}

func mergeStrings(left, right []string) []string {
	seen := make(map[string]struct{}, len(left)+len(right))
	out := make([]string, 0, len(left)+len(right))
	for _, item := range append(append([]string(nil), left...), right...) {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		key := strings.ToLower(item)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, item)
	}
	sort.Strings(out)
	return out
}

func containsInt(items []int, target int) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}
