# Project Overview

This repo contains **two independent implementations** of the same application — a **university course roadmap planning system** ("CU Roadmap"):

1. **Original (production):** Go + React (two SPAs), currently live
2. **Scaffolding (in-progress):** .NET 10 + Angular 22, Clean Architecture

---

# Original Project — Go Backend + React Frontends

## Architecture

- **Backend:** Go (`backend/`) — REST API with Gin framework
- **Frontend:** React SPA (`frontend/`) — main user-facing planner app
- **Admin:** React SPA (`admin/`) — admin panel for course/major CRUD
- **Proxy:** nginx (`nginx/`) — routes `/api/` → backend, `/` → frontend, `/admin` → admin
- **Infrastructure:** Docker Compose, PostgreSQL, Redis, Prometheus, Grafana

## Original Backend (`backend/`)

### Core Functionality

The backend is a **university course roadmap planning API** that manages a catalog of courses with prerequisite/corequisite relationships, degree program requirements (majors/specializations) modeled as a Box DAG (logical AND/OR/XOR operators), and generates optimal multi-semester study plans. Courses have metadata: title, category (fundamentals/ai/stem/soft/business/tech/swe/design), type (mandatory/elective/other), allowed cohorts, available semesters, workload, analog groups (interchangeable course variants), and dependency relationships (prerequisite/corequisite with OR-group support).

### Features

- **Course Catalog CRUD** — courses, majors, specializations
- **Prerequisite Graph** — courses linked via `CourseDependency` with OR-group alternatives
- **Major Requirement Resolution** — DAG-based logical requirement engine via `requirements/` package
- **Major/Specialization Identification** — score a student's passed courses against each major/specialization
- **Roadmap Generation** — 4 planner algorithms:
  - **Greedy** — highest-scoring course bundles each semester
  - **DP** — knapsack DP optimization per semester
  - **ILP** — branch-and-bound search
  - **LP Relaxation** — fractional knapsack heuristic
- **Semester/Roadmap Validation** — prerequisite/corequisite/load/STEM minimum/soft skills constraints
- **Goal Path** — shortest prerequisite chain to a target course
- **Google Sheets Sync** — primary data source; background goroutine re-syncs on interval
- **JSON Backup/Restore** — courses and majors

### Tech Stack

| Library | Purpose |
|---------|---------|
| `github.com/gin-gonic/gin` | HTTP framework |
| `gorm.io/gorm` + `gorm.io/driver/postgres` | ORM + PostgreSQL |
| `github.com/redis/go-redis/v9` | Caching, auth tokens, rate limiting |
| `github.com/prometheus/client_golang` | Prometheus metrics |
| `google.golang.org/api/sheets/v4` | Google Sheets API |
| `github.com/joho/godotenv` | .env loading |

### Directory Structure

```
backend/
├── main.go                     # Entry point
├── settings.go                 # Env-based config
├── logger.go                   # Structured logging (slog)
├── api/                        # HTTP handlers
│   ├── auth.go                 # Login/logout (password-based, cookie auth)
│   ├── courses.go              # Course CRUD + backup/restore
│   ├── majors.go               # Major CRUD + identification
│   ├── graph.go                # Course dependency graph
│   ├── planner.go              # Roadmap gen, validation, goal path
│   ├── identify_specializations.go
│   ├── docs.go                 # Swagger UI
│   ├── cache.go                # Response caching
│   └── middleware/
│       ├── auth.go             # Cookie-based auth check
│       ├── rate_limit.go       # Token-bucket (20 cap, 10/s refill)
│       └── metrics.go          # Prometheus HTTP metrics
├── domain/
│   ├── enums/                  # CourseType, DependencyType, RequirementType, etc.
│   ├── models/                 # GORM models (Course, Major, Specialization, CourseDependency, Box, BoxEdge, Student, AuthToken)
│   └── schemas/                # Request/response DTOs
├── service/                    # Core business logic
│   ├── roadmap_planner.go      # Planner interface + factory
│   ├── roadmap_planner_impl.go # Shared planning (~1200 lines)
│   ├── planner.go              # FindPathToCourse
│   ├── validator.go            # Semester/roadmap validation
│   ├── greedy.go               # GreedyPlanner
│   ├── dp.go                   # DPPlanner
│   ├── ilp.go                  # ILPPlanner
│   └── lp_relaxation.go        # LPRelaxationPlanner
├── store/                      # Data access layer
│   ├── postgres.go             # PostgresStore (GORM)
│   ├── memory.go               # MemoryStore (in-memory, default for dev)
│   ├── sync.go                 # Google Sheets sync (~964 lines)
│   ├── interfaces/             # Store/Cache interfaces
│   └── helpers/                # Model converters
├── requirements/               # Box DAG resolver
│   ├── graph.go                # Resolver + Graph traversal
│   ├── analyzer.go             # DependencyAnalyzer
│   └── mutate.go               # Requirement mutation helpers
└── metrics/                    # Prometheus instrumentation
```

### API Endpoints

All under `/api/v1` with rate limiting:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/metrics` | — | Prometheus metrics |
| GET | `/api/v1/graph/data` | — | Full course dependency graph |
| GET | `/api/v1/majors/` | — | List majors |
| GET | `/api/v1/majors/:cohort_year` | — | List majors by cohort |
| GET | `/api/v1/majors/specializations/:id` | — | Specializations for a major |
| POST | `/api/v1/majors/identify` | — | Score majors by passed courses |
| POST | `/api/v1/majors/identify/:cohort_year` | — | Score majors (with cohort) |
| POST | `/api/v1/majors/identify-specializations` | — | Score specializations |
| POST | `/api/v1/majors/identify-specializations/:cohort_year` | — | Score specializations (with cohort) |
| POST | `/api/v1/majors/` | ✓ | Create major |
| PUT | `/api/v1/majors/:id` | ✓ | Update major |
| GET | `/api/v1/courses/` | — | List courses (query filters) |
| GET | `/api/v1/courses/:cohort_year/:major_id` | — | List courses for major |
| POST | `/api/v1/courses/` | ✓ | Create course |
| PUT | `/api/v1/courses/:id` | ✓ | Update course |
| DELETE | `/api/v1/courses/:id` | ✓ | Delete course |
| POST | `/api/v1/courses/restore` | ✓ | Restore from JSON backup |
| GET | `/api/v1/courses/backup` | ✓ | Backup to JSON |
| POST | `/api/v1/planner/generate` | — | Generate roadmap |
| POST | `/api/v1/planner/validate-semester/` | — | Validate single semester |
| POST | `/api/v1/planner/validate-roadmap/` | — | Validate full roadmap |
| POST | `/api/v1/planner/goal-path/` | — | Find path to a target course |
| POST | `/api/v1/auth/login` | — | Login (sets cookie) |
| GET | `/api/v1/auth/check` | ✓ | Auth status check |
| DELETE | `/api/v1/auth/logout` | ✓ | Logout |
| GET | `/api/v1/docs` | — | Swagger UI |

Auth: password-based, single admin role. SHA-256 hashed password, UUID token in secure HTTP-only cookie (`auth-token`), 1h TTL. No user registration, no RBAC.

### Data Model

- **Course** — UUID PK, title, description, handbook URL, category, type, allowed cohorts, available semesters, workload, analog group
- **Major** — UUID PK, title, cohort year, requirements (via Box DAG)
- **Specialization** — belongs to Major, has own requirements Box DAG
- **CourseDependency** — links Course → RequiredCourse, with DependencyType (prerequisite/corequisite) + AlternativeGroup (OR-group)
- **Box/BoxEdge** — DAG nodes (course leaf, AND/OR/XOR operator, optional selection with required count) + edges
- **Student** — many-to-many with Course via `student_passed_courses` junction table
- **AuthToken** — UUID + TTL

## Original Frontend (`frontend/`)

React 19, Vite 7, TypeScript 5.9, pnpm. Feature-Sliced Design (FSD) architecture.

### Tech Stack

| Library | Purpose |
|---------|---------|
| react-router-dom 7 | Routing |
| @tanstack/react-query 5 | Server state |
| zustand 5 | Client state (persist middleware) |
| axios | HTTP client |
| Tailwind CSS 4 | Styling |
| Radix UI | UI primitives |
| @dnd-kit | Drag-and-drop (planner) |
| framer-motion | Animations |
| Lingui | i18n (Russian, WIP) |
| vite-plugin-pwa | PWA + Workbox |
| MSW | API mocking |
| Vitest + Testing Library | Unit tests |
| Playwright | E2E tests |

### Directory Structure (FSD)

```
src/
├── app/          — Providers (Query, Theme, Router), layouts, PWA updater
├── entities/     — course, major, roadmap, specialization (each: api/, model/, lib/)
├── features/     — settings, course-filters, course-select, planner-reset, trajectory-select, about
├── pages/        — planner/, catalog/, glossary/, not-found/
├── widgets/      — Navbar, SemesterSection (DnD), PlannerSummary, CourseDetailsDrawer, CoursesSection
└── shared/       — api (axios client), ui/kit (ShadCN-style), lib, constants, model types
```

### Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Redirect → `/planner` | |
| `/planner` | PlannerPage | Main DnD semester planner with validation + specialization tracking |
| `/catalog` | CatalogPage | Course catalog with filters |
| `/glossary` | GlossaryPage | University terms glossary |
| `*` | NotFoundPage | 404 |

## Original Admin Panel (`admin/`)

React 19, same stack as frontend but with `vis-network` for graph visualization. Shares the same `/api/v1` backend.

### Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Redirect → `/planner` | |
| `/planner` | PlannerPage | Placeholder |
| `/catalog` | CatalogPage | Course catalog |
| `/admin` | AdminPage | Full CRUD panel for courses + majors (1097 lines) |
| `*` | NotFoundPage | 404 |

### Auth (Admin Only)

Simple password login form — calls `POST /api/v1/auth/login`, stored in React Context.

## Nginx Proxy (`nginx/`)

| Path | Target |
|------|--------|
| `/api/` | `backend:8080` (no-cache) |
| `/` | `frontend:5173` |
| `/admin` | `admin:5173` |
| `/grafana` | `grafana:3000` |

## Testing (Original Frontends)

```
# Frontend
pnpm test           # Vitest unit tests
pnpm test:e2e       # Playwright E2E tests (against Docker Compose)
pnpm lint           # ESLint + Prettier + tsc

# Admin
pnpm test           # Vitest unit tests
pnpm lint           # ESLint + Prettier + tsc
```

## Development (Original Frontends)

```
# Frontend
pnpm dev                      # Vite dev server (proxy → https://roadmap.cu3rd.ru)
pnpm dev:mock                 # With MSW mocking
pnpm dev:noauth               # Without auth

# Admin
pnpm dev                      # Vite dev on port 5174
pnpm dev:mock                 # With MSW mocking
```

---

# Scaffolding Project — .NET 10 + Angular 22

## Architecture
.NET 10 Web API (Clean Architecture) + Angular 22 SPA.
5 projects: **Domain**, **Application**, **Infrastructure**, **Shared**, **Web**.

## Key Conventions

### Endpoints (Minimal API)
- Static class implementing `IEndpointGroup` interface with `Map(RouteGroupBuilder)`.
- Each file in `src/Web/Endpoints/` handles one route group.
- Handlers are static methods returning `TypedResults.Ok/Created/NoContent/...`.
- Request DTOs are `record` types at the bottom of the file.
- Register in `src/Web/Infrastructure/WebApplicationExtensions.cs`.
- Auth at group level: `group.RequireAuthorization()`.

### ORM / DbContext
- EF Core 10 + Npgsql (PostgreSQL), Identity tables in same DB.
- `ApplicationDbContext` in `src/Infrastructure/Data/`.
- Interface `IApplicationDbContext` in `src/Application/Common/Interfaces/`.
- **Add a new DbSet**: entity → interface `IQueryable<T>` → `ApplicationDbContext` `DbSet<T>` + explicit interface impl.
- Fluent configs in `src/Infrastructure/Data/Configurations/` via `ApplyConfigurationsFromAssembly`.
- Interceptors: `AuditableEntityInterceptor` (auto-sets Created/CreatedBy/LastModified/LastModifiedBy on `IAuditableEntity`), `DispatchDomainEventsInterceptor`.
- Dev DB init uses `EnsureDeletedAsync` + `EnsureCreatedAsync` (no migrations applied).
- To add migration: `dotnet ef migrations add <Name> --project src/Infrastructure --startup-project src/Web --output-dir Data/Migrations`

### Domain
- Entities in `src/Domain/Entities/`. Value objects in `src/Domain/ValueObjects/` (sealed records). Enums in `src/Domain/Enums/`.
- `IAuditableEntity` (`Created`, `CreatedBy`, `LastModified`, `LastModifiedBy`).

### Application
- Service interfaces in `src/Application/<Feature>/` with implementations in `src/Infrastructure/Services/`.
- DTOs with `{ get; init; }` properties.
- DI registration happens in each project's `DependencyInjection.cs` as extension methods on `IHostApplicationBuilder`.

### Identity / Auth
- Cookie-based Identity (IdentityConstants.ApplicationScheme).
- `ApplicationUser` extends `IdentityUser` (empty, in `src/Infrastructure/Identity/`).
- Login/register via `MapIdentityApi<ApplicationUser>()` at `/api/Users`.
- Default admin: `administrator@localhost` / `Administrator1!`.

### Testing
- NUnit + Shouldly + Moq.
- Functional tests use `WebApplicationFactory<Program>`, Respawn for DB reset.
- `TestBase` calls `TestApp.ResetState()` before each test.
- `TestApp` provides `RunAsDefaultUserAsync()`, `RunAsAdministratorAsync()`.

### Angular
- `src/Web/ClientApp/`, Angular 22, standalone components, SSR, Tailwind 4, pnpm.
- No feature modules yet — scaffold only.

## Common Tasks

```
# Build
dotnet build src/Web/Web.csproj

# Add migration
dotnet ef migrations add <Name> --project src/Infrastructure --startup-project src/Web --output-dir Data/Migrations

# Run
dotnet run --project src/Web
```

## Url Shortener Feature (showcase)
- `POST /api/ShortenedUrls` (auth) — `{ "url": "..." }` → returns short code (201)
- `GET /{code}` (public) — redirects to original URL (301) or 404
- Entity: `ShortenedUrl` (`Guid Id`, `string OriginalUrl`, `string ShortCode`, `DateTimeOffset Created`, `string? CreatedBy`)
- Unique index on `ShortCode` (max 8 chars, alphanumeric)
