using Dapper;
using Wapp2.Users.Models;
using Wapp2.Shared.Database;
using Wapp2.Users.Interfaces;
using Wapp2.Users.DTOs;

namespace Wapp2.Users.Repositories
{
    public class UserProfileRepository(ISqlConnectionFactory sqlConnectionFactory): IUserProfileRepository
    {
        public async Task<UserProfileModel?> GetUserProfile(int userId)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            return await db.QueryFirstOrDefaultAsync<UserProfileModel>("SELECT * FROM dbo.UserProfiles WHERE UserId = @UserId", new { UserId = userId });
        }
        public async Task<UpdateUserProfileRequest> UpdateUserProfile(UpdateUserProfileRequest userProfile)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            await db.ExecuteAsync("UPDATE dbo.UserProfiles SET FirstName = @FirstName, LastName = @LastName, AvatarUrl = @AvatarUrl, Bio = @Bio WHERE UserId = @UserId", userProfile);
            return userProfile;
        }
        public async Task DeleteUserProfile(int userId)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            await db.ExecuteAsync("DELETE FROM dbo.UserProfiles WHERE UserId = @UserId", new { UserId = userId });
        }
    }
}