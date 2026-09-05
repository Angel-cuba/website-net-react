using Microsoft.AspNetCore.Mvc;
using Wapp2.Auth.Interfaces;
using Wapp2.Auth.DTOs;
using Wapp2.Shared.DTOs;

namespace Wapp2.Auth.Controllers
{
    [Route("api/auth/")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Register(RegisterRequest request)
        {
            var response = await _authService.Register(request);

            return Ok(ApiResponse<AuthResponse>.Ok(response, "User registered successfully."));
        }
    }
}
