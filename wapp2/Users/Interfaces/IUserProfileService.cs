using Wapp2.Users.Models;
using Wapp2.Users.DTOs;

namespace Wapp2.Users.Interfaces
{
    public interface IUserProfileService
    {
        Task<UserProfileModel> GetUserProfile(int userId);
        Task<UserProfileModel> UpdateUserProfile(UpdateUserProfileRequest request);
        Task DeleteUserProfile(int userId);
    }
}