namespace CuRoadmap.Application.Common.Interfaces;

public interface ICacheService
{
    Task<bool> CheckAuthTokenAsync(Guid token, CancellationToken ct = default);
    Task CreateAuthTokenAsync(Guid token, int ttlSeconds, CancellationToken ct = default);
    Task DeleteAuthTokenAsync(Guid token, CancellationToken ct = default);
    Task<byte[]?> GetAsync(string key, CancellationToken ct = default);
    Task SetAsync(string key, byte[] value, int ttlSeconds, CancellationToken ct = default);
    Task DeleteByPrefixAsync(string prefix, CancellationToken ct = default);
    Task<(bool Allowed, double RetryAfter)> CheckRateLimitAsync(string key, int capacity, double refillPerSecond, CancellationToken ct = default);
}
