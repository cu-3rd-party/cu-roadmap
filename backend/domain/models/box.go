package models

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Box struct {
	ID                   uuid.UUID              `gorm:"type:uuid;primaryKey"`
	Kind                 enums.BoxKind          `gorm:"type:varchar(20);not null;index"`
	Title                string                 `gorm:"type:varchar(255)"`
	CourseID             *uuid.UUID             `gorm:"type:uuid;index"`
	LogicalOp            *enums.LogicalOp       `gorm:"type:varchar(10)"`
	RequiredCount        int                    `gorm:"not null;default:0"`
	RequirementType      *enums.RequirementType `gorm:"type:varchar(20)"`
	Specializations      pq.StringArray         `gorm:"type:text[]"`
	AdmissionYear        *int                   `gorm:"index"`
	MajorTrack           *string                `gorm:"type:varchar(64)"`
	Course               *Course                `gorm:"foreignKey:CourseID"`
	OutgoingRequirements []BoxEdge              `gorm:"foreignKey:ParentBoxID"`
}

func (b *Box) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}
