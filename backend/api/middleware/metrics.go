package middleware

import (
	"time"

	"github.com/cu-3rd-party/cu-roadmap/backend/metrics"
	"github.com/gin-gonic/gin"
)

func MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}

		metrics.ObserveHTTPRequest(c.Request.Method, path, c.Writer.Status(), time.Since(start))
	}
}
