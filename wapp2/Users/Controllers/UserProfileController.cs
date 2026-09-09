using Wapp2.Users.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wapp2.Shared.Security;
using Wapp2.Shared.DTOs;
using Wapp2.Users.DTOs;

namespace Wapp2.Users.Controllers
{
    [Route("api/user/profile")]
    [ApiController]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserProfileService _service;
        private readonly ICurrentUserService _currentUserService;

        public UserProfileController(
            IUserProfileService service,
            ICurrentUserService currentUserService
        )
        {
            _service = service;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> GetUserProfile()
        {
            var profile = await _service.GetUserProfile(_currentUserService.UserId);

            if (profile == null)
            {
                return NotFound(ApiResponse<UserProfileResponse>.Fail("Profile not found."));
            }

            return Ok(ApiResponse<UserProfileResponse>.Ok(
                profile,
                "Profile loaded successfully."
            ));
        }

        [HttpPut]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> UpdateUserProfile(
            [FromBody] UpdateUserProfileRequest request
        )
        {
            var profile = await _service.UpdateUserProfile(
                _currentUserService.UserId,
                request
            );

            if (profile == null)
            {
                return NotFound(ApiResponse<UserProfileResponse>.Fail("Profile not found."));
            }

            return Ok(ApiResponse<UserProfileResponse>.Ok(
                profile,
                "Profile updated successfully."
            ));
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteUserProfile()
        {
            var deleted = await _service.DeleteUserProfile(_currentUserService.UserId);

            if (!deleted)
            {
                return NotFound(ApiResponse<object>.Fail("Profile not found."));
            }

            return NoContent();
        }
    }
}
