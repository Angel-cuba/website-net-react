using Wapp2.Users.DTOs;

namespace Wapp2.Users.Interfaces;

public interface IUserAccountService
{
    Task DeleteAccount(int userId, DeleteAccountRequest request);
}
