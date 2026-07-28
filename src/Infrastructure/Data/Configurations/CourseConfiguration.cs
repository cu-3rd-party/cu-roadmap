using CuRoadmap.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CuRoadmap.Infrastructure.Data.Configurations;

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasColumnType("text");

        builder.Property(x => x.HandbookLink)
            .HasColumnType("text");

        builder.Property(x => x.CourseType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.Category)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.AllowedCohorts)
            .HasColumnType("integer[]");

        builder.Property(x => x.AvailableSemesters)
            .HasColumnType("integer[]")
            .IsRequired();

        builder.Property(x => x.Workload)
            .HasColumnType("double precision")
            .IsRequired();

        builder.Property(x => x.AnalogGroup)
            .HasMaxLength(255)
            .HasDefaultValue(string.Empty);

        builder.Property(x => x.CsatMetric)
            .HasColumnType("double precision");
    }
}
