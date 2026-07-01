package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Major struct {
	ID                uuid.UUID  `gorm:"type:uuid;primaryKey"`
	Title             string     `gorm:"index"`
	School            string     `gorm:"not null"`
	CohortYear        int        `gorm:"index"`
	RequirementsBoxID *uuid.UUID `gorm:"type:uuid;index"`
	RequirementsBox   *Box       `gorm:"foreignKey:RequirementsBoxID"`
}

func (m *Major) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
