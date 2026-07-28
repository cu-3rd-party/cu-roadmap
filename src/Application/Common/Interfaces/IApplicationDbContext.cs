using CuRoadmap.Domain.Entities;

namespace CuRoadmap.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    IQueryable<Course> Courses { get; }
    IQueryable<CourseDependency> CourseDependencies { get; }
    IQueryable<Major> Majors { get; }
    IQueryable<Specialization> Specializations { get; }
    IQueryable<Box> Boxes { get; }
    IQueryable<BoxEdge> BoxEdges { get; }
    IQueryable<Student> Students { get; }

    void Add(object entity);
    void Remove(object entity);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
