using Wapp2.Users.Models;
using Wapp2.Users.DTOs;

namespace Wapp2.Users.Interfaces
{
    public interface IUserProfileRepository
    {
        Task<UserProfileModel?> GetUserProfile(int userId);
        Task<UserProfileModel?> UpdateUserProfile(int userId, UpdateUserProfileRequest request);
        Task<bool> DeleteUserProfile(int userId);
    }
}
