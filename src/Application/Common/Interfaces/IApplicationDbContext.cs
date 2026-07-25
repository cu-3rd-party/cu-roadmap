using CuRoadmap.Domain.Entities;

namespace CuRoadmap.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    IQueryable<TodoList> TodoLists { get; }
    IQueryable<TodoItem> TodoItems { get; }
    IQueryable<ShortenedUrl> ShortenedUrls { get; }
    IQueryable<OutboxMessage> OutboxMessages { get; }

    void Add(object entity);
    void Remove(object entity);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
