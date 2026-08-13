# Domain Entities for C# Port (ASP.NET Core + CQRS + DDD)

This document describes the domain entities from the Go backend for porting to C# with ASP.NET Core, following CQRS + DDD patterns.

---

## Core Entities

### Course

**Purpose:** Represents a university course with metadata, workload, and prerequisite relationships.

```csharp
public class Course
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? HandbookLink { get; set; }
    public CourseType CourseType { get; set; }
    public CourseCategory Category { get; set; }
    public int[] AllowedCohorts { get; set; } = [];
    public int[] AvailableSemesters { get; set; } = [];
    public int? RecommendedSemester { get; set; }
    public double Workload { get; set; }
    public int SeminarsWeek { get; set; } = 1;
    public int LecturesWeek { get; set; }
    public string AnalogGroup { get; set; } = string.Empty;
    public double? CsatMetric { get; set; }

    // Navigation properties
    public ICollection<CourseDependency> CourseDependencies { get; set; } = new List<CourseDependency>();
}
```

**Constraints:**
- `Description`: max 4000 characters
- `HandbookLink`: must be valid HTTP/HTTPS URL
- `Workload`: minimum 0.5
- If `SeminarsWeek` and `LecturesWeek` both 0, default to `SeminarsWeek = 1`
- If `Workload` is 0, calculate as `SeminarsWeek + LecturesWeek`
- `RecommendedSemester` must be present in `AvailableSemesters` if specified

---

### Major

**Purpose:** Represents a degree program with a cohort year and requirement structure (Box DAG).

```csharp
public class Major
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public int CohortYear { get; set; }
    public Guid? RequirementsBoxId { get; set; }

    // Navigation properties
    public Box? RequirementsBox { get; set; }
    public ICollection<Specialization> Specializations { get; set; } = new List<Specialization>();
}
```

**Indexes:**
- `Title` (for search)
- `CohortYear` (for filtering by cohort)

---

### Specialization

**Purpose:** Represents a sub-track within a Major with its own requirement structure.

```csharp
public class Specialization
{
    public Guid Id { get; set; }
    public Guid MajorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid? RequirementsBoxId { get; set; }

    // Navigation properties
    public Major Major { get; set; } = null!;
    public Box? RequirementsBox { get; set; }
}
```

---

### CourseDependency

**Purpose:** Represents prerequisite/corequisite relationships between courses with OR-group support.

```csharp
public class CourseDependency
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid RequiredCourseId { get; set; }
    public DependencyType DependencyType { get; set; }
    public int AlternativeGroup { get; set; }

    // Navigation properties
    public Course Course { get; set; } = null!;
    public Course RequiredCourse { get; set; } = null!;
}
```

**Notes:**
- `AlternativeGroup`: courses with the same `AlternativeGroup` value form an OR-group (satisfy any one)
- `DependencyType`: `Prerequisite` (must pass before) or `Corequisite` (can take same semester)

---

## Box DAG (Requirement Graph)

### Box

**Purpose:** Represents a node in the requirement DAG. Can be a course leaf, logical operator (AND/OR/XOR), or optional selection with required count.

```csharp
public class Box
{
    public Guid Id { get; set; }
    public BoxKind Kind { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid? CourseId { get; set; }
    public LogicalOp? LogicalOp { get; set; }
    public int RequiredCount { get; set; }
    public RequirementType? RequirementType { get; set; }
    public string[] Specializations { get; set; } = [];
    public string[] MandatorySpecializations { get; set; } = [];
    public int? AdmissionYear { get; set; }
    public string? MajorTrack { get; set; }

    // Navigation properties
    public Course? Course { get; set; }
    public ICollection<BoxEdge> OutgoingRequirements { get; set; } = new List<BoxEdge>();
    public ICollection<BoxEdge> IncomingRequirements { get; set; } = new List<BoxEdge>();
}
```

**BoxKind values:**
- `Course`: leaf node referencing a specific course
- `Logical`: operator node (AND/OR/XOR)
- `Optional`: selection node with `RequiredCount` (choose N from children)

**LogicalOp values (for `Logical` kind):**
- `And`: all children required
- `Or`: at least one child required
- `Xor`: exactly one child required

**RequirementType values:**
- `MajorCore`: required core courses for the major
- `MajorChoice`: choose from a set for the major
- `Flex`: flexible electives
- `University`: university-wide requirements
- `Elective`: general electives
- `Minor`: minor program requirements
- `Soft`: soft skills requirements
- `SelectedTopics`: specific topic selections

**Special fields:**
- `Specializations`: which specializations this requirement applies to
- `MandatorySpecializations`: specializations where this is mandatory
- `AdmissionYear`: year this requirement became active
- `MajorTrack`: specific track within a major

---

### BoxEdge

**Purpose:** Represents an edge in the Box DAG, linking parent requirement to child requirement.

```csharp
public class BoxEdge
{
    public Guid Id { get; set; }
    public Guid ParentBoxId { get; set; }
    public Guid ChildBoxId { get; set; }
    public int Position { get; set; }

    // Navigation properties
    public Box ParentBox { get; set; } = null!;
    public Box ChildBox { get; set; } = null!;
}
```

**Notes:**
- `Position`: ordering of children within a parent (for display/processing order)

---

## Student

### Student

**Purpose:** Represents a student with their cohort, current progress, and target major.

```csharp
public class Student
{
    public Guid Id { get; set; }
    public int Cohort { get; set; }
    public int CurrentSemester { get; set; }
    public Guid? TargetMajorId { get; set; }

    // Navigation properties
    public Major? TargetMajor { get; set; }
    public ICollection<Course> PassedCourses { get; set; } = new List<Course>();
}
```

**Notes:**
- `PassedCourses`: many-to-many relationship via `student_passed_courses` junction table

---

## Authentication

### AuthToken

**Purpose:** Represents an authentication token with TTL for cookie-based auth.

```csharp
public class AuthToken
{
    public Guid Token { get; set; }
    public long Ttl { get; set; } // Unix timestamp when token expires
}
```

**Notes:**
- Token is used as HTTP-only cookie (`auth-token`)
- TTL is Unix timestamp (seconds since epoch)
- Typical TTL: 1 hour

---

## Enums

### CourseType

```csharp
public enum CourseType
{
    Mandatory,
    Elective,
    Other
}
```

---

### CourseCategory

```csharp
public enum CourseCategory
{
    Fundamentals,
    Ai,
    Stem,
    Soft,
    Business,
    Tech,
    Swe,
    Design
}
```

---

### CourseSource

```csharp
public enum CourseSource
{
    Selected,
    Passed
}
```

**Usage:** Distinguishes between courses a student has selected for their roadmap vs. courses they have already passed.

---

### DependencyType

```csharp
public enum DependencyType
{
    Prerequisite,
    Corequisite
}
```

---

### BoxKind

```csharp
public enum BoxKind
{
    Course,
    Logical,
    Optional
}
```

---

### LogicalOp

```csharp
public enum LogicalOp
{
    And,
    Or,
    Xor
}
```

---

### RequirementType

```csharp
public enum RequirementType
{
    MajorCore,
    MajorChoice,
    Flex,
    University,
    Elective,
    Minor,
    Soft,
    SelectedTopics
}
```

---

## DTOs for API

### CreateCourseRequest

```csharp
public record CreateCourseRequest(
    string Title,
    string? Description,
    string? HandbookLink,
    CourseType CourseType,
    CourseCategory Category,
    int[] AllowedCohorts,
    int[] AvailableSemesters,
    int? RecommendedSemester,
    double Workload,
    int SeminarsWeek,
    int LecturesWeek,
    string[] Prerequisites,
    string[] Corequisites
);
```

**Validation:**
- `Title`: required
- `Description`: max 4000 chars
- `HandbookLink`: valid HTTP/HTTPS URL
- `Workload`: min 0.5
- `RecommendedSemester`: must be in `AvailableSemesters`
- If `SeminarsWeek` and `LecturesWeek` both 0 → `SeminarsWeek = 1`
- If `Workload` is 0 → `Workload = SeminarsWeek + LecturesWeek`

---

### UpdateCourseRequest

Same fields as `CreateCourseRequest` (all updatable).

---

### PlannerRequest

```csharp
public record PlannedSemester(
    int Semester,
    Guid[] CourseIds
);

public record PlannerRequest(
    Guid[] PassedCourseIds,
    PlannedSemester[] SelectedCourseIds,
    CourseSource CourseSource,
    Guid MajorId,
    Guid? SpecializationId,
    int CurrentSemester = 1,
    double MaxLoad = 60.0,
    int Cohort
);
```

**Validation:**
- `CurrentSemester`: > 0
- `MaxLoad`: > 0
- `Cohort`: >= 0

---

## Database Schema (PostgreSQL)

### Key Tables

```sql
-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    handbook_link TEXT,
    course_type VARCHAR(20) NOT NULL,
    category VARCHAR(20) NOT NULL,
    allowed_cohorts INTEGER[],
    available_semesters INTEGER[] NOT NULL,
    recommended_semester INTEGER,
    workload DOUBLE PRECISION NOT NULL,
    seminars_week INTEGER NOT NULL DEFAULT 1,
    lectures_week INTEGER NOT NULL DEFAULT 0,
    analog_group VARCHAR(255) DEFAULT '',
    csat_metric DOUBLE PRECISION
);

-- Majors
CREATE TABLE majors (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    school VARCHAR(255) NOT NULL,
    cohort_year INTEGER NOT NULL,
    requirements_box_id UUID,
    FOREIGN KEY (requirements_box_id) REFERENCES boxes(id)
);

-- Specializations
CREATE TABLE specializations (
    id UUID PRIMARY KEY,
    major_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    requirements_box_id UUID,
    FOREIGN KEY (major_id) REFERENCES majors(id),
    FOREIGN KEY (requirements_box_id) REFERENCES boxes(id)
);

-- Course Dependencies
CREATE TABLE course_dependencies (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL,
    required_course_id UUID NOT NULL,
    dependency_type VARCHAR(20) NOT NULL,
    alternative_group INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (required_course_id) REFERENCES courses(id)
);

-- Boxes (Requirement DAG Nodes)
CREATE TABLE boxes (
    id UUID PRIMARY KEY,
    kind VARCHAR(20) NOT NULL,
    title VARCHAR(255),
    course_id UUID,
    logical_op VARCHAR(10),
    required_count INTEGER NOT NULL DEFAULT 0,
    requirement_type VARCHAR(20),
    specializations TEXT[],
    mandatory_specializations TEXT[],
    admission_year INTEGER,
    major_track VARCHAR(64),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Box Edges (Requirement DAG Edges)
CREATE TABLE box_edges (
    id UUID PRIMARY KEY,
    parent_box_id UUID NOT NULL,
    child_box_id UUID NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (parent_box_id) REFERENCES boxes(id),
    FOREIGN KEY (child_box_id) REFERENCES boxes(id)
);

-- Students
CREATE TABLE students (
    id UUID PRIMARY KEY,
    cohort INTEGER NOT NULL,
    current_semester INTEGER NOT NULL,
    target_major_id UUID,
    FOREIGN KEY (target_major_id) REFERENCES majors(id)
);

-- Student Passed Courses (Junction Table)
CREATE TABLE student_passed_courses (
    student_id UUID NOT NULL,
    course_id UUID NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Auth Tokens
CREATE TABLE auth_tokens (
    token UUID PRIMARY KEY,
    ttl BIGINT NOT NULL
);
```

---

## CQRS + DDD Implementation Notes

### Aggregate Roots

1. **Course** - aggregate root for course catalog operations
2. **Major** - aggregate root for degree program operations (includes Specializations and Box DAG)
3. **Student** - aggregate root for student progress tracking

### Value Objects

Consider implementing as value objects:
- `Workload` (double with min 0.5 constraint)
- `SemesterRange` (AvailableSemesters array)
- `CohortYear` (int with validation)
- `Url` (HandbookLink with validation)

### Domain Events

Potential domain events to raise:
- `CourseCreated`, `CourseUpdated`, `CourseDeleted`
- `MajorRequirementsChanged`
- `StudentPassedCourse`, `StudentRoadmapUpdated`

### Repository Interfaces

```csharp
public interface ICourseRepository
{
    Task<Course?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Course>> GetAllAsync(CancellationToken ct);
    Task<IReadOnlyList<Course>> GetByCohortAndMajorAsync(int cohort, Guid majorId, CancellationToken ct);
    Task<Course> AddAsync(Course course, CancellationToken ct);
    Task UpdateAsync(Course course, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public interface IMajorRepository
{
    Task<Major?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Major>> GetAllAsync(CancellationToken ct);
    Task<IReadOnlyList<Major>> GetByCohortAsync(int cohort, CancellationToken ct);
    Task<Major> AddAsync(Major major, CancellationToken ct);
    Task UpdateAsync(Major major, CancellationToken ct);
    Task DeleteAsync(Guid id, CancellationToken ct);
}

public interface IStudentRepository
{
    Task<Student?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<Student> AddAsync(Student student, CancellationToken ct);
    Task UpdateAsync(Student student, CancellationToken ct);
}
```

### Application Services (Commands/Queries)

Example structure:

```
Application/
├── Courses/
│   ├── Commands/
│   │   ├── CreateCourse/
│   │   ├── UpdateCourse/
│   │   └── DeleteCourse/
│   ├── Queries/
│   │   ├── GetCourse/
│   │   ├── GetAllCourses/
│   │   └── GetCoursesByMajor/
│   └── DTOs/
├── Majors/
│   ├── Commands/
│   │   ├── CreateMajor/
│   │   ├── UpdateMajor/
│   │   └── DeleteMajor/
│   ├── Queries/
│   │   ├── GetMajor/
│   │   ├── GetAllMajors/
│   │   └── IdentifyMajor/
│   └── DTOs/
├── Planner/
│   ├── Commands/
│   │   └── GenerateRoadmap/
│   ├── Queries/
│   │   ├── ValidateSemester/
│   │   ├── ValidateRoadmap/
│   │   └── GetGoalPath/
│   └── DTOs/
```

---

## API Endpoints (ASP.NET Core MVC Controllers)

### Courses Controller

```
GET    /api/v1/courses                          - List all courses
GET    /api/v1/courses/{cohort}/{majorId}       - Get courses for major
POST   /api/v1/courses                          - Create course (auth required)
PUT    /api/v1/courses/{id}                     - Update course (auth required)
DELETE /api/v1/courses/{id}                     - Delete course (auth required)
POST   /api/v1/courses/restore                  - Restore from JSON backup (auth required)
GET    /api/v1/courses/backup                   - Backup to JSON (auth required)
```

### Majors Controller

```
GET    /api/v1/majors/                          - List all majors
GET    /api/v1/majors/{cohortYear}              - Get majors by cohort
GET    /api/v1/majors/specializations/{id}      - Get specializations for major
POST   /api/v1/majors/identify                  - Identify major from passed courses
POST   /api/v1/majors/identify/{cohortYear}     - Identify major (with cohort)
POST   /api/v1/majors/identify-specializations  - Identify specializations
POST   /api/v1/majors/identify-specializations/{cohortYear}
POST   /api/v1/majors/                          - Create major (auth required)
PUT    /api/v1/majors/{id}                      - Update major (auth required)
```

### Planner Controller

```
POST   /api/v1/planner/generate                 - Generate roadmap
POST   /api/v1/planner/validate-semester        - Validate single semester
POST   /api/v1/planner/validate-roadmap         - Validate full roadmap
POST   /api/v1/planner/goal-path                - Find path to target course
```

### Auth Controller

```
POST   /api/v1/auth/login                       - Login
GET    /api/v1/auth/check                       - Check auth status (auth required)
DELETE /api/v1/auth/logout                      - Logout (auth required)
```

---

## Validation Rules Summary

### Course Validation
- Description ≤ 4000 characters
- HandbookLink must match `^https?://.*$`
- Workload ≥ 0.5
- If SeminarsWeek = 0 AND LecturesWeek = 0 → SeminarsWeek = 1
- If Workload = 0 → Workload = SeminarsWeek + LecturesWeek
- RecommendedSemester must be in AvailableSemesters (if specified)

### Planner Validation
- CurrentSemester > 0
- MaxLoad > 0
- Cohort ≥ 0

### Box DAG Validation
- Box of kind `Course` must have `CourseId` set
- Box of kind `Logical` must have `LogicalOp` set
- Box of kind `Optional` must have `RequiredCount` > 0
- No cycles in the DAG
- All `CourseId` references must exist in Courses table

---

## Implementation Checklist

- [ ] Create entity classes in `src/Domain/Entities/`
- [ ] Create enum types in `src/Domain/Enums/`
- [ ] Implement value objects for constrained types
- [ ] Configure EF Core entity configurations in `src/Infrastructure/Data/Configurations/`
- [ ] Create repository interfaces in `src/Application/Common/Interfaces/`
- [ ] Implement repositories in `src/Infrastructure/Repositories/`
- [ ] Create CQRS commands/queries using MediatR
- [ ] Implement MVC controllers with API versioning
- [ ] Add FluentValidation validators for DTOs
- [ ] Configure authentication (cookie-based Identity)
- [ ] Implement Google Sheets sync service
- [ ] Implement roadmap planning algorithms (Greedy, DP, ILP, LP Relaxation)
- [ ] Implement Box DAG resolver for major requirements
- [ ] Add semester/roadmap validation logic
- [ ] Configure rate limiting and caching
- [ ] Add Prometheus metrics
- [ ] Create database migrations
