using Wapp2.Auth.Interfaces;
using Wapp2.Auth.DTOs;
using Wapp2.Users.Interfaces;
using Wapp2.Users.Models;

namespace Wapp2.Auth.Services
{
    public class AuthService : IAuthService
    {
        private readonly IJwtService jwtService;
        private readonly IUserRepository userRepository;

        public AuthService(IJwtService jwtService, IUserRepository userRepository)
        {
            this.jwtService = jwtService;
            this.userRepository = userRepository;
        }

        public async Task<AuthResponse> Register(RegisterRequest request)
        {
            var existingUser = await userRepository.GetUserByEmail(request.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException("User already exists.");
            }

            var user = new UserModel
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            var createdUser = await userRepository.CreateUser(user);
            var token = jwtService.GenerateToken(createdUser.Id, createdUser.Email, Array.Empty<string>());

            return new AuthResponse { Token = token };
        }

        public async Task<AuthResponse> Login(LoginRequest request)
        {
            var user = await userRepository.GetUserByEmail(request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid credentials.");
            }
            var token = jwtService.GenerateToken(user.Id, user.Email, Array.Empty<string>());
            return new AuthResponse { Token = token };
        }
    }

}
