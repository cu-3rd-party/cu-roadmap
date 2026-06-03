package middleware

import (
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
)

const (
	rateLimitCapacity        = 20
	rateLimitRefillPerSecond = 10.0
)

func RateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		cache := store.GetCacheStore()
		if cache == nil {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
			return
		}

		allowed, retryAfter, err := cache.AllowRateLimit(rateLimitKey(c.ClientIP()), rateLimitCapacity, rateLimitRefillPerSecond)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !allowed {
			c.Header("Retry-After", retryAfterHeaderValue(retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			return
		}

		c.Next()
	}
}

func rateLimitKey(ip string) string {
	replacer := strings.NewReplacer(":", "_", ".", "_")
	return "rate-limit:" + replacer.Replace(ip)
}

func retryAfterHeaderValue(retryAfter float64) string {
	seconds := int(math.Ceil(retryAfter))
	if seconds < 1 {
		seconds = 1
	}
	return strconv.Itoa(seconds)
}
