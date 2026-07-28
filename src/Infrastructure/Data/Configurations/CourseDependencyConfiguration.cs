using CuRoadmap.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CuRoadmap.Infrastructure.Data.Configurations;

public class CourseDependencyConfiguration : IEntityTypeConfiguration<CourseDependency>
{
    public void Configure(EntityTypeBuilder<CourseDependency> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.CourseId);
        builder.HasIndex(x => x.RequiredCourseId);

        builder.Property(x => x.DependencyType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.HasOne(x => x.Course)
            .WithMany(x => x.CourseDependencies)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.RequiredCourse)
            .WithMany()
            .HasForeignKey(x => x.RequiredCourseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
