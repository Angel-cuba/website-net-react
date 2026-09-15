using System.Net;
using Wapp2.Shared.Middleware;

namespace Wapp2.Auth.Validation;

public static class AuthCredentialsValidator
{
    public const int PasswordMinLength = 6;
    public const int PasswordMaxLength = 20;
    public const string InvalidEmailMessage = "Enter a valid email address.";
    public const string InvalidPasswordMessage =
        "Password must be between 6 and 20 characters.";

    public static string Validate(string? email, string? password)
    {
        var normalizedEmail = email?.Trim() ?? string.Empty;

        if (!HasValidEmailFormat(normalizedEmail))
        {
            throw new ErrorHandlingMiddlewareException(
                InvalidEmailMessage,
                HttpStatusCode.BadRequest
            );
        }

        if (password is null ||
            password.Length < PasswordMinLength ||
            password.Length > PasswordMaxLength)
        {
            throw new ErrorHandlingMiddlewareException(
                InvalidPasswordMessage,
                HttpStatusCode.BadRequest
            );
        }

        return normalizedEmail;
    }

    private static bool HasValidEmailFormat(string email)
    {
        if (email.Length == 0 || email.Any(char.IsWhiteSpace))
        {
            return false;
        }

        var atPosition = email.IndexOf('@');

        if (atPosition <= 0 ||
            atPosition != email.LastIndexOf('@') ||
            atPosition == email.Length - 1)
        {
            return false;
        }

        var domainParts = email[(atPosition + 1)..].Split('.');

        return domainParts.Length >= 2 && domainParts.All(part => part.Length > 0);
    }
}
