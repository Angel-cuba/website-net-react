using Wapp2.Users.DTOs;
using Wapp2.Users.Interfaces;
using Wapp2.Users.Models;

namespace Wapp2.Users.Services
{
    public class UserProfileService(IUserProfileRepository userProfileRepository)
        : IUserProfileService
    {
        public async Task<UserProfileResponse?> GetUserProfile(int userId)
        {
            var profile = await userProfileRepository.GetUserProfile(userId);
            return profile == null ? null : MapToResponse(profile);
        }

        public async Task<UserProfileResponse?> UpdateUserProfile(
            int userId,
            UpdateUserProfileRequest request
        )
        {
            var profile = await userProfileRepository.UpdateUserProfile(userId, request);
            return profile == null ? null : MapToResponse(profile);
        }

        public Task<bool> DeleteUserProfile(int userId)
        {
            return userProfileRepository.DeleteUserProfile(userId);
        }

        private static UserProfileResponse MapToResponse(UserProfileModel profile)
        {
            return new UserProfileResponse
            {
                FirstName = profile.FirstName ?? string.Empty,
                LastName = profile.LastName ?? string.Empty,
                AvatarUrl = profile.AvatarUrl,
                Bio = profile.Bio
            };
        }
    }
}
