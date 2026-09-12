using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Wapp2.Tests.TestDoubles;
using Wapp2.Users.Interfaces;

namespace Wapp2.Tests.Integration;

internal sealed class Wapp2WebApplicationFactory(
    UserRepositoryStub userRepository,
    UserProfileServiceStub userProfileService
) : WebApplicationFactory<Program>
{
    public const string JwtSecret = "http-test-secret-with-at-least-32-characters";
    public const string JwtIssuer = "Wapp2.HttpTests";
    public const string JwtAudience = "Wapp2.HttpTests.Client";

    static Wapp2WebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("Jwt__Secret", JwtSecret);
        Environment.SetEnvironmentVariable("Jwt__Issuer", JwtIssuer);
        Environment.SetEnvironmentVariable("Jwt__Audience", JwtAudience);
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
                ["Jwt:Audience"] = JwtAudience
            });
        });
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IUserRepository>();
            services.RemoveAll<IUserProfileService>();
            services.AddSingleton<IUserRepository>(userRepository);
            services.AddSingleton<IUserProfileService>(userProfileService);
        });
    }
}
