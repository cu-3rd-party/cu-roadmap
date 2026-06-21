package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Specialization struct {
	ID      uuid.UUID `gorm:"type:uuid;primaryKey"`
	MajorID uuid.UUID `gorm:"type:uuid;not null;index"`
	Title   string    `gorm:"type:varchar(255);not null"`
	Major   *Major    `gorm:"foreignKey:MajorID"`
}

func (s *Specialization) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
