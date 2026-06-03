package api

import (
	"encoding/json"
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
)

const responseCacheTTLSeconds int64 = 5 * 60

func writeCachedJSON(c *gin.Context, key string, payload any) {
	body, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if cache := store.GetCacheStore(); cache != nil {
		_ = cache.Set(key, body, responseCacheTTLSeconds)
	}

	c.Data(http.StatusOK, "application/json; charset=utf-8", body)
}

func tryWriteCachedJSON(c *gin.Context, key string) bool {
	cache := store.GetCacheStore()
	if cache == nil {
		return false
	}

	body, ok, err := cache.Get(key)
	if err != nil || !ok {
		return false
	}

	c.Data(http.StatusOK, "application/json; charset=utf-8", body)
	return true
}

func coursesCacheKey(c *gin.Context) string {
	return "courses:" + c.Request.URL.RequestURI()
}

func majorsCacheKey(c *gin.Context) string {
	return "majors:" + c.Request.URL.RequestURI()
}

func invalidateCachePrefixes(prefixes ...string) {
	cache := store.GetCacheStore()
	if cache == nil {
		return
	}
	for _, prefix := range prefixes {
		_ = cache.DeleteByPrefix(prefix)
	}
}
