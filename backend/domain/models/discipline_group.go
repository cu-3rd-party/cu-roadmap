package models

import (
	"encoding/json"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DisciplineGroup struct {
	ID             uuid.UUID       `gorm:"type:uuid;primaryKey"`
	Title          string          `gorm:"type:varchar(255);not null"`
	Category       string          `gorm:"type:varchar(50)"`
	MathExpression json.RawMessage `gorm:"type:jsonb;not null"`
	RootBoxID      uuid.UUID       `gorm:"type:uuid;index;not null"`
	RootBox        *Box            `gorm:"foreignKey:RootBoxID"`
}

func (d *DisciplineGroup) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}
