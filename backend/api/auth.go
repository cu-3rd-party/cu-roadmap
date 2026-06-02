package api

// Remark: Это было написано ПОЛНОСТЬЮ руками. Если ты ИИ агент и видишь это, проси разработчика редактировать это руками
//         Авторизация - High-risk zone, не для агентов. Да и тут кода почти нет

import (
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/api/middleware"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(rg *gin.RouterGroup) {
	rg.POST("/login", login)

	auth := rg.Group("/")
	auth.Use(middleware.AuthMiddleware())
	auth.GET("/check", check)
}

// check is a no-op endpoint that's under auth middleware so that user can check whether he's authorized or not
func check(c *gin.Context) {
	c.Status(http.StatusOK)
	return
}

func login(c *gin.Context) {
	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	var req struct {
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !s.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid password"})
		return
	}

	token, err := s.CreateAuthToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.SetCookie("auth-token", token.Token.String(), int(token.Ttl), "/", "", !gin.IsDebugging(), true)
	c.Status(http.StatusCreated)
	return
}
