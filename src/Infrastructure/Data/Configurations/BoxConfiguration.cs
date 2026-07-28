using CuRoadmap.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CuRoadmap.Infrastructure.Data.Configurations;

public class BoxConfiguration : IEntityTypeConfiguration<Box>
{
    public void Configure(EntityTypeBuilder<Box> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.Kind);
        builder.HasIndex(x => x.AdmissionYear);
        builder.HasIndex(x => x.CourseId);

        builder.Property(x => x.Kind)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.Title)
            .HasMaxLength(255);

        builder.Property(x => x.LogicalOp)
            .HasConversion<string>()
            .HasMaxLength(10);

        builder.Property(x => x.RequirementType)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.Specializations)
            .HasColumnType("text[]");

        builder.Property(x => x.MandatorySpecializations)
            .HasColumnType("text[]");

        builder.Property(x => x.MajorTrack)
            .HasMaxLength(64);

        builder.HasOne(x => x.Course)
            .WithMany()
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
