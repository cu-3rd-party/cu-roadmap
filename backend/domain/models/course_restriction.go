package models

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CourseRestriction represents a constraint on how many courses from a specific category
// can be taken in a given semester for a specialization.
type CourseRestriction struct {
	ID                  uuid.UUID            `gorm:"type:uuid;primaryKey"`
	SpecializationID    uuid.UUID            `gorm:"type:uuid;not null;index"`
	Semester            int                  `gorm:"not null;index"`
	Category            enums.CourseCategory `gorm:"type:varchar(20);not null"`
	MinCourses          int                  `gorm:"not null;default:0"`
	MaxCourses          int                  `gorm:"not null;default:999"`
	InternalDescription string               `gorm:"type:text"`

	// Navigation
	Specialization *Specialization `gorm:"foreignKey:SpecializationID"`
}

func (cr *CourseRestriction) BeforeCreate(tx *gorm.DB) error {
	if cr.ID == uuid.Nil {
		cr.ID = uuid.New()
	}
	return nil
}
