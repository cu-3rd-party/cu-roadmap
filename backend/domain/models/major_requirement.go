package models

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type MajorRequirement struct {
	ID              uuid.UUID             `gorm:"type:uuid;primaryKey"`
	MajorID         uuid.UUID             `gorm:"type:uuid;not null;index"`
	CourseID        uuid.UUID             `gorm:"type:uuid;not null;index"`
	RequirementType enums.RequirementType `gorm:"type:varchar(20);not null"`
	Specializations pq.StringArray        `gorm:"type:text[]"`
	Major           *Major                `gorm:"foreignKey:MajorID"`
	Course          *Course               `gorm:"foreignKey:CourseID"`
}

func (r *MajorRequirement) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
