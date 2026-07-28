using CuRoadmap.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CuRoadmap.Infrastructure.Data.Configurations;

public class MajorConfiguration : IEntityTypeConfiguration<Major>
{
    public void Configure(EntityTypeBuilder<Major> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.Title);
        builder.HasIndex(x => x.CohortYear);

        builder.Property(x => x.Title)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.School)
            .HasMaxLength(255)
            .IsRequired();

        builder.HasOne(x => x.RequirementsBox)
            .WithMany()
            .HasForeignKey(x => x.RequirementsBoxId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
