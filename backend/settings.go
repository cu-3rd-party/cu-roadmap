package main

import (
	"strings"

	"github.com/kelseyhightower/envconfig"
)

type Settings struct {
	PostgresUser                   string `envconfig:"POSTGRES_USER" default:"roadmap_user"`
	PostgresPassword               string `envconfig:"POSTGRES_PASSWORD" default:"roadmap_password"`
	PostgresDB                     string `envconfig:"POSTGRES_DB" default:"roadmap_db"`
	PostgresHost                   string `envconfig:"POSTGRES_HOST" default:"db"`
	SeedOnStartup                  bool   `envconfig:"SEED_ON_STARTUP" default:"true"`
	UseMemoryStore                 bool   `envconfig:"USE_MEMORY_STORE" default:"false"`
	GoogleSheetsSpreadsheetID      string `envconfig:"GOOGLE_SHEETS_SPREADSHEET_ID" default:""`
	GoogleServiceAccountJSON       string `envconfig:"GOOGLE_SERVICE_ACCOUNT_JSON" default:""`
	GoogleServiceAccountJSONB64    string `envconfig:"GOOGLE_SERVICE_ACCOUNT_JSON_B64" default:""`
	GoogleSheetsSyncSheets         string `envconfig:"GOOGLE_SHEETS_SYNC_SHEETS" default:"Бизнес и аналитика,Искусственный интеллект,Разработка"`
	GoogleSheetsSyncEnabled        bool   `envconfig:"GOOGLE_SHEETS_SYNC_ENABLED" default:"true"`
	GoogleSheetsSyncIntervalSecond int    `envconfig:"GOOGLE_SHEETS_SYNC_INTERVAL_SECONDS" default:"3600"`
	Host                           string `envconfig:"HOST" default:"0.0.0.0"`
	Port                           int    `envconfig:"PORT" default:"8080"`
	LogLevel                       string `envconfig:"LOG_LEVEL" default:"INFO"`
}

func (s *Settings) DBURL() string {
	return "postgres://" + s.PostgresUser + ":" + s.PostgresPassword +
		"@" + s.PostgresHost + ":5432/" + s.PostgresDB
}

func (s *Settings) GoogleSheetsSyncSheetNames() []string {
	parts := strings.Split(s.GoogleSheetsSyncSheets, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

var settings Settings

func initSettings() {
	if err := envconfig.Process("", &settings); err != nil {
		panic("failed to load settings: " + err.Error())
	}
}
