package helpers

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
)

func ToDisciplineGroupData(m *models.DisciplineGroup) interfaces.DisciplineGroupData {
	return interfaces.DisciplineGroupData{
		ID:             m.ID,
		Title:          m.Title,
		Category:       m.Category,
		MathExpression: m.MathExpression,
		RootBoxID:      m.RootBoxID,
	}
}

func ToDisciplineGroupModel(d interfaces.DisciplineGroupData) models.DisciplineGroup {
	mathExpr := d.MathExpression
	if len(mathExpr) == 0 {
		mathExpr = []byte("{}")
	}
	return models.DisciplineGroup{
		ID:             d.ID,
		Title:          d.Title,
		Category:       d.Category,
		MathExpression: mathExpr,
		RootBoxID:      d.RootBoxID,
	}
}
