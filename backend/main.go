package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"

	"github.com/cu-3rd-party/cu-roadmap/backend/api"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
)

func main() {
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

	slog.Info("initializing store", "USE_MEMORY_STORE", useMemoryStore)
	s, err := store.InitStore(useMemoryStore, settings.DBURL(), settings.AdminPassword)
	if err != nil {
		log.Fatalf("failed to init store: %v", err)
	}
	defer s.Close()

	if settings.SeedOnStartup {
		s := store.GetStore()
		if err := s.SeedAllData(); err != nil {
			slog.Warn("could not seed store on startup", "error", err)
		} else {
			slog.Info("store seeded with data from CSV files")
		}
	}

	if settings.GoogleSheetsSyncEnabled {
		s := store.GetStore()
		if err := s.SyncGoogleSheetsData(); err != nil {
			slog.Warn("initial Google Sheets sync failed", "error", err)
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
		origins = append(origins, "http://localhost:5173")
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Cookie"},
		AllowCredentials: true,
	}))

	staticDir, _ := filepath.Abs("static")
	os.MkdirAll(staticDir, 0o755)
	router.Use(static.Serve("/static", static.LocalFile(staticDir, true)))

	apiV1 := router.Group("/api/v1")
	{
		api.RegisterGraphRoutes(apiV1.Group("/graph"))
		api.RegisterMajorsRoutes(apiV1.Group("/majors"))
		api.RegisterCoursesRoutes(apiV1.Group("/courses"))
		api.RegisterPlannerRoutes(apiV1.Group("/planner"))
		api.RegisterAuthRoutes(apiV1.Group("/auth"))
	}

	router.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusTemporaryRedirect, "/static/index.html")
	})

	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	addr := fmt.Sprintf("%s:%d", settings.Host, settings.Port)
	slog.Info("listening", "addr", addr)

	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
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
