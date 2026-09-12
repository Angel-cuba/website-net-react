using System.Net;
using Wapp2.Shared.Middleware;
using Wapp2.Tests.TestDoubles;
using Wapp2.Users.DTOs;
using Wapp2.Users.Models;
using Wapp2.Users.Services;

namespace Wapp2.Tests.Users;

public class UserAccountServiceTests
{
    [Fact]
    public async Task DeleteAccount_WhenUserDoesNotExist_ThrowsNotFound()
    {
        var repository = new UserRepositoryStub();
        var service = new UserAccountService(repository);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.DeleteAccount(42, CreateRequest("Password-1"))
        );

        Assert.Equal(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.Equal(42, repository.LastUserIdLookup);
        Assert.Equal(0, repository.DeleteUserCallCount);
    }

    [Fact]
    public async Task DeleteAccount_WhenPasswordIsInvalid_ThrowsForbidden()
    {
        var repository = new UserRepositoryStub
        {
            UserById = CreateUser("Correct-password-1")
        };
        var service = new UserAccountService(repository);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.DeleteAccount(42, CreateRequest("Wrong-password-1"))
        );

        Assert.Equal(HttpStatusCode.Forbidden, exception.StatusCode);
        Assert.Equal(0, repository.DeleteUserCallCount);
    }

    [Fact]
    public async Task DeleteAccount_WhenRepositoryCannotDelete_ThrowsNotFound()
    {
        var repository = new UserRepositoryStub
        {
            UserById = CreateUser("Correct-password-1"),
            DeleteResult = false
        };
        var service = new UserAccountService(repository);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.DeleteAccount(42, CreateRequest("Correct-password-1"))
        );

        Assert.Equal(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.Equal(1, repository.DeleteUserCallCount);
        Assert.Equal(42, repository.DeletedUserId);
    }

    [Fact]
    public async Task DeleteAccount_WithValidPassword_DeletesAuthenticatedUser()
    {
        var repository = new UserRepositoryStub
        {
            UserById = CreateUser("Correct-password-1"),
            DeleteResult = true
        };
        var service = new UserAccountService(repository);

        await service.DeleteAccount(42, CreateRequest("Correct-password-1"));

        Assert.Equal(42, repository.LastUserIdLookup);
        Assert.Equal(1, repository.DeleteUserCallCount);
        Assert.Equal(42, repository.DeletedUserId);
    }

    private static DeleteAccountRequest CreateRequest(string password)
    {
        return new DeleteAccountRequest { Password = password };
    }

    private static UserModel CreateUser(string password)
    {
        return new UserModel
        {
            Id = 42,
            Email = "person@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
        };
    }
}
