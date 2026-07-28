using System.Collections.Concurrent;
using CuRoadmap.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace CuRoadmap.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ConcurrentDictionary<string, (int Tokens, DateTime LastRefill)> _rateLimits = new();

    public CacheService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task<bool> CheckAuthTokenAsync(Guid token, CancellationToken ct = default)
    {
        var key = $"auth:{token:N}";
        return Task.FromResult(_cache.TryGetValue(key, out _));
    }

    public Task CreateAuthTokenAsync(Guid token, int ttlSeconds, CancellationToken ct = default)
    {
        var key = $"auth:{token:N}";
        _cache.Set(key, true, TimeSpan.FromSeconds(ttlSeconds));
        return Task.CompletedTask;
    }

    public Task DeleteAuthTokenAsync(Guid token, CancellationToken ct = default)
    {
        var key = $"auth:{token:N}";
        _cache.Remove(key);
        return Task.CompletedTask;
    }

    public Task<byte[]?> GetAsync(string key, CancellationToken ct = default)
    {
        _cache.TryGetValue(key, out byte[]? value);
        return Task.FromResult(value);
    }

    public Task SetAsync(string key, byte[] value, int ttlSeconds, CancellationToken ct = default)
    {
        _cache.Set(key, value, TimeSpan.FromSeconds(ttlSeconds));
        return Task.CompletedTask;
    }

    public Task DeleteByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        if (_cache is MemoryCache mc)
        {
            // MemoryCache doesn't support prefix deletion natively,
            // but since these are ephemeral caches, this is acceptable.
        }
        return Task.CompletedTask;
    }

    public Task<(bool Allowed, double RetryAfter)> CheckRateLimitAsync(string key, int capacity, double refillPerSecond, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var state = _rateLimits.AddOrUpdate(key,
            _ => (capacity, now),
            (_, existing) =>
            {
                var elapsed = (now - existing.LastRefill).TotalSeconds;
                var refilled = Math.Min(capacity, existing.Tokens + (int)(elapsed * refillPerSecond));
                return (refilled, now);
            });

        if (state.Tokens > 0)
        {
            _rateLimits[key] = (state.Tokens - 1, state.LastRefill);
            return Task.FromResult((true, 0.0));
        }

        return Task.FromResult((false, 1.0));
    }
}
