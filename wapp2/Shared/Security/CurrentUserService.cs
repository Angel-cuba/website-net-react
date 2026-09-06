using System.Net;
using System.Security.Claims;
using Wapp2.Shared.Middleware;

namespace Wapp2.Shared.Security;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public int UserId
    {
        get
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdClaim, out var userId))
            {
                throw new ErrorHandlingMiddlewareException("User is not authenticated.", HttpStatusCode.Unauthorized);
            }

            return userId;
        }
    }

    public string Email
    {
        get
        {
            var email = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);

            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ErrorHandlingMiddlewareException("User is not authenticated.", HttpStatusCode.Unauthorized);
            }

            return email;
        }
    }
}
