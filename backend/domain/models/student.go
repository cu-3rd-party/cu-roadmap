package models

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Student struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey"`
	Cohort          int        `gorm:"not null"`
	CurrentSemester int        `gorm:"not null"`
	TargetMajorID   *uuid.UUID `gorm:"type:uuid"`
	TargetMajor     *Major     `gorm:"foreignKey:TargetMajorID"`
	PassedCourses   []*Course  `gorm:"many2many:student_passed_courses;"`
}

func (s *Student) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
