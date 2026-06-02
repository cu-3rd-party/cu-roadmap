package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

type authTokenErrorStore struct {
	*store.MemoryStore
}

func (s *authTokenErrorStore) CreateAuthToken() (*models.AuthToken, error) {
	return nil, fmt.Errorf("token creation failed")
}

func setupAuthRouter(t *testing.T, password string, seed func(s interfaces.StoreBase)) *gin.Engine {
	t.Helper()

	store.CloseStore()
	_, err := store.InitStore(true, "", password)
	assert.NoError(t, err)

	s := store.GetStore()
	if seed != nil {
		seed(s)
	}

	router := gin.New()
	apiV1 := router.Group("/api/v1")
	RegisterAuthRoutes(apiV1)

	return router
}

func TestLoginStoreNotInitialized(t *testing.T) {
	store.CloseStore()

	router := gin.New()
	apiV1 := router.Group("/api/v1")
	RegisterAuthRoutes(apiV1)

	w := httptest.NewRecorder()
	body := `{"password":"admin"}`
	req, _ := http.NewRequest("POST", "/api/v1/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusServiceUnavailable, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "store not initialized")

	store.CloseStore()
	_, err := store.InitStore(true, "", "")
	assert.NoError(t, err)
}

func TestLoginBadRequest(t *testing.T) {
	router := setupAuthRouter(t, "", nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/login", strings.NewReader(`not json`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestLoginWrongPassword(t *testing.T) {
	router := setupAuthRouter(t, "secret", nil)

	w := httptest.NewRecorder()
	body := `{"password":"wrong"}`
	req, _ := http.NewRequest("POST", "/api/v1/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "invalid password", resp["error"])
}

func TestLoginAuthTokenError(t *testing.T) {
	store.CloseStore()
	ms := store.NewMemoryStore()
	ms.Init("admin")
	store.SetStoreForTest(&authTokenErrorStore{MemoryStore: ms})

	router := gin.New()
	apiV1 := router.Group("/api/v1")
	RegisterAuthRoutes(apiV1)

	w := httptest.NewRecorder()
	body := `{"password":"admin"}`
	req, _ := http.NewRequest("POST", "/api/v1/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "token creation failed")

	store.CloseStore()
	_, err := store.InitStore(true, "", "")
	assert.NoError(t, err)
}

func TestLoginSuccess(t *testing.T) {
	router := setupAuthRouter(t, "admin", nil)

	w := httptest.NewRecorder()
	body := `{"password":"admin"}`
	req, _ := http.NewRequest("POST", "/api/v1/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	cookies := w.Result().Cookies()
	assert.NotZero(t, len(cookies))
	found := false
	for _, c := range cookies {
		if c.Name == "auth-token" {
			found = true
			assert.NotZero(t, c.Value)
			assert.True(t, c.HttpOnly)
			break
		}
	}
	assert.True(t, found)
}
