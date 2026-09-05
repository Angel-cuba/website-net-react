using Dapper;
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
        public async Task<UserModel> CreateUser(UserModel user)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            var id = await db.QuerySingleAsync<int>(
                """
                INSERT INTO dbo.Users (Email, PasswordHash)
                OUTPUT INSERTED.Id
                VALUES (@Email, @PasswordHash)
                """,
                user
            );

            user.Id = id;
            return user;
        }
        public async Task<UserModel> UpdateUser(UserModel user)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            await db.ExecuteAsync("UPDATE dbo.Users SET Name = @Name, Email = @Email WHERE Id = @Id", user);
            return user;
        }
        public async Task DeleteUser(int id)
        {
            using var db = sqlConnectionFactory.CreateConnection();
            await db.ExecuteAsync("DELETE FROM dbo.Users WHERE Id = @Id", new { Id = id });
        }
    }
}
