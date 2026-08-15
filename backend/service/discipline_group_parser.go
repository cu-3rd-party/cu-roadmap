package service

import (
	"encoding/json"
	"fmt"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type MathExpressionNode struct {
	Type      enums.BoxKind        `json:"type"`
	LogicalOp *enums.LogicalOp     `json:"logical_op"`
	MinCount  int                  `json:"min_count"`
	MaxCount  *int                 `json:"max_count"`
	CourseID  *uuid.UUID           `json:"course_id"`
	Title     string               `json:"title"`
	Children  []MathExpressionNode `json:"children"`
}

func RebuildDisciplineGroupBoxes(rootBoxID uuid.UUID, mathExpr json.RawMessage, title string) error {
	var rootNode MathExpressionNode
	if len(mathExpr) > 0 {
		if err := json.Unmarshal(mathExpr, &rootNode); err != nil {
			return fmt.Errorf("invalid math_expression: %w", err)
		}
	}

	s := store.GetStore()

	// 1. Delete old children tree
	if err := deleteDescendants(s, rootBoxID); err != nil {
		return err
	}
	if err := s.DeleteBoxEdgesByParent(rootBoxID); err != nil {
		return err
	}

	// 2. Update root box
	op := enums.LogicalOpAnd
	if rootNode.LogicalOp != nil {
		op = *rootNode.LogicalOp
	}
	rootBoxData := interfaces.BoxData{
		ID:        rootBoxID,
		Kind:      enums.BoxKindLogical,
		Title:     title,
		LogicalOp: &op,
		MinCount:  rootNode.MinCount,
		MaxCount:  rootNode.MaxCount,
	}
	if _, err := s.UpdateBox(rootBoxData); err != nil {
		return err
	}

	// 3. Recreate tree
	for _, childNode := range rootNode.Children {
		if err := createNodeRecursively(s, rootBoxID, childNode); err != nil {
			return err
		}
	}

	return nil
}

func deleteDescendants(s interfaces.StoreBase, parentBoxID uuid.UUID) error {
	edges, err := s.GetBoxEdges()
	if err != nil {
		return err
	}

	childrenMap := make(map[uuid.UUID][]uuid.UUID)
	for _, e := range edges {
		childrenMap[e.ParentBoxID] = append(childrenMap[e.ParentBoxID], e.ChildBoxID)
	}

	var walkAndDelete func(boxID uuid.UUID) error
	walkAndDelete = func(boxID uuid.UUID) error {
		for _, childID := range childrenMap[boxID] {
			if err := walkAndDelete(childID); err != nil {
				return err
			}
			s.DeleteBox(childID)
		}
		return nil
	}

	return walkAndDelete(parentBoxID)
}

func createNodeRecursively(s interfaces.StoreBase, parentBoxID uuid.UUID, node MathExpressionNode) error {
	boxID := uuid.New()

	kind := node.Type
	if kind == "" {
		kind = enums.BoxKindLogical
	}

	boxData := interfaces.BoxData{
		ID:        boxID,
		Kind:      kind,
		Title:     node.Title,
		CourseID:  node.CourseID,
		LogicalOp: node.LogicalOp,
		MinCount:  node.MinCount,
		MaxCount:  node.MaxCount,
	}

	if _, err := s.CreateBox(boxData); err != nil {
		return err
	}

	edgeID := uuid.NewSHA1(uuid.NameSpaceOID, []byte(parentBoxID.String()+"|"+boxID.String()))
	_, err := s.CreateBoxEdge(interfaces.BoxEdgeData{
		ID:          edgeID,
		ParentBoxID: parentBoxID,
		ChildBoxID:  boxID,
	})
	if err != nil {
		return err
	}

	for _, childNode := range node.Children {
		if err := createNodeRecursively(s, boxID, childNode); err != nil {
			return err
		}
	}

	return nil
}
