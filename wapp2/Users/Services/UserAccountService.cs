using System.Net;
using Wapp2.Shared.Middleware;
using Wapp2.Users.DTOs;
using Wapp2.Users.Interfaces;

namespace Wapp2.Users.Services;

public class UserAccountService(IUserRepository userRepository) : IUserAccountService
{
    public async Task DeleteAccount(int userId, DeleteAccountRequest request)
    {
        var user = await userRepository.GetUser(userId);

        if (user == null)
        {
            throw new ErrorHandlingMiddlewareException(
                "User account not found.",
                HttpStatusCode.NotFound
            );
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new ErrorHandlingMiddlewareException(
                "Invalid password.",
                HttpStatusCode.Forbidden
            );
        }

        var deleted = await userRepository.DeleteUserAndRelatedData(userId);

        if (!deleted)
        {
            throw new ErrorHandlingMiddlewareException(
                "User account not found.",
                HttpStatusCode.NotFound
            );
        }
    }
}
