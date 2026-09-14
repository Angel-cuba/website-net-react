using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Wapp2.Tests.TestDoubles;

namespace Wapp2.Tests.Integration;

public class HealthHttpTests
{
    [Fact]
    public async Task Liveness_DoesNotProbeDatabase()
    {
        var databaseProbe = new DatabaseHealthProbeStub
        {
            ExceptionToThrow = new InvalidOperationException("Database is unavailable.")
        };
        using var factory = CreateFactory(databaseProbe);
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/health/live");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
        Assert.Equal(0, databaseProbe.CheckCallCount);
    }

    [Fact]
    public async Task Readiness_WhenDatabaseIsAvailable_ReturnsHealthy()
    {
        var databaseProbe = new DatabaseHealthProbeStub();
        using var factory = CreateFactory(databaseProbe);
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync());
        Assert.Equal(1, databaseProbe.CheckCallCount);
    }

    [Fact]
    public async Task Readiness_WhenDatabaseIsUnavailable_ReturnsUnhealthyWithoutDetails()
    {
        const string sensitiveDetail = "Password=should-not-be-exposed";
        var databaseProbe = new DatabaseHealthProbeStub
        {
            ExceptionToThrow = new InvalidOperationException(sensitiveDetail)
        };
        using var factory = CreateFactory(databaseProbe);
        using var client = CreateClient(factory);

        var response = await client.GetAsync("/health/ready");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("Unhealthy", body);
        Assert.DoesNotContain(sensitiveDetail, body, StringComparison.Ordinal);
        Assert.Equal(1, databaseProbe.CheckCallCount);
    }

    private static Wapp2WebApplicationFactory CreateFactory(
        DatabaseHealthProbeStub databaseProbe
    )
    {
        return new Wapp2WebApplicationFactory(
            new UserRepositoryStub(),
            new UserProfileServiceStub(),
            databaseProbe
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
}
