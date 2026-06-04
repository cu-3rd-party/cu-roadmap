package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/helpers"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RestoreCourse struct {
	ID                  string               `json:"id"`
	Title               string               `json:"title"`
	Description         *string              `json:"description"`
	HandbookLink        *string              `json:"handbook_link"`
	CourseType          enums.CourseType     `json:"course_type"`
	Category            enums.CourseCategory `json:"category"`
	AllowedCohorts      []int                `json:"allowed_cohorts"`
	AvailableSemesters  []int                `json:"available_semesters"`
	RecommendedSemester *int                 `json:"recommended_semester"`
	Workload            float64              `json:"workload"`
	Prerequisites       []string             `json:"prerequisites"`
	Corequisites        []string             `json:"corequisites"`
}

func RestoreDB(c *gin.Context) {
	s := store.GetStore()
	s.ClearAll()

	coursesFile, err := os.ReadFile("courses_backup.json")
	if err == nil {
		var courses []RestoreCourse
		err2 := json.Unmarshal(coursesFile, &courses)
		if err2 != nil {
			fmt.Println("Error parsing courses_backup.json:", err2)
		} else {
			fmt.Println("Successfully parsed", len(courses), "courses!")
			for _, rc := range courses {
				id, _ := uuid.Parse(rc.ID)
				cd := interfaces.CourseData{
					ID:                  id,
					Title:               rc.Title,
					Description:         rc.Description,
					HandbookLink:        rc.HandbookLink,
					CourseType:          rc.CourseType,
					Category:            rc.Category,
					AllowedCohorts:      rc.AllowedCohorts,
					AvailableSemesters:  rc.AvailableSemesters,
					RecommendedSemester: rc.RecommendedSemester,
					Workload:            rc.Workload,
				}
				s.CreateCourse(cd)
				helpers.ReplaceCourseDependencies(s, cd.ID, rc.Prerequisites, rc.Corequisites)
			}
		}
	} else {
		fmt.Println("Error reading courses_backup.json:", err)
	}

	majorsFile, err := os.ReadFile("majors_backup.json")
	if err == nil {
		var majors []map[string]interface{}
		json.Unmarshal(majorsFile, &majors)
		for _, m := range majors {
			mid, _ := uuid.Parse(m["id"].(string))
			s.CreateMajor(interfaces.MajorData{
				ID:         mid,
				Title:      m["title"].(string),
				School:     m["school"].(string),
				CohortYear: int(m["cohort_year"].(float64)),
			})
			if reqs, ok := m["requirements"].([]interface{}); ok {
				for _, r := range reqs {
					rm := r.(map[string]interface{})
					cid, _ := uuid.Parse(rm["course_id"].(string))
					s.CreateMajorRequirement(interfaces.MajorRequirementData{
						ID:              uuid.New(),
						MajorID:         mid,
						CourseID:        cid,
						RequirementType: enums.RequirementType(rm["type"].(string)),
					})
				}
			}
		}
	}

	invalidateCachePrefixes("courses:", "majors:")
	c.JSON(http.StatusOK, gin.H{"status": "restored"})
}
