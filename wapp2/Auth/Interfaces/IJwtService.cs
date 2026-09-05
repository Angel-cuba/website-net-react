namespace Wapp2.Auth.Interfaces;

public interface IJwtService
{
    string GenerateToken(int userId, string email, IEnumerable<string> roles);
}