using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Wapp2.Auth.Services;

namespace Wapp2.Tests.Auth;

public class JwtServiceTests
{
    private const string Secret = "test-only-secret-with-at-least-32-characters";
    private const string Issuer = "Wapp2.Tests";
    private const string Audience = "Wapp2.Tests.Client";

    [Fact]
    public void GenerateToken_WithValidConfiguration_CreatesValidIdentityToken()
    {
        var service = new JwtService(CreateConfiguration());
        var issuedAfter = DateTime.UtcNow;

        var encodedToken = service.GenerateToken(
            userId: 42,
            email: "person@example.com",
            roles: ["User", "Admin"]
        );

        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(
            encodedToken,
            CreateValidationParameters(),
            out var validatedToken
        );
        var jwt = Assert.IsType<JwtSecurityToken>(validatedToken);

        Assert.Equal(Issuer, jwt.Issuer);
        Assert.Contains(Audience, jwt.Audiences);
        Assert.Equal(SecurityAlgorithms.HmacSha256, jwt.Header.Alg);
        Assert.Equal("42", principal.FindFirstValue(ClaimTypes.NameIdentifier));
        Assert.Equal("person@example.com", principal.FindFirstValue(ClaimTypes.Email));
        Assert.True(principal.IsInRole("User"));
        Assert.True(principal.IsInRole("Admin"));
        Assert.InRange(
            jwt.ValidTo,
            issuedAfter.AddHours(2).AddSeconds(-1),
            DateTime.UtcNow.AddHours(2).AddSeconds(1)
        );
    }

    [Theory]
    [InlineData("Jwt:Secret", "Jwt:Secret is not configured.")]
    [InlineData("Jwt:Issuer", "Jwt:Issuer is not configured.")]
    [InlineData("Jwt:Audience", "Jwt:Audience is not configured.")]
    public void GenerateToken_WhenRequiredSettingIsMissing_Throws(
        string missingSetting,
        string expectedMessage
    )
    {
        var service = new JwtService(CreateConfiguration(missingSetting));

        var exception = Assert.Throws<InvalidOperationException>(
            () => service.GenerateToken(42, "person@example.com", ["User"])
        );

        Assert.Equal(expectedMessage, exception.Message);
    }

    private static IConfiguration CreateConfiguration(string? settingToOmit = null)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = Secret,
            ["Jwt:Issuer"] = Issuer,
            ["Jwt:Audience"] = Audience
        };

        if (settingToOmit != null)
        {
            settings.Remove(settingToOmit);
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }

    private static TokenValidationParameters CreateValidationParameters()
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Issuer,
            ValidAudience = Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret)),
            ClockSkew = TimeSpan.Zero
        };
    }
}
