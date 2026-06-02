package api

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/api/middleware"
	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(rg *gin.RouterGroup) {
	admin := rg.Group("/")
	admin.Use(middleware.AuthMiddleware())
	admin.POST("")
}
