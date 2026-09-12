using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Wapp2.Shared.Middleware;
using Wapp2.Shared.Security;

namespace Wapp2.Tests.Security;

public class CurrentUserServiceTests
{
    [Fact]
    public void AuthenticatedUser_ReturnsIdAndEmailFromClaims()
    {
        var service = CreateService(
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Email, "person@example.com")
        );

        Assert.Equal(42, service.UserId);
        Assert.Equal("person@example.com", service.Email);
    }

    [Fact]
    public void UserId_WhenClaimIsInvalid_ThrowsUnauthorized()
    {
        var service = CreateService(
            new Claim(ClaimTypes.NameIdentifier, "not-an-id"),
            new Claim(ClaimTypes.Email, "person@example.com")
        );

        var exception = Assert.Throws<ErrorHandlingMiddlewareException>(() => service.UserId);

        Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
    }

    [Fact]
    public void Email_WhenClaimIsMissing_ThrowsUnauthorized()
    {
        var service = CreateService(new Claim(ClaimTypes.NameIdentifier, "42"));

        var exception = Assert.Throws<ErrorHandlingMiddlewareException>(() => service.Email);

        Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
    }

    [Fact]
    public void Email_WhenClaimIsBlank_ThrowsUnauthorized()
    {
        var service = CreateService(
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Email, "   ")
        );

        var exception = Assert.Throws<ErrorHandlingMiddlewareException>(() => service.Email);

        Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
    }

    [Fact]
    public void UserId_WhenHttpContextIsMissing_ThrowsUnauthorized()
    {
        var service = new CurrentUserService(new HttpContextAccessor());

        var exception = Assert.Throws<ErrorHandlingMiddlewareException>(() => service.UserId);

        Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
    }

    [Fact]
    public void Email_WhenHttpContextIsMissing_ThrowsUnauthorized()
    {
        var service = new CurrentUserService(new HttpContextAccessor());

        var exception = Assert.Throws<ErrorHandlingMiddlewareException>(() => service.Email);

        Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
    }

    private static CurrentUserService CreateService(params Claim[] claims)
    {
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
        };
        var accessor = new HttpContextAccessor { HttpContext = context };

        return new CurrentUserService(accessor);
    }
}
