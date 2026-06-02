package models

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Course struct {
	ID                  uuid.UUID            `gorm:"type:uuid;primaryKey"`
	Title               string               `gorm:"not null"`
	Description         *string              `gorm:"type:text"`
	HandbookLink        *string              `gorm:"type:text"`
	CourseType          enums.CourseType     `gorm:"type:varchar(20);not null"`
	Category            enums.CourseCategory `gorm:"type:varchar(20);not null"`
	AllowedCohorts      pq.Int64Array        `gorm:"type:integer[]"`
	AvailableSemesters  pq.Int64Array        `gorm:"type:integer[];not null"`
	RecommendedSemester *int
	Workload            float64 `gorm:"not null"`
	CsatMetric          *float64
	CourseDependencies  []CourseDependency `gorm:"foreignKey:CourseID"`
}

func (c *Course) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
