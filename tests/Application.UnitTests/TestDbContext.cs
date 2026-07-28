using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Domain.Entities;
using CuRoadmap.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CuRoadmap.Application.UnitTests;

public static class TestDbContextFactory
{
    private static readonly object _lock = new();
    private static int _dbCounter;

    public static ApplicationDbContext Create()
    {
        lock (_lock)
        {
            _dbCounter++;
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase($"TestDb_{_dbCounter}_{Guid.NewGuid():N}")
                .Options;
            return new ApplicationDbContext(options);
        }
    }
}
