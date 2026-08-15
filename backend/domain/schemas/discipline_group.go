package schemas

import (
	"encoding/json"

	"github.com/google/uuid"
)

type DisciplineGroupRequest struct {
	Title          string          `json:"title" binding:"required"`
	Category       string          `json:"category"`
	MathExpression json.RawMessage `json:"math_expression" binding:"required"`
}

type DisciplineGroupResponse struct {
	ID             uuid.UUID       `json:"id"`
	Title          string          `json:"title"`
	Category       string          `json:"category"`
	MathExpression json.RawMessage `json:"math_expression"`
	RootBoxID      uuid.UUID       `json:"root_box_id"`
}
