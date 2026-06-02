package api

import (
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/api/middleware"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterMajorsRoutes(rg *gin.RouterGroup) {
	rg.GET("/", getMajors)
	rg.POST("/identify", identifyMajor)

	admin := rg.Group("/")
	admin.Use(middleware.AuthMiddleware())
	admin.PUT("/:id", updateMajor)
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

func updateMajor(c *gin.Context) {
	idParam := c.Param("id")
	majorID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid major id"})
		return
	}

	s := store.GetStore()
	var req struct {
		Title        string `json:"title" binding:"required"`
		School       string `json:"school"`
		Requirements []struct {
			CourseID string `json:"course_id"`
			Type     string `json:"type"`
		} `json:"requirements"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existing, err := s.GetMajorByID(majorID)
	if err != nil || existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "major not found"})
		return
	}

	existing.Title = req.Title
	existing.School = req.School

	updated, err := s.UpdateMajor(*existing)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	err = s.DeleteMajorRequirements(majorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for _, r := range req.Requirements {
		cid, err := uuid.Parse(r.CourseID)
		if err != nil {
			continue
		}
		_, err = s.CreateMajorRequirement(interfaces.MajorRequirementData{
			ID:              uuid.New(),
			MajorID:         majorID,
			CourseID:        cid,
			RequirementType: enums.RequirementType(r.Type),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"id": updated.ID.String()})
}
