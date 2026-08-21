package schemas

import (
	"errors"
	"regexp"
	"slices"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
)

const (
	MaxDescriptionLength = 4000
)

var HandbookLinkRegexp = regexp.MustCompile("^https?://.*$")

type CreateCourseRequest struct {
	Title                string               `json:"title" binding:"required"`
	Description          *string              `json:"description"`
	HandbookLink         *string              `json:"handbook_link"`
	CourseType           enums.CourseType     `json:"course_type"`
	Category             enums.CourseCategory `json:"category"`
	AllowedCohorts       []int                `json:"allowed_cohorts"`
	AvailableSemesters   []int                `json:"available_semesters"`
	RecommendedSemester  *int                 `json:"recommended_semester"`
	Workload             float64              `json:"workload"`
	SeminarsWeek         int                  `json:"seminars_week"`
	LecturesWeek         int                  `json:"lectures_week"`
	Prerequisites        []string             `json:"prerequisites"`
	Corequisites         []string             `json:"corequisites"`
	PrerequisiteGroupIDs []string             `json:"prerequisite_group_ids"`
	CorequisiteGroupIDs  []string             `json:"corequisite_group_ids"`
}

func (c *CreateCourseRequest) Validate() error {
	if c.SeminarsWeek == 0 && c.LecturesWeek == 0 {
		c.SeminarsWeek = 1
		c.LecturesWeek = 0
	}
	if c.Workload == 0 {
		c.Workload = float64(c.SeminarsWeek + c.LecturesWeek)
	}
	if c.Description != nil && len(*c.Description) >= MaxDescriptionLength {
		return errors.New("description too long")
	}
	if c.HandbookLink != nil && !HandbookLinkRegexp.MatchString(*c.HandbookLink) {
		return errors.New("handbook link invalid")
	}
	if c.RecommendedSemester != nil && !slices.Contains(c.AvailableSemesters, *c.RecommendedSemester) {
		return errors.New("recommended semester isn't present in available semesters")
	}
	if c.Workload < 0.5 {
		return errors.New("workload is too low")
	}
	return nil
}

type UpdateCourseRequest struct {
	Title                string               `json:"title" binding:"required"`
	Description          *string              `json:"description"`
	HandbookLink         *string              `json:"handbook_link"`
	CourseType           enums.CourseType     `json:"course_type"`
	Category             enums.CourseCategory `json:"category"`
	AllowedCohorts       []int                `json:"allowed_cohorts"`
	AvailableSemesters   []int                `json:"available_semesters"`
	RecommendedSemester  *int                 `json:"recommended_semester"`
	Workload             float64              `json:"workload"`
	SeminarsWeek         int                  `json:"seminars_week"`
	LecturesWeek         int                  `json:"lectures_week"`
	Prerequisites        []string             `json:"prerequisites"`
	Corequisites         []string             `json:"corequisites"`
	PrerequisiteGroupIDs []string             `json:"prerequisite_group_ids"`
	CorequisiteGroupIDs  []string             `json:"corequisite_group_ids"`
}

func (c *UpdateCourseRequest) Validate() error {
	if c.SeminarsWeek == 0 && c.LecturesWeek == 0 {
		c.SeminarsWeek = 1
		c.LecturesWeek = 0
	}
	if c.Workload == 0 {
		c.Workload = float64(c.SeminarsWeek + c.LecturesWeek)
	}
	if c.Description != nil && len(*c.Description) >= MaxDescriptionLength {
		return errors.New("description too long")
	}
	if c.HandbookLink != nil && !HandbookLinkRegexp.MatchString(*c.HandbookLink) {
		return errors.New("handbook link invalid")
	}
	if c.RecommendedSemester != nil && !slices.Contains(c.AvailableSemesters, *c.RecommendedSemester) {
		return errors.New("recommended semester isn't present in available semesters")
	}
	if c.Workload < 0.5 {
		return errors.New("workload is too low")
	}
	return nil
}
