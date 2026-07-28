using CuRoadmap.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CuRoadmap.Infrastructure.Data.Configurations;

public class SpecializationConfiguration : IEntityTypeConfiguration<Specialization>
{
    public void Configure(EntityTypeBuilder<Specialization> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.MajorId);

        builder.Property(x => x.Title)
            .HasMaxLength(255)
            .IsRequired();

        builder.HasOne(x => x.Major)
            .WithMany(x => x.Specializations)
            .HasForeignKey(x => x.MajorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.RequirementsBox)
            .WithMany()
            .HasForeignKey(x => x.RequirementsBoxId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
