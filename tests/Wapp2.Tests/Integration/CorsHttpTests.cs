using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Wapp2.Tests.TestDoubles;

namespace Wapp2.Tests.Integration;

public class CorsHttpTests
{
    [Fact]
    public async Task Preflight_FromAllowedOrigin_ReturnsCorsHeaders()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);
        using var request = CreatePreflightRequest(
            Wapp2WebApplicationFactory.CorsAllowedOrigin
        );

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(
            response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins)
        );
        Assert.Equal(
            [Wapp2WebApplicationFactory.CorsAllowedOrigin],
            origins
        );
    }

    [Fact]
    public async Task Preflight_FromUnconfiguredOrigin_DoesNotReturnCorsHeaders()
    {
        using var factory = CreateFactory();
        using var client = CreateClient(factory);
        using var request = CreatePreflightRequest("https://untrusted.example.test");

        var response = await client.SendAsync(request);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    private static Wapp2WebApplicationFactory CreateFactory()
    {
        return new Wapp2WebApplicationFactory(
            new UserRepositoryStub(),
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

    private static HttpRequestMessage CreatePreflightRequest(string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/user/profile");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "GET");
        return request;
    }
}
