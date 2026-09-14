using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Wapp2.Tests.TestDoubles;
using Wapp2.Shared.Health;
using Wapp2.Users.Interfaces;

namespace Wapp2.Tests.Integration;

internal sealed class Wapp2WebApplicationFactory(
    UserRepositoryStub userRepository,
    UserProfileServiceStub userProfileService,
    IDatabaseHealthProbe? databaseHealthProbe = null
) : WebApplicationFactory<Program>
{
    public const string JwtSecret = "http-test-secret-with-at-least-32-characters";
    public const string JwtIssuer = "Wapp2.HttpTests";
    public const string JwtAudience = "Wapp2.HttpTests.Client";
    public const string CorsAllowedOrigin = "https://frontend.example.test";

    static Wapp2WebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("Jwt__Secret", JwtSecret);
        Environment.SetEnvironmentVariable("Jwt__Issuer", JwtIssuer);
        Environment.SetEnvironmentVariable("Jwt__Audience", JwtAudience);
        Environment.SetEnvironmentVariable("Cors__AllowedOrigins__0", CorsAllowedOrigin);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = JwtSecret,
                ["Jwt:Issuer"] = JwtIssuer,
                ["Jwt:Audience"] = JwtAudience,
                ["Cors:AllowedOrigins:0"] = CorsAllowedOrigin
            });
        });
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IUserRepository>();
            services.RemoveAll<IUserProfileService>();
            services.RemoveAll<IDatabaseHealthProbe>();
            services.AddSingleton<IUserRepository>(userRepository);
            services.AddSingleton<IUserProfileService>(userProfileService);
            services.AddSingleton(
                databaseHealthProbe ?? new DatabaseHealthProbeStub()
            );
        });
    }
}
