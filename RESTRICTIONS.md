# Course Restrictions Feature

## Overview

This feature allows administrators to configure min/max constraints on how many courses from specific categories can be taken in each semester for a given specialization.

## Data Model

### CourseRestriction Entity

```go
type CourseRestriction struct {
    ID                uuid.UUID
    SpecializationID  uuid.UUID
    Semester          int
    Category          CourseCategory  // fundamentals, ai, stem, soft, business, tech, swe, design
    MinCourses        int             // default: 0
    MaxCourses        int             // default: 999
    InternalDescription string        // admin notes
}
```

### Relationships

- `Specialization` → has many `CourseRestriction`
- Each restriction applies to a specific semester and course category

## API Endpoints

All endpoints require authentication (admin only).

### Get Restrictions for a Specialization

```
GET /api/v1/majors/specializations/:id/restrictions
```

**Response:**
```json
[
  {
    "id": "uuid",
    "specialization_id": "uuid",
    "semester": 1,
    "category": "stem",
    "min_courses": 1,
    "max_courses": 3,
    "internal_description": "Must take at least 1 STEM course in semester 1"
  }
]
```

### Create Restriction

```
POST /api/v1/majors/specializations/:id/restrictions
```

**Request:**
```json
{
  "semester": 1,
  "category": "stem",
  "min_courses": 1,
  "max_courses": 3,
  "internal_description": "Optional note for admins"
}
```

**Response:** `201 Created` with the created restriction object

### Update Restriction

```
PUT /api/v1/majors/restrictions/:id
```

**Request:**
```json
{
  "semester": 2,
  "category": "soft",
  "min_courses": 1,
  "max_courses": 2,
  "internal_description": "Updated description"
}
```

**Response:** `200 OK` with the updated restriction object

### Delete Restriction

```
DELETE /api/v1/majors/restrictions/:id
```

**Response:** `204 No Content`

## Validation Integration

### Semester Validation

When validating a semester (`POST /api/v1/planner/validate-semester`), restrictions are automatically checked if a `specialization_id` is provided:

```json
{
  "current_semester": 1,
  "course_ids": ["uuid1", "uuid2"],
  "passed_course_ids": [],
  "max_load": 60.0,
  "specialization_id": "uuid"
}
```

**Validation Error Messages:**
```json
{
  "is_valid": false,
  "messages": [
    {
      "level": "error",
      "message": "В 1-м семестре необходимо выбрать минимум 1 курсов категории 'stem' (выбрано: 0)"
    },
    {
      "level": "error", 
      "message": "В 1-м семестре можно выбрать максимум 2 курсов категории 'soft' (выбрано: 3)"
    }
  ],
  "total_load": 45.0
}
```

### Roadmap Validation

Similarly, `POST /api/v1/planner/validate-roadmap` checks restrictions for all semesters when `specialization_id` is provided.

## Course Categories

Available categories (from `CourseCategory` enum):

- `fundamentals` - Основы
- `ai` - Искусственный интеллект
- `stem` - STEM (Science, Technology, Engineering, Mathematics)
- `soft` - Soft skills
- `business` - Бизнес
- `tech` - Технологии
- `swe` - Software Engineering
- `design` - Дизайн

## Example Use Cases

### 1. Require at least 1 STEM course every semester

Create restrictions for each semester (1-8):
```json
{
  "semester": 1,
  "category": "stem",
  "min_courses": 1,
  "max_courses": 999
}
```

### 2. Limit Soft Skills to 1 per semester starting from semester 2

```json
{
  "semester": 2,
  "category": "soft",
  "min_courses": 0,
  "max_courses": 1
}
```

### 3. Require exactly 2 AI courses in semester 5

```json
{
  "semester": 5,
  "category": "ai",
  "min_courses": 2,
  "max_courses": 2
}
```

## Frontend Integration

### Admin Panel (Implemented)

The admin panel now includes a "Специализации" (Specializations) tab where you can:

1. **View Specializations**: Select a major from the dropdown to see its specializations
2. **Create Specialization**: Click "Добавить специализацию" button
3. **Manage Restrictions**: Click the settings icon (⚙️) next to any specialization

**Restrictions Manager UI Features:**
- Table showing all restrictions for the specialization
- Sort by semester and category
- Add new restriction with:
  - Semester selector (1-8)
  - Category dropdown (all 8 course categories)
  - Min/Max number inputs
  - Internal description textarea
- Edit existing restrictions
- Delete restrictions with confirmation

**Location:** `admin/src/pages/admin/RestrictionsManager.tsx`

### Student Planner (TODO)

To display restriction conflicts in the main frontend planner:

1. **Validation Errors**: Restriction violations already appear in validation API responses
2. **UI Display**: Show errors in the semester validation section
3. **Category Counts**: Display remaining slots per category in semester summary

Example error message (already returned by API):
```
"В 1-м семестре необходимо выбрать минимум 1 курсов категории 'stem' (выбрано: 0)"
```

## Database Schema

```sql
CREATE TABLE course_restrictions (
    id UUID PRIMARY KEY,
    specialization_id UUID NOT NULL REFERENCES specializations(id),
    semester INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL,
    min_courses INTEGER NOT NULL DEFAULT 0,
    max_courses INTEGER NOT NULL DEFAULT 999,
    internal_description TEXT,
    UNIQUE(specialization_id, semester, category)
);

CREATE INDEX idx_restrictions_semester ON course_restrictions(semester);
CREATE INDEX idx_restrictions_spec ON course_restrictions(specialization_id);
```

## Testing

### Unit Tests (TODO)

Test cases for `ValidateRestrictions`:
- Empty restrictions → no errors
- Courses within min/max → valid
- Courses below minimum → error
- Courses above maximum → error
- Multiple categories in same semester
- Restrictions for different semesters

### Integration Tests (TODO)

- Create restriction via API
- Validate semester with violating courses
- Validate semester with compliant courses
- Update/delete restrictions

## Migration from newdb.md Spec

The implemented model is a simplified version of the newdb.md spec:

| newdb.md Concept | Implementation |
|-----------------|----------------|
| `restrictions` table | `CourseRestriction` entity |
| `specializationsConnections` + `disciplineGroups` | Direct `Category` field |
| `restrictionsList` | Direct FK to `Specialization` |
| Complex resolver boxes | Simple category-based counting |

This simplification makes the feature easier to configure and understand while still meeting the core requirement of min/max constraints per category per semester.
