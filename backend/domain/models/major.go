package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Major struct {
	ID           uuid.UUID          `gorm:"type:uuid;primaryKey"`
	Title        string             `gorm:"not null"`
	School       string             `gorm:"not null"`
	CohortYear   int                `gorm:"index"`
	Requirements []MajorRequirement `gorm:"foreignKey:MajorID"`
}

func (m *Major) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
