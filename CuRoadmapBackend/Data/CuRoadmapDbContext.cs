using CuRoadmapBackend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CuRoadmapBackend.Data;

public sealed class CuRoadmapDbContext(DbContextOptions<CuRoadmapDbContext> options) : DbContext(options)
{
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Major> Majors => Set<Major>();
    public DbSet<CourseDependency> CourseDependencies => Set<CourseDependency>();
    public DbSet<MajorRequirement> MajorRequirements => Set<MajorRequirement>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<AuthToken> AuthTokens => Set<AuthToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var courseTypeConverter = new ValueConverter<CourseType, string>(
            value => ToDatabaseCourseType(value),
            value => FromDatabaseCourseType(value));

        var courseCategoryConverter = new ValueConverter<CourseCategory, string>(
            value => ToDatabaseCourseCategory(value),
            value => FromDatabaseCourseCategory(value));

        var dependencyTypeConverter = new ValueConverter<DependencyType, string>(
            value => ToDatabaseDependencyType(value),
            value => FromDatabaseDependencyType(value));

        var requirementTypeConverter = new ValueConverter<RequirementType, string>(
            value => ToDatabaseRequirementType(value),
            value => FromDatabaseRequirementType(value));

        modelBuilder.Entity<Course>(entity =>
        {
            entity.ToTable("courses");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id").HasColumnType("uuid").ValueGeneratedNever();
            entity.Property(x => x.Title).HasColumnName("title").IsRequired();
            entity.Property(x => x.Description).HasColumnName("description").HasColumnType("text");
            entity.Property(x => x.HandbookLink).HasColumnName("handbook_link").HasColumnType("text");
            entity.Property(x => x.CourseType).HasColumnName("course_type").HasColumnType("varchar(20)").HasConversion(courseTypeConverter).IsRequired();
            entity.Property(x => x.Category).HasColumnName("category").HasColumnType("varchar(20)").HasConversion(courseCategoryConverter).IsRequired();
            entity.Property(x => x.AllowedCohorts).HasColumnName("allowed_cohorts").HasColumnType("integer[]");
            entity.Property(x => x.AvailableSemesters).HasColumnName("available_semesters").HasColumnType("integer[]").IsRequired();
            entity.Property(x => x.RecommendedSemester).HasColumnName("recommended_semester").HasColumnType("integer");
            entity.Property(x => x.Workload).HasColumnName("workload").IsRequired();
            entity.Property(x => x.CsatMetric).HasColumnName("csat_metric").HasColumnType("double precision");
            entity.HasMany(x => x.CourseDependencies).WithOne(x => x.Course).HasForeignKey(x => x.CourseId);
            entity.HasMany(x => x.MajorRequirements).WithOne(x => x.Course).HasForeignKey(x => x.CourseId);
        });

        modelBuilder.Entity<Major>(entity =>
        {
            entity.ToTable("majors");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id").HasColumnType("uuid").ValueGeneratedNever();
            entity.Property(x => x.Title).HasColumnName("title");
            entity.Property(x => x.School).HasColumnName("school").IsRequired();
            entity.Property(x => x.CohortYear).HasColumnName("cohort_year");
            entity.HasIndex(x => x.Title);
            entity.HasIndex(x => x.CohortYear);
            entity.HasMany(x => x.Requirements).WithOne(x => x.Major).HasForeignKey(x => x.MajorId);
        });

        modelBuilder.Entity<CourseDependency>(entity =>
        {
            entity.ToTable("course_dependencies");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id").HasColumnType("uuid").ValueGeneratedNever();
            entity.Property(x => x.CourseId).HasColumnName("course_id").HasColumnType("uuid").IsRequired();
            entity.Property(x => x.RequiredCourseId).HasColumnName("required_course_id").HasColumnType("uuid").IsRequired();
            entity.Property(x => x.DependencyType).HasColumnName("dependency_type").HasColumnType("varchar(20)").HasConversion(dependencyTypeConverter).IsRequired();
            entity.HasIndex(x => x.CourseId);
            entity.HasIndex(x => x.RequiredCourseId);
            entity.HasOne(x => x.Course).WithMany(x => x.CourseDependencies).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.RequiredCourse).WithMany().HasForeignKey(x => x.RequiredCourseId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MajorRequirement>(entity =>
        {
            entity.ToTable("major_requirements");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id").HasColumnType("uuid").ValueGeneratedNever();
            entity.Property(x => x.MajorId).HasColumnName("major_id").HasColumnType("uuid").IsRequired();
            entity.Property(x => x.CourseId).HasColumnName("course_id").HasColumnType("uuid").IsRequired();
            entity.Property(x => x.RequirementType).HasColumnName("requirement_type").HasColumnType("varchar(20)").HasConversion(requirementTypeConverter).IsRequired();
            entity.HasIndex(x => x.MajorId);
            entity.HasIndex(x => x.CourseId);
            entity.HasOne(x => x.Major).WithMany(x => x.Requirements).HasForeignKey(x => x.MajorId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Course).WithMany(x => x.MajorRequirements).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.ToTable("students");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id").HasColumnType("uuid").ValueGeneratedNever();
            entity.Property(x => x.Cohort).HasColumnName("cohort").IsRequired();
            entity.Property(x => x.CurrentSemester).HasColumnName("current_semester").IsRequired();
            entity.Property(x => x.TargetMajorId).HasColumnName("target_major_id").HasColumnType("uuid");
            entity.HasOne(x => x.TargetMajor).WithMany(x => x.TargetStudents).HasForeignKey(x => x.TargetMajorId).OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(x => x.PassedCourses)
                .WithMany(x => x.StudentsWhoPassed)
                .UsingEntity<Dictionary<string, object>>(
                    "student_passed_courses",
                    right => right.HasOne<Course>().WithMany().HasForeignKey("course_id").HasConstraintName("fk_student_passed_courses_course_id").OnDelete(DeleteBehavior.Cascade),
                    left => left.HasOne<Student>().WithMany().HasForeignKey("student_id").HasConstraintName("fk_student_passed_courses_student_id").OnDelete(DeleteBehavior.Cascade),
                    join =>
                    {
                        join.ToTable("student_passed_courses");
                        join.HasKey("student_id", "course_id");
                        join.IndexerProperty<Guid>("student_id").HasColumnType("uuid");
                        join.IndexerProperty<Guid>("course_id").HasColumnType("uuid");
                    });
        });

        modelBuilder.Entity<AuthToken>(entity =>
        {
            entity.ToTable("auth_tokens");
            entity.HasKey(x => x.Token);
            entity.Property(x => x.Token).HasColumnName("token").HasColumnType("uuid").ValueGeneratedNever();
            entity.Property(x => x.Ttl).HasColumnName("ttl").HasColumnType("bigint");
        });
    }

    private static string ToDatabaseCourseType(CourseType value)
    {
        return value switch
        {
            CourseType.Mandatory => "mandatory",
            CourseType.Elective => "elective",
            CourseType.Other => "other",
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
        };
    }

    private static CourseType FromDatabaseCourseType(string value)
    {
        return value switch
        {
            "mandatory" => CourseType.Mandatory,
            "elective" => CourseType.Elective,
            "other" => CourseType.Other,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
        };
    }

    private static string ToDatabaseCourseCategory(CourseCategory value)
    {
        return value switch
        {
            CourseCategory.Fundamentals => "fundamentals",
            CourseCategory.Ai => "ai",
            CourseCategory.Stem => "stem",
            CourseCategory.Soft => "soft",
            CourseCategory.Business => "business",
            CourseCategory.Tech => "tech",
            CourseCategory.Design => "design",
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
        };
    }

    private static CourseCategory FromDatabaseCourseCategory(string value)
    {
        return value switch
        {
            "fundamentals" => CourseCategory.Fundamentals,
            "ai" => CourseCategory.Ai,
            "stem" => CourseCategory.Stem,
            "soft" => CourseCategory.Soft,
            "business" => CourseCategory.Business,
            "tech" => CourseCategory.Tech,
            "design" => CourseCategory.Design,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
        };
    }

    private static string ToDatabaseDependencyType(DependencyType value)
    {
        return value switch
        {
            DependencyType.Prerequisite => "prerequisite",
            DependencyType.Corequisite => "corequisite",
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
        };
    }

    private static DependencyType FromDatabaseDependencyType(string value)
    {
        return value switch
        {
            "prerequisite" => DependencyType.Prerequisite,
            "corequisite" => DependencyType.Corequisite,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
        };
    }

    private static string ToDatabaseRequirementType(RequirementType value)
    {
        return value switch
        {
            RequirementType.MajorCore => "major_core",
            RequirementType.MajorChoice => "major_choice",
            RequirementType.Flex => "flex",
            RequirementType.University => "university",
            RequirementType.Elective => "elective",
            RequirementType.Minor => "minor",
            RequirementType.Soft => "soft",
            RequirementType.SelectedTopics => "selected_topics",
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
        };
    }

    private static RequirementType FromDatabaseRequirementType(string value)
    {
        return value switch
        {
            "major_core" => RequirementType.MajorCore,
            "major_choice" => RequirementType.MajorChoice,
            "flex" => RequirementType.Flex,
            "university" => RequirementType.University,
            "elective" => RequirementType.Elective,
            "minor" => RequirementType.Minor,
            "soft" => RequirementType.Soft,
            "selected_topics" => RequirementType.SelectedTopics,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
        };
    }
}
