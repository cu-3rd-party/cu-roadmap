package api

import (
	"fmt"
	"net/url"
	"os"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var testDatabaseURL string

func init() {
	testDatabaseURL = os.Getenv("TEST_DATABASE_URL")
}

func initTestStore(t *testing.T) (interfaces.StoreBase, error) {
	t.Helper()

	store.CloseStore()

	if testDatabaseURL == "" {
		return store.InitStore(true, "", "admin", true, "")
	}

	schema := fmt.Sprintf("test_%s", uuid.New().String()[:8])

	baseDB, err := gorm.Open(postgres.Open(testDatabaseURL), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("connect for schema setup: %w", err)
	}

	if err := baseDB.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schema)).Error; err != nil {
		baseDB.Exec(fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", schema))
		return nil, fmt.Errorf("create schema: %w", err)
	}

	t.Cleanup(func() {
		baseDB.Exec(fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", schema))
	})

	u, err := url.Parse(testDatabaseURL)
	if err != nil {
		baseDB.Exec(fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", schema))
		return nil, fmt.Errorf("parse database URL: %w", err)
	}
	q := u.Query()
	q.Set("search_path", schema)
	u.RawQuery = q.Encode()

	s, err := store.InitStore(false, u.String(), "admin", true, "")
	if err != nil {
		baseDB.Exec(fmt.Sprintf("DROP SCHEMA IF EXISTS %s CASCADE", schema))
		return nil, err
	}

	return s, nil
}
