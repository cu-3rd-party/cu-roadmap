using CuRoadmap.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CuRoadmap.Infrastructure.Data.Configurations;

public class BoxEdgeConfiguration : IEntityTypeConfiguration<BoxEdge>
{
    public void Configure(EntityTypeBuilder<BoxEdge> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.ParentBoxId);
        builder.HasIndex(x => x.ChildBoxId);

        builder.HasOne(x => x.ParentBox)
            .WithMany(x => x.OutgoingRequirements)
            .HasForeignKey(x => x.ParentBoxId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ChildBox)
            .WithMany(x => x.IncomingRequirements)
            .HasForeignKey(x => x.ChildBoxId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
