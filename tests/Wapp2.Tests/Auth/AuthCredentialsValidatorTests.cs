using System.Net;
using Wapp2.Auth.Validation;
using Wapp2.Shared.Middleware;

namespace Wapp2.Tests.Auth;

public class AuthCredentialsValidatorTests
{
    [Fact]
    public void Validate_WithValidCredentials_ReturnsTrimmedEmail()
    {
        var email = AuthCredentialsValidator.Validate(
            "  person@example.com  ",
            "secret"
        );

        Assert.Equal("person@example.com", email);
    }

    [Theory]
    [InlineData(6)]
    [InlineData(20)]
    public void Validate_WithPasswordAtBoundary_AcceptsCredentials(int length)
    {
        var email = AuthCredentialsValidator.Validate(
            "person@example.com",
            new string('a', length)
        );

        Assert.Equal("person@example.com", email);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("person")]
    [InlineData("@example.com")]
    [InlineData("person@")]
    [InlineData("person@example")]
    [InlineData("person@example..com")]
    [InlineData("person @example.com")]
    public void Validate_WithInvalidEmail_ThrowsBadRequest(string? email)
    {
        var exception = Assert.Throws<ErrorHandlingMiddlewareException>(
            () => AuthCredentialsValidator.Validate(email, "secret")
        );

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.Equal(AuthCredentialsValidator.InvalidEmailMessage, exception.Message);
    }

    [Fact]
    public void Validate_WithNullPassword_ThrowsBadRequest()
    {
        var exception = Assert.Throws<ErrorHandlingMiddlewareException>(
            () => AuthCredentialsValidator.Validate("person@example.com", null)
        );

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.Equal(AuthCredentialsValidator.InvalidPasswordMessage, exception.Message);
    }

    [Theory]
    [InlineData(5)]
    [InlineData(21)]
    public void Validate_WithInvalidPasswordLength_ThrowsBadRequest(int length)
    {
        var exception = Assert.Throws<ErrorHandlingMiddlewareException>(
            () => AuthCredentialsValidator.Validate(
                "person@example.com",
                new string('a', length)
            )
        );

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.Equal(AuthCredentialsValidator.InvalidPasswordMessage, exception.Message);
    }
}
