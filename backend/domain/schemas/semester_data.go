package schemas

import "github.com/google/uuid"

type SemesterData struct {
	Semester  int         `json:"semester" binding:"required"`
	CourseIDs []uuid.UUID `json:"course_ids" binding:"required"`
}
