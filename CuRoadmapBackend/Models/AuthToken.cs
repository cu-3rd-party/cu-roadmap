namespace CuRoadmapBackend.Models;

public sealed class AuthToken
{
    public Guid Token { get; set; } = Guid.NewGuid();
    public long Ttl { get; set; }
}
