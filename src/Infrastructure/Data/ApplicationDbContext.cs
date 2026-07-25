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

    public DbSet<TodoList> TodoLists => Set<TodoList>();
    public DbSet<TodoItem> TodoItems => Set<TodoItem>();

    IQueryable<TodoList> IApplicationDbContext.TodoLists => TodoLists;
    IQueryable<TodoItem> IApplicationDbContext.TodoItems => TodoItems;

    void IApplicationDbContext.Add(object entity) => Add(entity);
    void IApplicationDbContext.Remove(object entity) => Remove(entity);

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
