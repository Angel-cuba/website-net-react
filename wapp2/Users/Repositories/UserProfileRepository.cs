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
            return await db.QueryFirstOrDefaultAsync<UserProfileModel>(
                """
                SELECT Id, UserId, FirstName, LastName, AvatarUrl, Bio
                FROM dbo.UserProfiles
                WHERE UserId = @UserId
                """,
                new { UserId = userId }
            );
        }

        public async Task<UserProfileModel?> UpdateUserProfile(
            int userId,
            UpdateUserProfileRequest request
        )
        {
            using var db = sqlConnectionFactory.CreateConnection();

            return await db.QuerySingleOrDefaultAsync<UserProfileModel>(
                """
                UPDATE dbo.UserProfiles
                SET FirstName = @FirstName,
                    LastName = @LastName,
                    AvatarUrl = @AvatarUrl,
                    Bio = @Bio
                OUTPUT INSERTED.Id,
                       INSERTED.UserId,
                       INSERTED.FirstName,
                       INSERTED.LastName,
                       INSERTED.AvatarUrl,
                       INSERTED.Bio
                WHERE UserId = @UserId
                """,
                new
                {
                    UserId = userId,
                    request.FirstName,
                    request.LastName,
                    request.AvatarUrl,
                    request.Bio
                }
            );
        }

        public async Task<bool> DeleteUserProfile(int userId)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            var affectedRows = await db.ExecuteAsync(
                "DELETE FROM dbo.UserProfiles WHERE UserId = @UserId",
                new { UserId = userId }
            );

            return affectedRows > 0;
        }
    }
}
