package store

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"testing"

	"github.com/joho/godotenv"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

func TestPrintDiffEqDeps(t *testing.T) {
	_ = godotenv.Load("../.env")
	spreadsheetID := os.Getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
	credsB64 := os.Getenv("GOOGLE_SERVICE_ACCOUNT_JSON_B64")
	if spreadsheetID == "" {
		t.Fatal("GOOGLE_SHEETS_SPREADSHEET_ID is not set in env")
	}

	var credsJSON string
	if credsB64 != "" {
		decoded, err := base64.StdEncoding.DecodeString(credsB64)
		if err == nil {
			credsJSON = string(decoded)
		}
	}

	config, err := google.JWTConfigFromJSON([]byte(credsJSON), "https://www.googleapis.com/auth/spreadsheets.readonly")
	if err != nil {
		t.Fatalf("parse credentials: %v", err)
	}

	client := config.Client(context.Background())
	sheetsService, err := sheets.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		t.Fatalf("create sheets service: %v", err)
	}

	spreadsheet, err := sheetsService.Spreadsheets.Get(spreadsheetID).Do()
	if err != nil {
		t.Fatalf("get spreadsheet: %v", err)
	}

	sheetMapping := make(map[string]SheetMajorMapping)
	for _, sheet := range spreadsheet.Sheets {
		title := sheet.Properties.Title
		if mapping, ok := guessSheetMapping(title); ok {
			sheetMapping[title] = mapping
		}
	}

	allData := make(map[string][]map[string]string)
	for _, sheet := range spreadsheet.Sheets {
		title := sheet.Properties.Title
		if _, ok := sheetMapping[title]; !ok {
			continue
		}
		rangeStr := fmt.Sprintf("'%s'!A:Z", title)
		resp, err := sheetsService.Spreadsheets.Values.Get(spreadsheetID, rangeStr).Do()
		if err != nil {
			continue
		}
		if len(resp.Values) == 0 {
			continue
		}
		headers := resp.Values[0]
		var headersStr []string
		for _, h := range headers {
			headersStr = append(headersStr, fmt.Sprint(h))
		}
		var rows []map[string]string
		for _, row := range resp.Values[1:] {
			record := make(map[string]string)
			for i, h := range headersStr {
				if i < len(row) {
					record[h] = fmt.Sprint(row[i])
				}
			}
			rows = append(rows, record)
		}
		allData[title] = rows
	}

	s := NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	_, err = SyncFromSheetData(s, allData, sheetMapping)
	if err != nil {
		t.Fatalf("sync: %v", err)
	}

	courses, _ := s.GetAllCourses()
	deps, _ := s.GetCourseDependencies()

	fmt.Println("\n================= COURSE DEPS IN DB =================")
	for _, c := range courses {
		if c.Title == "Дифференциальные уравнения" || c.Title == "Методы непрерывной оптимизации" {
			fmt.Printf("Course: %s (ID: %s)\n", c.Title, c.ID)
			for _, d := range deps {
				if d.CourseID == c.ID {
					reqCourse, ok := courses[d.RequiredCourseID]
					var reqTitle string
					if ok {
						reqTitle = reqCourse.Title
					} else {
						reqTitle = "<unknown>"
					}
					fmt.Printf("  Requires: %s (ID: %s, Group: %d)\n", reqTitle, d.RequiredCourseID, d.AlternativeGroup)
				}
			}
		}
	}
	fmt.Println("=====================================================")
}

func TestInspectStemSheets(t *testing.T) {
	_ = godotenv.Load("../.env")
	spreadsheetID := os.Getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
	credsB64 := os.Getenv("GOOGLE_SERVICE_ACCOUNT_JSON_B64")
	if spreadsheetID == "" {
		t.Fatal("GOOGLE_SHEETS_SPREADSHEET_ID is not set in env")
	}

	var credsJSON string
	if credsB64 != "" {
		decoded, err := base64.StdEncoding.DecodeString(credsB64)
		if err == nil {
			credsJSON = string(decoded)
		}
	}

	config, err := google.JWTConfigFromJSON([]byte(credsJSON), "https://www.googleapis.com/auth/spreadsheets.readonly")
	if err != nil {
		t.Fatalf("parse credentials: %v", err)
	}

	client := config.Client(context.Background())
	sheetsService, err := sheets.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		t.Fatalf("create sheets service: %v", err)
	}

	for _, sheetName := range []string{"STEM", "Copy of STEM"} {
		rangeStr := fmt.Sprintf("'%s'!A1:Z5", sheetName)
		resp, err := sheetsService.Spreadsheets.Values.Get(spreadsheetID, rangeStr).Do()
		if err != nil {
			t.Logf("Failed to fetch %s: %v", sheetName, err)
			continue
		}
		fmt.Printf("\n=== SHEET: %s ===\n", sheetName)
		if len(resp.Values) == 0 {
			fmt.Println("Empty sheet")
			continue
		}
		fmt.Printf("Headers (%d): %v\n", len(resp.Values[0]), resp.Values[0])
		for i := 1; i < len(resp.Values); i++ {
			fmt.Printf("Row %d: %v\n", i, resp.Values[i])
		}
	}
}

func TestInspectSyllabusFormulas(t *testing.T) {
	_ = godotenv.Load("../.env")
	spreadsheetID := os.Getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
	credsB64 := os.Getenv("GOOGLE_SERVICE_ACCOUNT_JSON_B64")
	if spreadsheetID == "" {
		t.Fatal("GOOGLE_SHEETS_SPREADSHEET_ID is not set in env")
	}

	var credsJSON string
	if credsB64 != "" {
		decoded, err := base64.StdEncoding.DecodeString(credsB64)
		if err == nil {
			credsJSON = string(decoded)
		}
	}

	config, err := google.JWTConfigFromJSON([]byte(credsJSON), "https://www.googleapis.com/auth/spreadsheets.readonly")
	if err != nil {
		t.Fatalf("parse credentials: %v", err)
	}

	client := config.Client(context.Background())
	sheetsService, err := sheets.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		t.Fatalf("create sheets service: %v", err)
	}

	rangeStr := "'Copy of STEM'!A1:Z5"
	resp, err := sheetsService.Spreadsheets.Values.Get(spreadsheetID, rangeStr).ValueRenderOption("FORMULA").Do()
	if err != nil {
		t.Fatalf("Failed to fetch: %v", err)
	}
	fmt.Printf("\n=== SHEET: Copy of STEM (FORMULA) ===\n")
	for i, row := range resp.Values {
		fmt.Printf("Row %d: %v\n", i, row)
	}
}

func TestInspectSpreadsheetGet(t *testing.T) {
	_ = godotenv.Load("../.env")
	spreadsheetID := os.Getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
	credsB64 := os.Getenv("GOOGLE_SERVICE_ACCOUNT_JSON_B64")
	if spreadsheetID == "" {
		t.Fatal("GOOGLE_SHEETS_SPREADSHEET_ID is not set in env")
	}

	var credsJSON string
	if credsB64 != "" {
		decoded, err := base64.StdEncoding.DecodeString(credsB64)
		if err == nil {
			credsJSON = string(decoded)
		}
	}

	config, err := google.JWTConfigFromJSON([]byte(credsJSON), "https://www.googleapis.com/auth/spreadsheets.readonly")
	if err != nil {
		t.Fatalf("parse credentials: %v", err)
	}

	client := config.Client(context.Background())
	sheetsService, err := sheets.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		t.Fatalf("create sheets service: %v", err)
	}

	resp, err := sheetsService.Spreadsheets.Get(spreadsheetID).
		Ranges("'Copy of STEM'!E1:E5").
		IncludeGridData(true).
		Do()
	if err != nil {
		t.Fatalf("Failed to fetch sheet: %v", err)
	}

	for _, sheet := range resp.Sheets {
		for _, data := range sheet.Data {
			for rowIndex, row := range data.RowData {
				for colIndex, cell := range row.Values {
					fmt.Printf("Row %d, Col %d: FormattedValue=%q, Hyperlink=%q, FormattedHyperlink=%v\n",
						rowIndex, colIndex, cell.FormattedValue, cell.Hyperlink, cell.TextFormatRuns)
					if cell.TextFormatRuns != nil {
						for _, run := range cell.TextFormatRuns {
							if run.Format != nil && run.Format.Link != nil {
								fmt.Printf("  Run link: %q\n", run.Format.Link.Uri)
							}
						}
					}
				}
			}
		}
	}
}
