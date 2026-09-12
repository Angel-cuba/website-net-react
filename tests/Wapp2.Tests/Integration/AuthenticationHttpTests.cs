using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Wapp2.Auth.Services;
using Wapp2.Tests.TestDoubles;
using Wapp2.Users.DTOs;
using Wapp2.Users.Models;

namespace Wapp2.Tests.Integration;

public class AuthenticationHttpTests
{
    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsJsonUnauthorized()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/api/user/profile");

        await AssertUnauthorizedResponse(response);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithInvalidSignature_ReturnsJsonUnauthorized()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            CreateToken(secret: "different-test-secret-with-at-least-32-characters")
        );

        var response = await client.GetAsync("/api/user/profile");

        await AssertUnauthorizedResponse(response);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithExpiredToken_ReturnsJsonUnauthorized()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            CreateToken(expiresAt: DateTime.UtcNow.AddMinutes(-1))
        );

        var response = await client.GetAsync("/api/user/profile");

        await AssertUnauthorizedResponse(response);
    }

    [Fact]
    public async Task ProtectedEndpoint_WhenTokenUserWasDeleted_ReturnsJsonUnauthorized()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            CreateProductionToken()
        );

        var response = await client.GetAsync("/api/user/profile");

        await AssertUnauthorizedResponse(response);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithValidToken_UsesClaimedUserIdentity()
    {
        var users = new UserRepositoryStub
        {
            UserById = new UserModel { Id = 42, Email = "person@example.com" }
        };
        var profiles = new UserProfileServiceStub
        {
            ProfileToGet = new UserProfileResponse
            {
                FirstName = "Ada",
                LastName = "Lovelace"
            }
        };
        using var factory = new Wapp2WebApplicationFactory(users, profiles);
        using var client = CreateClient(factory);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            CreateProductionToken()
        );

        var response = await client.GetAsync("/api/user/profile");
        var body = await ParseBody(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(body.RootElement.GetProperty("success").GetBoolean());
        Assert.Equal("Ada", body.RootElement.GetProperty("data").GetProperty("firstName").GetString());
        Assert.Equal(42, users.LastUserIdLookup);
        Assert.Equal(42, profiles.LastGetUserId);
    }

    [Fact]
    public async Task ProtectedHttpEndpoint_DoesNotAcceptTokenFromQueryString()
    {
        var users = new UserRepositoryStub
        {
            UserById = new UserModel { Id = 42, Email = "person@example.com" }
        };
        using var factory = CreateFactory(users);
        using var client = CreateClient(factory);
        var token = Uri.EscapeDataString(CreateProductionToken());

        var response = await client.GetAsync($"/api/user/profile?access_token={token}");

        await AssertUnauthorizedResponse(response);
        Assert.Null(users.LastUserIdLookup);
    }

    [Fact]
    public async Task SignalRNegotiate_AcceptsValidTokenFromQueryString()
    {
        var users = new UserRepositoryStub
        {
            UserById = new UserModel { Id = 42, Email = "person@example.com" }
        };
        using var factory = CreateFactory(users);
        using var client = CreateClient(factory);
        var token = Uri.EscapeDataString(CreateProductionToken());

        var response = await client.PostAsync(
            $"/hubs/notifications/negotiate?negotiateVersion=1&access_token={token}",
            content: null
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(42, users.LastUserIdLookup);
    }

    private static Wapp2WebApplicationFactory CreateFactory(
        UserRepositoryStub? users = null
    )
    {
        return new Wapp2WebApplicationFactory(
            users ?? new UserRepositoryStub(),
            new UserProfileServiceStub()
        );
    }

    private static HttpClient CreateClient(Wapp2WebApplicationFactory factory)
    {
        return factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false
        });
    }

    private static string CreateProductionToken()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = Wapp2WebApplicationFactory.JwtSecret,
                ["Jwt:Issuer"] = Wapp2WebApplicationFactory.JwtIssuer,
                ["Jwt:Audience"] = Wapp2WebApplicationFactory.JwtAudience
            })
            .Build();

        return new JwtService(configuration).GenerateToken(
            userId: 42,
            email: "person@example.com",
            roles: ["User"]
        );
    }

    private static string CreateToken(
        string secret = Wapp2WebApplicationFactory.JwtSecret,
        DateTime? expiresAt = null
    )
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42"),
            new Claim(ClaimTypes.Email, "person@example.com"),
            new Claim(ClaimTypes.Role, "User")
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            SecurityAlgorithms.HmacSha256
        );
        var token = new JwtSecurityToken(
            issuer: Wapp2WebApplicationFactory.JwtIssuer,
            audience: Wapp2WebApplicationFactory.JwtAudience,
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-5),
            expires: expiresAt ?? DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static async Task AssertUnauthorizedResponse(HttpResponseMessage response)
    {
        var body = await ParseBody(response);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        Assert.False(body.RootElement.GetProperty("success").GetBoolean());
        Assert.Equal(
            "Authentication is required.",
            body.RootElement.GetProperty("message").GetString()
        );
        Assert.Equal(JsonValueKind.Null, body.RootElement.GetProperty("data").ValueKind);
    }

    private static async Task<JsonDocument> ParseBody(HttpResponseMessage response)
    {
        return JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    }
}
