package api

import (
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterMajorsRoutes(rg *gin.RouterGroup) {
	rg.GET("/", getMajors)
	rg.POST("/identify", identifyMajor)
}

func getMajors(c *gin.Context) {
	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}
	majors, err := s.GetAllMajors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var res []gin.H
	for _, m := range majors {
		reqs, err := s.GetMajorRequirements(m.ID)
		if err != nil {
			continue
		}
		var reqList []gin.H
		for _, r := range reqs {
			reqList = append(reqList, gin.H{
				"course_id": r.CourseID.String(),
				"type":      string(r.RequirementType),
			})
		}
		res = append(res, gin.H{
			"id":           m.ID.String(),
			"title":        m.Title,
			"school":       m.School,
			"requirements": reqList,
		})
	}
	c.JSON(http.StatusOK, res)
}

func identifyMajor(c *gin.Context) {
	var passedIDs []string
	if err := c.ShouldBindJSON(&passedIDs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	majors, err := s.GetAllMajors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	passedUUIDs := make(map[uuid.UUID]bool)
	for _, pid := range passedIDs {
		uid, err := uuid.Parse(pid)
		if err == nil {
			passedUUIDs[uid] = true
		}
	}

	var analysis []gin.H
	for _, m := range majors {
		reqs, err := s.GetMajorRequirements(m.ID)
		if err != nil {
			continue
		}
		reqIDs := make(map[uuid.UUID]bool)
		for _, r := range reqs {
			reqIDs[r.CourseID] = true
		}
		if len(reqIDs) == 0 {
			continue
		}
		covered := 0
		for id := range passedUUIDs {
			if reqIDs[id] {
				covered++
			}
		}
		score := float64(covered) / float64(len(reqIDs))
		analysis = append(analysis, gin.H{
			"id":            m.ID.String(),
			"title":         m.Title,
			"score":         score,
			"covered_count": covered,
			"total_count":   len(reqIDs),
		})
	}

	for i := 0; i < len(analysis); i++ {
		for j := i + 1; j < len(analysis); j++ {
			if analysis[j]["score"].(float64) > analysis[i]["score"].(float64) {
				analysis[i], analysis[j] = analysis[j], analysis[i]
			}
		}
	}

	c.JSON(http.StatusOK, analysis)
}
