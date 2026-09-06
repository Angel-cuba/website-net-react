using System.Net;
using Wapp2.Auth.Interfaces;
using Wapp2.Auth.DTOs;
using Wapp2.Users.Interfaces;
using Wapp2.Users.Models;
using Wapp2.Shared.Middleware;

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
                throw new ErrorHandlingMiddlewareException("User already exists.", HttpStatusCode.Conflict);
            }

            var user = new UserModel
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            var firstName = request.Email.Split('@')[0];

            var createdUser = await userRepository.CreateUserWithProfileAndRole(
                user,
                firstName,
                "User"
            );

            var roles = await userRepository.GetRolesByUserId(createdUser.Id);
            var token = jwtService.GenerateToken(createdUser.Id, createdUser.Email, roles);

            return new AuthResponse { Token = token };
        }

        public async Task<AuthResponse> Login(LoginRequest request)
        {
            var user = await userRepository.GetUserByEmail(request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                throw new ErrorHandlingMiddlewareException("Invalid email or password.", HttpStatusCode.Unauthorized);
            }
            var roles = await userRepository.GetRolesByUserId(user.Id);
            var token = jwtService.GenerateToken(user.Id, user.Email, roles);
            return new AuthResponse { Token = token };
        }
    }

}
