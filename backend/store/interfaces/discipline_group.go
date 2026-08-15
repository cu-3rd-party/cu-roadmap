package interfaces

import (
	"encoding/json"

	"github.com/google/uuid"
)

type DisciplineGroupData struct {
	ID             uuid.UUID
	Title          string
	Category       string
	MathExpression json.RawMessage
	RootBoxID      uuid.UUID
}
