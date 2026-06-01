# backend-go — CU Roadmap API (Go)

Go rewrite of `backend/` (Python/FastAPI). Drop-in replacement — same API surface, same CSV seeding, same in-memory store semantics.

## Stack

| Concern | Choice | Why |
|---|---|---|
| HTTP framework | `gin-gonic/gin` v1.10 | mirrors FastAPI decorator-style routing |
| DB ORM | `gorm.io/gorm` v1.25 + `gorm.io/driver/postgres` | SQLAlchemy analogue with AutoMigrate |
| Config | `kelseyhightower/envconfig` | env-var config with defaults (no `.env` file) |
| Logging | `log/slog` (stdlib) | structured JSON/text output; level from `LOG_LEVEL` |
| UUIDs | `google/uuid` v1.6 | used as PKs everywhere |
| Testing | `stretchr/testify` + suite | `assert`/`require`, `suite.Run` for groups |
| Container | multi-stage `Dockerfile` (golang:1.23-alpine → alpine:3.19) | 15 MB final image |
| Sheets API | `google.golang.org/api/sheets/v4` + `golang.org/x/oauth2/google` | service-account auth, JWT config |

## Directory Layout

```
backend-go/
├── main.go              # entry point: init → store → router → serve
├── settings.go          # Settings struct via envconfig, global var `settings`
├── logger.go             # slog init
├── Dockerfile            # multi-stage build
├── go.mod / go.sum
├── domain/               # pure-data types, no package-level deps
│   ├── enums.go          # CourseType, CourseCategory, DependencyType, RequirementType
│   ├── models.go         # GORM models (Course, Major, Student, CourseDependency, MajorRequirement)
│   └── schemas.go        # JSON request/response structs (PlannerRequest, ValidationResult…)
├── store/                # data-access abstraction
│   ├── interface.go      # StoreBase interface (15 methods)
│   ├── factory.go        # global singleton: InitStore / GetStore / CloseStore
│   ├── memory.go         # MemoryStore — in-memory impl, CSV seeding, recommended-semester calc
│   ├── postgres.go       # PostgresStore — GORM-based impl (partial)
│   └── sync.go           # Google Sheets sync: SHEET_TO_MAJOR, SyncFromSheetData, sheets auth + fetch
├── api/                  # gin handlers, one file per resource
│   ├── courses.go        # GET /api/v1/courses/
│   ├── majors.go         # GET /api/v1/majors/   POST /api/v1/majors/identify
│   ├── graph.go          # GET /api/v1/graph/data
│   └── planner.go        # POST generate / validate-semester / validate-roadmap / goal-path  GET test-engine2
├── service/              # business logic
│   ├── planner.go        # PlannerService.FindPathToCourse (goal-oriented path)
│   ├── validator.go      # RoadmapValidator (semester & full-roadmap validation)
│   └── greedy.go         # GreedyPlanner.GenerateRoadmap (major-based semester scheduling)
├── sync/                 # Google Sheets sync stub
│   └── google_sheets.go
├── tests/                # testify tests (package tests)
│   ├── store_test.go     # MemoryStore CRUD (suite + standalone)
│   ├── planner_test.go   # GreedyPlanner tests
│   └── validator_test.go # RoadmapValidator + PlannerService tests
├── static/               # SPA frontend (copied verbatim from backend/)
├── *.csv                 # seed data (copied verbatim from backend/)
└── credentials/          # mounted at runtime by Docker
```

## How to Run

### Local (in-memory store, no DB needed)

```bash
cd backend
FORCE_MEMORY_STORE=true go run .
# → listens on 0.0.0.0:8080
# → seeds from courses.csv / course_dependencies.csv / majors.csv on startup
```

### With PostgreSQL

```bash
cd backend
POSTGRES_HOST=localhost POSTGRES_USER=u POSTGRES_PASSWORD=p POSTGRES_DB=roadmap_db go run .
# → auto-migrates tables via GORM
```

### Docker

```bash
cd backend
docker build -t cu-roadmap-backend .
docker run -p 8080:8080 -e FORCE_MEMORY_STORE=true cu-roadmap-backend
```

## Running Tests

```bash
cd backend
go test ./tests/... -v -count=1   # 25 tests, all use MemoryStore (no DB)
```

Tests live in `tests/` as a separate Go package. They import `store`, `service`, `domain` directly. No build tags, no mocks — `MemoryStore` is in-process.

### Test patterns

- **Suite tests**: `MemoryStoreTestSuite` groups CRUD tests with shared Setup/TearDown
- **Standalone tests**: `TestGenerateRoadmapBasic` creates fresh MemoryStore in the function body
- **Data helpers**: `newTestData()` in `planner_test.go` creates 3 courses + 1 dependency

## API Endpoints

| Method | Path                                 | Handler file | Notes |
|---|--------------------------------------|---|---|
| GET | `/`                                  | main.go:85 | redirects → `/static/index.html` |
| GET | `/api/health`                        | main.go:88 | `{"status":"healthy"}` |
| GET | `/api/v1/graph/data`                 | graph.go | nodes + edges for vis-network |
| GET | `/api/v1/courses/`                   | courses.go | all courses with prereqs |
| GET | `/api/v1/majors/`                    | majors.go | majors with requirements |
| POST | `/api/v1/majors/identify`            | majors.go | body: `["uuid1","uuid2"]` → score-sorted analysis |
| POST | `/api/v1/planner/generate`           | planner.go | `PlannerRequest` → roadmap |
| POST | `/api/v1/planner/validate-semester/` | planner.go | `SemesterValidationRequest` → `ValidationResult` |
| POST | `/api/v1/planner/validate-roadmap/`  | planner.go | `RoadmapValidationRequest` → `{"validation_results":[…]}` |
| POST | `/api/v1/planner/goal-path/`         | planner.go | `GoalPathRequest` → roadmap |
| GET | `/api/v1/planner/test-engine2`       | planner.go | debug endpoint, uses first student |

## Data Model

All PKs are `uuid.UUID`. GORM models in `domain/models.go`, store-agnostic data types in `store/interface.go` (`CourseData`, `MajorData`, `StudentData`, `CourseDependencyData`, `MajorRequirementData`). The `store/` layer converts between GORM models and data types.

**Enums** (string-based, stored as `varchar` in PG):

| Type | Values |
|---|---|
| `CourseType` | `mandatory`, `elective`, `other` |
| `CourseCategory` | `ai`, `stem`, `soft`, `business`, `tech`, `design` |
| `DependencyType` | `prerequisite`, `corequisite_type1`, `corequisite_type2` |
| `RequirementType` | `core`, `minor_recommended` |

## Key Conventions

1. **No comments in production code** — zero inline comments in `.go` files unless the pattern is genuinely non-obvious. Test descriptions are fine.
2. **Handlers are thin** — parse request → call service/store → return JSON. Business logic lives in `service/`.
3. **Store interface is the seam** — `StoreBase` in `store/interface.go` defines 15 methods. `MemoryStore` is the primary impl (used in tests and `FORCE_MEMORY_STORE=true`). `PostgresStore` mirrors the same interface.
4. **Global store singleton** — `store.InitStore()` / `store.GetStore()` / `store.CloseStore()`. Handlers access it via `store.GetStore()`.
5. **Config is a global** — `settings` var in `settings.go` (package `main`), initialized once in `main()`. Use `settings.ForceMemoryStore`, `settings.SeedOnStartup`, etc.
6. **`slog` for all logging** — no `fmt.Println` in production code. Use `slog.Info`, `slog.Warn`, `slog.Error`.
7. **CSV path resolution** — `MemoryStore.SeedAllData()` reads from CWD (e.g. `"courses.csv"`). Works both in `go run .` and Docker since `WORKDIR /app` is the project root.

## Common Pitfalls / LLM Notes

- **When adding a new API route**: create a file in `api/`, write a `Register*Routes(*gin.RouterGroup)` function, call it from `main.go` under the `/api/v1` group.
- **When adding a new store method**: add to `StoreBase` interface → implement in both `MemoryStore` and `PostgresStore`.
- **Request types come from `domain/schemas.go`**, not from separate files. Use `c.ShouldBindJSON(&req)`.
- **Store data types (`CourseData`, etc.) are NOT the GORM models.** They match the Python `@dataclass` definitions exactly. The `PostgresStore` converts between GORM and data types via `toCourseData()`/`toStudentData()` helpers.
- **The `service/validator.go` exports `AllCourses` field** on `RoadmapValidator` so tests and API handlers can inspect it.
- **`ValidateFullRoadmap` accepts `[]map[string]interface{}`** (not typed structs) because JSON from the frontend and Go test code pass differently typed `"semester"` values. The helpers `toInt()` and `parseCourseIDs()` handle both `int`/`float64` and `[]string`/`[]interface{}`.
- **Test filenames correspond to the three main layers**: `store_test.go` → `store/`, `planner_test.go` → `service/greedy.go`, `validator_test.go` → `service/validator.go` + `service/planner.go`.
- **Formatter**: `gofumpt` preferred but standard `gofmt` is fine. Run `go vet ./...` before committing.
- **Dependency management**: `go mod tidy` to clean up. New deps go into `go.mod` with explicit version.

## Documentation

This AGENTS.md is the single source of truth for project conventions. If you make structural changes (new package, new store impl, new major feature), update this file. Do **not** create additional markdown files (README, docs/) unless explicitly asked.
