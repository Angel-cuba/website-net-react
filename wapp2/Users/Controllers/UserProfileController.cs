using Wapp2.Users.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wapp2.Shared.Security;
using Wapp2.Users.DTOs;

namespace Wapp2.Users.Controllers
{
    [Route("api/user/profile/")]
    [ApiController]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserProfileRepository userProfileRepository;
        private readonly ICurrentUserService currentUserService;


        [HttpGet("{userId:int}")]
        public async Task<IActionResult> GetUserProfile(int userId)
        {
            var userProfile = await userProfileRepository.GetUserProfile(userId);
            if (userProfile == null)
            {
                return NotFound();
            }
            return Ok(userProfile);
        }  
        [HttpPut("update")]
        public async Task<IActionResult> UpdateUserProfile([FromBody] UpdateUserProfileRequest userProfile)
        {
            var updatedUserProfile = await userProfileRepository.UpdateUserProfile(userProfile);
            return Ok(updatedUserProfile);
        }
        [HttpDelete("{userId:int}")]
        public async Task<IActionResult> DeleteUserProfile(int userId)
        {
            await userProfileRepository.DeleteUserProfile(userId);
            return NoContent();
        }
    }
}