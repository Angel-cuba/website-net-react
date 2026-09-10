using Dapper;
using Microsoft.Data.SqlClient;
using Wapp2.Users.Models;
using Wapp2.Shared.Database;
using Wapp2.Users.Interfaces;

namespace Wapp2.Users.Repositories
{
    public class UserRepository(ISqlConnectionFactory sqlConnectionFactory) : IUserRepository
    {
        public async Task<IEnumerable<UserModel>> GetUsers()
        {
            using var db = sqlConnectionFactory.CreateConnection();
            return await db.QueryAsync<UserModel>("SELECT * FROM dbo.Users");
        }

        public async Task<UserModel?> GetUser(int id)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            return await db.QueryFirstOrDefaultAsync<UserModel>("SELECT * FROM dbo.Users WHERE Id = @Id", new { Id = id });
        }

        public async Task<UserModel?> GetUserByEmail(string email)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            return await db.QueryFirstOrDefaultAsync<UserModel>("SELECT * FROM dbo.Users WHERE Email = @Email", new { Email = email });
        }

        public async Task<IEnumerable<string>> GetRolesByUserId(int userId)
        {
            using var db = sqlConnectionFactory.CreateConnection();

            return await db.QueryAsync<string>(
                """
                SELECT r.Name
                FROM dbo.UserRoles ur
                INNER JOIN dbo.Roles r ON r.Id = ur.RoleId
                WHERE ur.UserId = @UserId
                """,
                new { UserId = userId }
            );
        }
        public async Task<UserModel> CreateUserWithProfileAndRole(
            UserModel user,
            string firstName,
            string defaultRoleName
        )
        {
            using var db = (SqlConnection)sqlConnectionFactory.CreateConnection();
            await db.OpenAsync();

            using var transaction = await db.BeginTransactionAsync();

            try
            {
                var userId = await db.QuerySingleAsync<int>(
                    """
                    INSERT INTO dbo.Users (Email, PasswordHash)
                    OUTPUT INSERTED.Id
                    VALUES (@Email, @PasswordHash)
                    """,
                    user,
                    transaction
                );

                await db.ExecuteAsync(
                    """
                    INSERT INTO dbo.UserProfiles (UserId, FirstName, LastName, AvatarUrl, Bio)
                    VALUES (@UserId, @FirstName, NULL, NULL, NULL)
                    """,
                    new { UserId = userId, FirstName = firstName },
                    transaction
                );

                var roleId = await db.QuerySingleAsync<int>(
                    """
                    SELECT Id
                    FROM dbo.Roles
                    WHERE Name = @DefaultRoleName
                    """,
                    new { DefaultRoleName = defaultRoleName },
                    transaction
                );

                await db.ExecuteAsync(
                    """
                    INSERT INTO dbo.UserRoles (UserId, RoleId)
                    VALUES (@UserId, @RoleId)
                    """,
                    new { UserId = userId, RoleId = roleId },
                    transaction
                );

                await transaction.CommitAsync();

                user.Id = userId;
                return user;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        public async Task<UserModel> UpdateUser(UserModel user)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            await db.ExecuteAsync("UPDATE dbo.Users SET Name = @Name, Email = @Email WHERE Id = @Id", user);
            return user;
        }
        public async Task<bool> DeleteUserAndRelatedData(int userId)
        {
            using var db = (SqlConnection)sqlConnectionFactory.CreateConnection();
            await db.OpenAsync();

            using var transaction = await db.BeginTransactionAsync();

            try
            {
                var parameters = new { UserId = userId };

                await db.ExecuteAsync(
                    """
                    DELETE access
                    FROM dbo.TaskAccess access
                    WHERE access.UserId = @UserId
                       OR EXISTS (
                           SELECT 1
                           FROM dbo.Tasks task
                           WHERE task.Id = access.TaskId
                             AND task.OwnerUserId = @UserId
                       )
                    """,
                    parameters,
                    transaction
                );

                await db.ExecuteAsync(
                    """
                    DELETE invitation
                    FROM dbo.TaskInvitations invitation
                    WHERE invitation.InvitedUserId = @UserId
                       OR invitation.InvitedByUserId = @UserId
                       OR invitation.InvitedEmail = (
                           SELECT Email FROM dbo.Users WHERE Id = @UserId
                       )
                       OR EXISTS (
                           SELECT 1
                           FROM dbo.Tasks task
                           WHERE task.Id = invitation.TaskId
                             AND task.OwnerUserId = @UserId
                       )
                    """,
                    parameters,
                    transaction
                );

                await db.ExecuteAsync(
                    "DELETE FROM dbo.Notifications WHERE UserId = @UserId",
                    parameters,
                    transaction
                );
                await db.ExecuteAsync(
                    "DELETE FROM dbo.Tasks WHERE OwnerUserId = @UserId",
                    parameters,
                    transaction
                );
                await db.ExecuteAsync(
                    "DELETE FROM dbo.UserRoles WHERE UserId = @UserId",
                    parameters,
                    transaction
                );
                await db.ExecuteAsync(
                    "DELETE FROM dbo.UserProfiles WHERE UserId = @UserId",
                    parameters,
                    transaction
                );
                var deletedUsers = await db.ExecuteAsync(
                    "DELETE FROM dbo.Users WHERE Id = @UserId",
                    parameters,
                    transaction
                );

                await transaction.CommitAsync();
                return deletedUsers > 0;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
