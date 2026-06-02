package api

import "os"

var testDatabaseURL string

func init() {
	testDatabaseURL = os.Getenv("TEST_DATABASE_URL")
}
