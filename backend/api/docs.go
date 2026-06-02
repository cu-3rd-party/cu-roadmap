package api

import (
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"github.com/gin-gonic/gin"
)

const swaggerUIHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CU Roadmap API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/v1/docs/openapi.yaml',
        dom_id: '#swagger-ui'
      })
    </script>
  </body>
</html>
`

func RegisterDocsRoutes(rg *gin.RouterGroup) {
	rg.GET("/docs", getSwaggerUI)
	rg.GET("/docs/openapi.yaml", getOpenAPISpec)
}

func getSwaggerUI(c *gin.Context) {
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(swaggerUIHTML))
}

func getOpenAPISpec(c *gin.Context) {
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not resolve docs path"})
		return
	}
	path := filepath.Join(filepath.Dir(file), "..", "docs", "api", "v1.yaml")

	data, err := os.ReadFile(path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Data(http.StatusOK, "application/yaml; charset=utf-8", data)
}
