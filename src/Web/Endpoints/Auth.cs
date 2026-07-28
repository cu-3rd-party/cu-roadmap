using System.Security.Cryptography;
using System.Text;
using CuRoadmap.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace CuRoadmap.Web.Endpoints;

public class Auth : IEndpointGroup
{
    private static string _adminPasswordHash = string.Empty;

    public static void Map(RouteGroupBuilder group)
    {
        group.MapPost("/login", Login).AllowAnonymous();
        group.MapGet("/check", CheckAuth);
        group.MapDelete("/logout", Logout);
    }

    [EndpointSummary("Login with password")]
    public static async Task<Results<Ok<object>, UnauthorizedHttpResult>> Login(
        LoginRequest request,
        ICacheService cache,
        HttpContext httpContext)
    {
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Password)));
        if (string.IsNullOrEmpty(_adminPasswordHash) || hash != _adminPasswordHash)
            return TypedResults.Unauthorized();

        var token = Guid.NewGuid();
        await cache.CreateAuthTokenAsync(token, 3600);

        httpContext.Response.Cookies.Append("auth-token", token.ToString("N"), new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            MaxAge = TimeSpan.FromHours(1)
        });

        return TypedResults.Ok<object>(new { token = token.ToString("N") });
    }

    [EndpointSummary("Check authentication status")]
    public static async Task<Results<Ok<object>, UnauthorizedHttpResult>> CheckAuth(
        HttpContext httpContext,
        ICacheService cache)
    {
        var tokenStr = httpContext.Request.Cookies["auth-token"];
        if (string.IsNullOrEmpty(tokenStr) || !Guid.TryParse(tokenStr, out var token))
            return TypedResults.Unauthorized();

        var valid = await cache.CheckAuthTokenAsync(token);
        return valid
            ? TypedResults.Ok<object>(new { authenticated = true })
            : TypedResults.Unauthorized();
    }

    [EndpointSummary("Logout")]
    public static async Task<NoContent> Logout(
        HttpContext httpContext,
        ICacheService cache)
    {
        var tokenStr = httpContext.Request.Cookies["auth-token"];
        if (!string.IsNullOrEmpty(tokenStr) && Guid.TryParse(tokenStr, out var token))
        {
            await cache.DeleteAuthTokenAsync(token);
        }
        httpContext.Response.Cookies.Delete("auth-token");
        return TypedResults.NoContent();
    }
}

public record LoginRequest(string Password);
