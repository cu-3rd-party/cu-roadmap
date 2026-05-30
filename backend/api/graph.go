package api

import (
	"log"
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
)

func RegisterGraphRoutes(rg *gin.RouterGroup) {
	rg.GET("/data", getGraphData)
}

func getGraphData(c *gin.Context) {
	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	courses, err := s.GetAllCourses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	deps, err := s.GetCourseDependencies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var nodes []gin.H
	for _, c := range courses {
		var recSem interface{}
		if c.RecommendedSemester != nil {
			recSem = *c.RecommendedSemester
		}
		var desc string
		if c.Description != nil {
			desc = *c.Description
		}
		nodes = append(nodes, gin.H{
			"id":                   c.ID.String(),
			"label":                c.Title,
			"group":                string(c.Category),
			"title":                desc,
			"recommended_semester": recSem,
		})
	}
	log.Printf("Fetched %d courses for graph nodes", len(nodes))

	var edges []gin.H
	for _, d := range deps {
		edges = append(edges, gin.H{
			"from":  d.RequiredCourseID.String(),
			"to":    d.CourseID.String(),
			"label": string(d.DependencyType),
		})
	}

	c.JSON(http.StatusOK, gin.H{"nodes": nodes, "edges": edges})
}
