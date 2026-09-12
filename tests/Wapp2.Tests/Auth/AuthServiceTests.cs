using System.Net;
using Wapp2.Auth.DTOs;
using Wapp2.Auth.Interfaces;
using Wapp2.Auth.Services;
using Wapp2.Shared.Middleware;
using Wapp2.Tests.TestDoubles;
using Wapp2.Users.Models;

namespace Wapp2.Tests.Auth;

public class AuthServiceTests
{
    [Fact]
    public async Task Register_WhenEmailAlreadyExists_ThrowsConflict()
    {
        var repository = new UserRepositoryStub
        {
            UserByEmail = CreateUser(password: "Existing-password-1")
        };
        var jwtService = new RecordingJwtService();
        var service = new AuthService(jwtService, repository);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.Register(new RegisterRequest
            {
                Email = "person@example.com",
                Password = "New-password-1"
            })
        );

        Assert.Equal(HttpStatusCode.Conflict, exception.StatusCode);
        Assert.Equal(0, repository.CreateUserCallCount);
        Assert.Equal(0, jwtService.GenerateTokenCallCount);
    }

    [Fact]
    public async Task Register_WithNewEmail_CreatesProfileAndRoleThenReturnsToken()
    {
        var repository = new UserRepositoryStub
        {
            CreatedUser = new UserModel { Id = 42, Email = "person@example.com" },
            Roles = ["User"]
        };
        var jwtService = new RecordingJwtService();
        var service = new AuthService(jwtService, repository);

        var response = await service.Register(new RegisterRequest
        {
            Email = "person@example.com",
            Password = "New-password-1"
        });

        Assert.Equal("generated-token", response.Token);
        Assert.Equal(1, repository.CreateUserCallCount);
        Assert.Equal("person", repository.LastCreatedFirstName);
        Assert.Equal("User", repository.LastCreatedRoleName);
        Assert.Equal("person@example.com", repository.LastCreatedUser?.Email);
        Assert.NotEqual("New-password-1", repository.LastCreatedUser?.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify(
            "New-password-1",
            repository.LastCreatedUser?.PasswordHash
        ));
        Assert.Equal(42, repository.RolesRequestedForUserId);
        Assert.Equal(42, jwtService.UserId);
        Assert.Equal("person@example.com", jwtService.Email);
        Assert.Equal(["User"], jwtService.Roles);
    }

    [Fact]
    public async Task Login_WhenUserDoesNotExist_ThrowsUnauthorized()
    {
        var repository = new UserRepositoryStub();
        var jwtService = new RecordingJwtService();
        var service = new AuthService(jwtService, repository);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.Login(new LoginRequest
            {
                Email = "missing@example.com",
                Password = "Password-1"
            })
        );

        Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
        Assert.Equal(0, jwtService.GenerateTokenCallCount);
    }

    [Fact]
    public async Task Login_WhenPasswordIsInvalid_ThrowsUnauthorized()
    {
        var repository = new UserRepositoryStub
        {
            UserByEmail = CreateUser(password: "Correct-password-1")
        };
        var jwtService = new RecordingJwtService();
        var service = new AuthService(jwtService, repository);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.Login(new LoginRequest
            {
                Email = "person@example.com",
                Password = "Wrong-password-1"
            })
        );

        Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
        Assert.Equal(0, jwtService.GenerateTokenCallCount);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokenWithCurrentRoles()
    {
        var repository = new UserRepositoryStub
        {
            UserByEmail = CreateUser(password: "Correct-password-1"),
            Roles = ["User", "Admin"]
        };
        var jwtService = new RecordingJwtService();
        var service = new AuthService(jwtService, repository);

        var response = await service.Login(new LoginRequest
        {
            Email = "person@example.com",
            Password = "Correct-password-1"
        });

        Assert.Equal("generated-token", response.Token);
        Assert.Equal(42, repository.RolesRequestedForUserId);
        Assert.Equal(42, jwtService.UserId);
        Assert.Equal("person@example.com", jwtService.Email);
        Assert.Equal(["User", "Admin"], jwtService.Roles);
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

    private sealed class RecordingJwtService : IJwtService
    {
        public int GenerateTokenCallCount { get; private set; }
        public int? UserId { get; private set; }
        public string? Email { get; private set; }
        public IReadOnlyList<string> Roles { get; private set; } = [];

        public string GenerateToken(int userId, string email, IEnumerable<string> roles)
        {
            GenerateTokenCallCount++;
            UserId = userId;
            Email = email;
            Roles = roles.ToArray();
            return "generated-token";
        }
    }
}
