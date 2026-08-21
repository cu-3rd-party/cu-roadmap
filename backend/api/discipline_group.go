package api

import (
	"encoding/json"
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/service"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterDisciplineGroupRoutes(rg *gin.RouterGroup) {
	rg.GET("", getDisciplineGroups)
	rg.GET("/:id", getDisciplineGroupByID)
	rg.POST("", createDisciplineGroup)
	rg.PUT("/:id", updateDisciplineGroup)
	rg.DELETE("/:id", deleteDisciplineGroup)
	rg.POST("/:id/attach", attachDisciplineGroup)
	rg.POST("/:id/detach", detachDisciplineGroup)
	rg.GET("/specialization/:id", getAttachedGroupsForSpecialization)
}

func getDisciplineGroups(c *gin.Context) {
	s := store.GetStore()
	groups, err := s.GetAllDisciplineGroups()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make([]schemas.DisciplineGroupResponse, len(groups))
	for i, g := range groups {
		resp[i] = schemas.DisciplineGroupResponse{
			ID:             g.ID,
			Title:          g.Title,
			Category:       g.Category,
			MathExpression: g.MathExpression,
			RootBoxID:      g.RootBoxID,
		}
	}
	c.JSON(http.StatusOK, resp)
}

func getDisciplineGroupByID(c *gin.Context) {
	s := store.GetStore()
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	g, err := s.GetDisciplineGroupByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if g == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.JSON(http.StatusOK, schemas.DisciplineGroupResponse{
		ID:             g.ID,
		Title:          g.Title,
		Category:       g.Category,
		MathExpression: g.MathExpression,
		RootBoxID:      g.RootBoxID,
	})
}

func createDisciplineGroup(c *gin.Context) {
	var req schemas.DisciplineGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(req.MathExpression) == 0 {
		req.MathExpression = json.RawMessage(`{}`)
	}

	s := store.GetStore()

	// Create root box for this group
	op := enums.LogicalOpAnd
	rootBoxData := interfaces.BoxData{
		ID:        uuid.New(),
		Kind:      enums.BoxKindLogical,
		Title:     req.Title,
		LogicalOp: &op,
	}
	if _, err := s.CreateBox(rootBoxData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create discipline group
	groupData := interfaces.DisciplineGroupData{
		ID:             uuid.New(),
		Title:          req.Title,
		Category:       req.Category,
		MathExpression: req.MathExpression,
		RootBoxID:      rootBoxData.ID,
	}

	created, err := s.CreateDisciplineGroup(groupData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Unpack math expression to boxes
	if err := service.RebuildDisciplineGroupBoxes(rootBoxData.ID, req.MathExpression, req.Title); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, schemas.DisciplineGroupResponse{
		ID:             created.ID,
		Title:          created.Title,
		Category:       created.Category,
		MathExpression: created.MathExpression,
		RootBoxID:      created.RootBoxID,
	})
}

func updateDisciplineGroup(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req schemas.DisciplineGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(req.MathExpression) == 0 {
		req.MathExpression = json.RawMessage(`{}`)
	}

	s := store.GetStore()
	existing, err := s.GetDisciplineGroupByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	existing.Title = req.Title
	existing.Category = req.Category
	existing.MathExpression = req.MathExpression

	updated, err := s.UpdateDisciplineGroup(*existing)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := service.RebuildDisciplineGroupBoxes(updated.RootBoxID, req.MathExpression, req.Title); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, schemas.DisciplineGroupResponse{
		ID:             updated.ID,
		Title:          updated.Title,
		Category:       updated.Category,
		MathExpression: updated.MathExpression,
		RootBoxID:      updated.RootBoxID,
	})
}

func deleteDisciplineGroup(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	s := store.GetStore()
	existing, err := s.GetDisciplineGroupByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if existing == nil {
		c.JSON(http.StatusNoContent, nil)
		return
	}

	if err := service.RebuildDisciplineGroupBoxes(existing.RootBoxID, json.RawMessage(`{}`), ""); err != nil {
		// Ignore error on delete
	}
	_ = s.DeleteBox(existing.RootBoxID)

	if err := s.DeleteDisciplineGroup(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func attachDisciplineGroup(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid discipline group id"})
		return
	}

	var req struct {
		SpecializationID *uuid.UUID           `json:"specialization_id"`
		CourseID         *uuid.UUID           `json:"course_id"`
		DependencyType   enums.DependencyType `json:"dependency_type"`
		AlternativeGroup int                  `json:"alternative_group"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.SpecializationID == nil && req.CourseID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "must specify specialization_id or course_id"})
		return
	}

	s := store.GetStore()

	dg, err := s.GetDisciplineGroupByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if dg == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "discipline group not found"})
		return
	}

	if req.CourseID != nil {
		depType := req.DependencyType
		if depType == "" {
			depType = enums.DependencyTypePrerequisite
		}
		gid := id
		depData := interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         *req.CourseID,
			RequiredGroupID:  &gid,
			DependencyType:   depType,
			AlternativeGroup: req.AlternativeGroup,
		}
		_, err = s.CreateCourseDependency(depData)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "attached"})
		return
	}

	majors, _ := s.GetAllMajors()
	var specBoxID *uuid.UUID
	for mID := range majors {
		mspecs, _ := s.GetSpecializationsByMajor(mID)
		for _, sp := range mspecs {
			if sp.ID == *req.SpecializationID {
				specBoxID = sp.RequirementsBoxID
				break
			}
		}
	}

	if specBoxID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "specialization not found"})
		return
	}

	edgeID := uuid.NewSHA1(uuid.NameSpaceOID, []byte((*specBoxID).String()+"|"+dg.RootBoxID.String()))
	_, err = s.CreateBoxEdge(interfaces.BoxEdgeData{
		ID:          edgeID,
		ParentBoxID: *specBoxID,
		ChildBoxID:  dg.RootBoxID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "attached"})
}

func detachDisciplineGroup(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid discipline group id"})
		return
	}

	var req struct {
		SpecializationID *uuid.UUID `json:"specialization_id"`
		CourseID         *uuid.UUID `json:"course_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.SpecializationID == nil && req.CourseID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "must specify specialization_id or course_id"})
		return
	}

	s := store.GetStore()
	dg, err := s.GetDisciplineGroupByID(id)
	if err != nil || dg == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "discipline group not found"})
		return
	}

	if req.CourseID != nil {
		allDeps, err := s.GetCourseDependencies()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		for _, dep := range allDeps {
			if dep.CourseID == *req.CourseID && dep.RequiredGroupID != nil && *dep.RequiredGroupID == id {
				_ = s.DeleteCourseDependency(dep.ID)
			}
		}
		c.JSON(http.StatusOK, gin.H{"status": "detached"})
		return
	}

	majors, _ := s.GetAllMajors()
	var specBoxID *uuid.UUID
	for mID := range majors {
		mspecs, _ := s.GetSpecializationsByMajor(mID)
		for _, sp := range mspecs {
			if sp.ID == *req.SpecializationID {
				specBoxID = sp.RequirementsBoxID
				break
			}
		}
	}
	if specBoxID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "specialization not found"})
		return
	}

	edgeID := uuid.NewSHA1(uuid.NameSpaceOID, []byte((*specBoxID).String()+"|"+dg.RootBoxID.String()))
	if err := s.DeleteBoxEdge(edgeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "detached"})
}

func getAttachedGroupsForSpecialization(c *gin.Context) {
	specID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid specialization id"})
		return
	}

	s := store.GetStore()
	majors, _ := s.GetAllMajors()
	var specBoxID *uuid.UUID
	for mID := range majors {
		mspecs, _ := s.GetSpecializationsByMajor(mID)
		for _, sp := range mspecs {
			if sp.ID == specID {
				specBoxID = sp.RequirementsBoxID
				break
			}
		}
	}
	if specBoxID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "specialization not found"})
		return
	}

	edges, _ := s.GetBoxEdges()
	groups, _ := s.GetAllDisciplineGroups()

	attachedGroupIDs := make([]string, 0)
	for _, edge := range edges {
		if edge.ParentBoxID == *specBoxID {
			for _, g := range groups {
				if g.RootBoxID == edge.ChildBoxID {
					attachedGroupIDs = append(attachedGroupIDs, g.ID.String())
					break
				}
			}
		}
	}

	c.JSON(http.StatusOK, attachedGroupIDs)
}
