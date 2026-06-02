package helpers

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
)

func ToStudentModel(student interfaces.StudentData) models.Student {
	return models.Student{
		ID:              student.ID,
		Cohort:          student.Cohort,
		CurrentSemester: student.CurrentSemester,
		TargetMajorID:   student.TargetMajorID,
	}
}

func ToStudentData(st *models.Student) interfaces.StudentData {
	sd := interfaces.StudentData{
		ID:              st.ID,
		Cohort:          st.Cohort,
		CurrentSemester: st.CurrentSemester,
		TargetMajorID:   st.TargetMajorID,
	}
	for _, c := range st.PassedCourses {
		sd.PassedCourseIDs = append(sd.PassedCourseIDs, c.ID)
	}
	return sd
}
