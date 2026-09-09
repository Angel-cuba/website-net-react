using Wapp2.Users.Models;
using Wapp2.Users.DTOs;

namespace Wapp2.Users.Interfaces
{
    public interface IUserProfileRepository
    {
        Task<UserProfileModel?> GetUserProfile(int userId);
        Task<UpdateUserProfileRequest> UpdateUserProfile(UpdateUserProfileRequest request);
        Task DeleteUserProfile(int userId);

    }
}