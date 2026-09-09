using Wapp2.Users.DTOs;

namespace Wapp2.Users.Interfaces
{
    public interface IUserProfileService
    {
        Task<UserProfileResponse?> GetUserProfile(int userId);
        Task<UserProfileResponse?> UpdateUserProfile(int userId, UpdateUserProfileRequest request);
        Task<bool> DeleteUserProfile(int userId);
    }
}
