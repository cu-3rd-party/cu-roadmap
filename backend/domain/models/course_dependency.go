package models

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CourseDependency struct {
	ID               uuid.UUID            `gorm:"type:uuid;primaryKey"`
	CourseID         uuid.UUID            `gorm:"type:uuid;not null;index"`
	RequiredCourseID uuid.UUID            `gorm:"type:uuid;not null;index"`
	DependencyType   enums.DependencyType `gorm:"type:varchar(20);not null"`
	AlternativeGroup int                  `gorm:"not null;default:0"`
	Course           *Course              `gorm:"foreignKey:CourseID"`
	RequiredCourse   *Course              `gorm:"foreignKey:RequiredCourseID"`
}

func (d *CourseDependency) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}
