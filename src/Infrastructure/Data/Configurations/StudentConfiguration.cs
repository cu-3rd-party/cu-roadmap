using CuRoadmap.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CuRoadmap.Infrastructure.Data.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.TargetMajor)
            .WithMany()
            .HasForeignKey(x => x.TargetMajorId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.PassedCourses)
            .WithMany()
            .UsingEntity("student_passed_courses");
    }
}
