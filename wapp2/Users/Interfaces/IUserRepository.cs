using Wapp2.Users.Models;

namespace Wapp2.Users.Interfaces
{
    public interface IUserRepository
    {
        Task<UserModel?> GetUser(int id);
        Task<UserModel?> GetUserByEmail(string email);
        Task<IEnumerable<UserModel>> GetUsers();
        Task<UserModel> CreateUser(UserModel user);
        Task<UserModel> UpdateUser(UserModel user);
        Task DeleteUser(int id);
    }
}
