package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BoxEdge struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	ParentBoxID uuid.UUID `gorm:"type:uuid;not null;index"`
	ChildBoxID  uuid.UUID `gorm:"type:uuid;not null;index"`
	Position    int       `gorm:"not null;default:0"`
	ParentBox   *Box      `gorm:"foreignKey:ParentBoxID"`
	ChildBox    *Box      `gorm:"foreignKey:ChildBoxID"`
}

func (e *BoxEdge) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}
