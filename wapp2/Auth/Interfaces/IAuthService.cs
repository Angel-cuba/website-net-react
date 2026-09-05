using Wapp2.Auth.DTOs;

namespace Wapp2.Auth.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> Login(LoginRequest loginRequest);
        Task<AuthResponse> Register(RegisterRequest registerRequest);
    }
}
