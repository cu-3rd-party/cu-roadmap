# Backend Endpoint Inventory

This directory contains a gRPC version of the current backend REST API under `backend/`.

## Scope

The proto contract covers the backend API surface, centered on the versioned REST endpoints under `/api/v1` plus `/api/health`:

| HTTP endpoint | Method | Auth | gRPC RPC |
| --- | --- | --- | --- |
| `/api/health` | `GET` | no | `SystemService.GetHealth` |
| `/api/v1/docs` | `GET` | no | `DocumentationService.GetSwaggerUi` |
| `/api/v1/docs/openapi.yaml` | `GET` | no | `DocumentationService.GetOpenApiSpec` |
| `/api/v1/graph/data` | `GET` | no | `GraphService.GetGraphData` |
| `/api/v1/courses/` | `GET` | no | `CoursesService.ListCourses` |
| `/api/v1/courses/{cohort_year}` | `GET` | no | `CoursesService.ListCoursesByCohort` |
| `/api/v1/courses/` | `POST` | admin | `CoursesService.CreateCourse` |
| `/api/v1/courses/{id}` | `PUT` | admin | `CoursesService.UpdateCourse` |
| `/api/v1/courses/{id}` | `DELETE` | admin | `CoursesService.DeleteCourse` |
| `/api/v1/courses/restore` | `POST` | admin | `CoursesService.RestoreData` |
| `/api/v1/courses/backup` | `GET` | admin | `CoursesService.BackupData` |
| `/api/v1/majors/` | `GET` | no | `MajorsService.ListMajors` |
| `/api/v1/majors/{cohort_year}` | `GET` | no | `MajorsService.ListMajorsByCohort` |
| `/api/v1/majors/identify` | `POST` | no | `MajorsService.IdentifyMajors` |
| `/api/v1/majors/identify/{cohort_year}` | `POST` | no | `MajorsService.IdentifyMajorsByCohort` |
| `/api/v1/majors/` | `POST` | admin | `MajorsService.CreateMajor` |
| `/api/v1/majors/{id}` | `PUT` | admin | `MajorsService.UpdateMajor` |
| `/api/v1/planner/generate` | `POST` | no | `PlannerService.GenerateRoadmap` |
| `/api/v1/planner/validate-semester/` | `POST` | no | `PlannerService.ValidateSemester` |
| `/api/v1/planner/validate-roadmap/` | `POST` | no | `PlannerService.ValidateRoadmap` |
| `/api/v1/planner/goal-path/` | `POST` | no | `PlannerService.GetGoalPath` |
| `/api/v1/auth/login` | `POST` | no | `AuthService.Login` |
| `/api/v1/auth/check` | `GET` | admin | `AuthService.Check` |
| `/api/v1/auth/logout` | `DELETE` | admin | `AuthService.Logout` |

## Notes

- Source of truth for route registration: `backend/main.go` and `backend/api/*.go`.
- The proto file intentionally normalizes a few REST quirks:
  - `POST /api/v1/majors/identify` accepts either a raw JSON array or an object in REST; the proto uses only the object form.
  - Login/logout/check are modeled as empty-body RPCs; auth material should be conveyed via metadata in native gRPC and via cookies in HTTP transcoding.
  - Optional REST fields are represented with proto `optional` fields where preserving presence matters.
- Non-API transport endpoints such as `/` redirect behavior and `/metrics` are intentionally excluded.
- The existing OpenAPI file in `backend/docs/api/v1.yaml` is useful context, but the proto was aligned to the actual Go handlers and tests where behavior diverged.

## Files

- `cu_roadmap_api_v1.proto`: versioned API contract with HTTP annotations.
