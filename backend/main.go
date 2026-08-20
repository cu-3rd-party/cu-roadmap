package main

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/cu-3rd-party/cu-roadmap/backend/api"
	"github.com/cu-3rd-party/cu-roadmap/backend/api/middleware"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
)

func main() {
	_ = godotenv.Load()
	initSettings()
	initLogger()

	slog.Info("starting CU Roadmap API")

	credsJSON := settings.GoogleServiceAccountJSON
	if credsJSON == "" && settings.GoogleServiceAccountJSONB64 != "" {
		decoded, err := base64.StdEncoding.DecodeString(settings.GoogleServiceAccountJSONB64)
		if err == nil {
			credsJSON = string(decoded)
		}
	}
	store.SetSheetsConfig(
		settings.GoogleSheetsSpreadsheetID,
		credsJSON,
		settings.GoogleSheetsSyncSheetNames(),
	)

	slog.Info(
		"sheets sync configured",
		"spreadsheet_id", settings.GoogleSheetsSpreadsheetID,
		"requested_sheets", settings.GoogleSheetsSyncSheetNames(),
	)

	useMemoryStore := settings.UseMemoryStore
	useMemoryCacheStore := settings.UseMemoryCacheStore

	slog.Info("initializing stores", "USE_MEMORY_STORE", useMemoryStore, "USE_MEMORY_CACHE_STORE", useMemoryCacheStore)
	s, err := store.InitStore(useMemoryStore, settings.DBURL(), settings.AdminPassword, useMemoryCacheStore, settings.RedisURL())
	if err != nil {
		log.Fatalf("failed to init store: %v", err)
	}
	defer s.Close()

	if settings.GoogleSheetsSyncEnabled {
		slog.Info("performing initial Google Sheets sync...")
		if err := store.GetStore().SyncGoogleSheetsData(); err != nil {
			slog.Warn("initial Google Sheets sync failed", "error", err)
		} else {
			slog.Info("initial Google Sheets sync complete")
		}
		go func() {
			ticker := time.NewTicker(time.Duration(settings.GoogleSheetsSyncIntervalSecond) * time.Second)
			defer ticker.Stop()
			for range ticker.C {
				if err := store.GetStore().SyncGoogleSheetsData(); err != nil {
					slog.Warn("Google Sheets background sync failed", "error", err)
				}
			}
		}()
	}

	router := gin.Default()

	origins := make([]string, 0, 2)
	origins = append(origins, "https://roadmap.cu3rd.ru")
	if gin.IsDebugging() {
		// allow common local dev hosts; additionally allow any http://localhost:* via AllowOriginFunc
		origins = append(origins, "http://localhost:5173", "http://localhost:5174")
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Cookie"},
		AllowCredentials: true,
		AllowOriginFunc: func(origin string) bool {
			if gin.IsDebugging() {
				// allow any localhost origin on dev machine (different vite ports, etc.)
				if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") {
					return true
				}
			}
			return origin == "https://roadmap.cu3rd.ru"
		},
	}))
	router.Use(middleware.MetricsMiddleware())

	staticDir, _ := filepath.Abs("static")
	err = os.MkdirAll(staticDir, 0o755)
	if err != nil {
		return
	}
	router.Use(static.Serve("/static", static.LocalFile(staticDir, true)))

	apiV1 := router.Group("/api/v1")
	apiV1.Use(middleware.RateLimitMiddleware())
	{
		api.RegisterDocsRoutes(apiV1)
		api.RegisterGraphRoutes(apiV1.Group("/graph"))
		api.RegisterMajorsRoutes(apiV1.Group("/majors"))
		api.RegisterCoursesRoutes(apiV1.Group("/courses"))
		api.RegisterPlannerRoutes(apiV1.Group("/planner"))
		api.RegisterAuthRoutes(apiV1.Group("/auth"))
		api.RegisterDisciplineGroupRoutes(apiV1.Group("/discipline-groups"))
		apiV1.POST("/admin/sync", api.SyncGoogleSheetsHandler)
		apiV1.POST("/sync", api.SyncGoogleSheetsHandler)
	}

	router.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusTemporaryRedirect, "/static/index.html")
	})

	router.GET("/api/health", func(c *gin.Context) {
		if !s.Ready() {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "starting", "timestamp": time.Now().Format(time.RFC3339)})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok", "timestamp": time.Now().Format(time.RFC3339)})
	})
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	addr := fmt.Sprintf("%s:%d", settings.Host, settings.Port)
	slog.Info("listening", "addr", addr)

	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("server forced to shutdown:", err)
	}

	slog.Info("server exited")
}
