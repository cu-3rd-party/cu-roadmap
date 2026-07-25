using CuRoadmap.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CuRoadmap.Web.Endpoints;

public class Users : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.MapIdentityApi<ApplicationUser>();

        group.MapPost("/logout", Logout).RequireAuthorization();
    }

    [EndpointSummary("Log out")]
    public static async Task<Results<Ok, UnauthorizedHttpResult>> Logout(SignInManager<ApplicationUser> signInManager, [FromBody] object? empty)
    {
        if (empty != null)
        {
            await signInManager.SignOutAsync();
            return TypedResults.Ok();
        }

        return TypedResults.Unauthorized();
    }
}
