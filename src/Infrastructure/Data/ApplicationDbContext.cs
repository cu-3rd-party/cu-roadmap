using System.Reflection;
using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Domain.Entities;
using CuRoadmap.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CuRoadmap.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseDependency> CourseDependencies => Set<CourseDependency>();
    public DbSet<Major> Majors => Set<Major>();
    public DbSet<Specialization> Specializations => Set<Specialization>();
    public DbSet<Box> Boxes => Set<Box>();
    public DbSet<BoxEdge> BoxEdges => Set<BoxEdge>();
    public DbSet<Student> Students => Set<Student>();

    IQueryable<Course> IApplicationDbContext.Courses => Courses;
    IQueryable<CourseDependency> IApplicationDbContext.CourseDependencies => CourseDependencies;
    IQueryable<Major> IApplicationDbContext.Majors => Majors;
    IQueryable<Specialization> IApplicationDbContext.Specializations => Specializations;
    IQueryable<Box> IApplicationDbContext.Boxes => Boxes;
    IQueryable<BoxEdge> IApplicationDbContext.BoxEdges => BoxEdges;
    IQueryable<Student> IApplicationDbContext.Students => Students;

    void IApplicationDbContext.Add(object entity) => Add(entity);
    void IApplicationDbContext.Remove(object entity) => Remove(entity);

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
