package models

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Course struct {
	ID                  uuid.UUID               `gorm:"type:uuid;primaryKey"`
	Title               string                  `gorm:"not null"`
	Description         *string                 `gorm:"type:text"`
	HandbookLink        *string                 `gorm:"type:text"`
	CourseType          enums.CourseType        `gorm:"type:varchar(20);not null"`
	Category            enums.CourseCategory    `gorm:"type:varchar(20);not null"`
	AllowedCohorts      pq.Int64Array           `gorm:"type:integer[]"`
	AvailableSemesters  pq.Int64Array           `gorm:"type:integer[];not null"`
	RecommendedSemester *int                    `gorm:"type:integer"`
	Workload            float64                 `gorm:"not null"`
	SeminarsWeek        int                     `gorm:"not null;default:1"`
	LecturesWeek        int                     `gorm:"not null;default:0"`
	AnalogGroup         string                  `gorm:"type:varchar(255);default:''"`
	CsatMetric          *float64                `gorm:"type:float"`
	DisplayMode         enums.CourseDisplayMode `gorm:"type:varchar(20);not null;default:'standard'"`
	CourseDependencies  []CourseDependency      `gorm:"foreignKey:CourseID"`
}

func (c *Course) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
