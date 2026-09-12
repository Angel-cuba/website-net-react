using Wapp2.Users.Interfaces;
using Wapp2.Users.Models;

namespace Wapp2.Tests.TestDoubles;

internal sealed class UserRepositoryStub : IUserRepository
{
    public UserModel? UserById { get; init; }
    public UserModel? UserByEmail { get; init; }
    public UserModel? CreatedUser { get; init; }
    public IReadOnlyList<string> Roles { get; init; } = [];
    public bool DeleteResult { get; init; }
    public int CreateUserCallCount { get; private set; }
    public int DeleteUserCallCount { get; private set; }
    public int? LastUserIdLookup { get; private set; }
    public int? RolesRequestedForUserId { get; private set; }
    public int? DeletedUserId { get; private set; }
    public string? LastEmailLookup { get; private set; }
    public UserModel? LastCreatedUser { get; private set; }
    public string? LastCreatedFirstName { get; private set; }
    public string? LastCreatedRoleName { get; private set; }

    public Task<UserModel?> GetUser(int id)
    {
        LastUserIdLookup = id;
        return Task.FromResult(UserById);
    }

    public Task<UserModel?> GetUserByEmail(string email)
    {
        LastEmailLookup = email;
        return Task.FromResult(UserByEmail);
    }

    public Task<IEnumerable<string>> GetRolesByUserId(int userId)
    {
        RolesRequestedForUserId = userId;
        return Task.FromResult<IEnumerable<string>>(Roles);
    }

    public Task<UserModel> CreateUserWithProfileAndRole(
        UserModel user,
        string firstName,
        string defaultRoleName
    )
    {
        CreateUserCallCount++;
        LastCreatedUser = user;
        LastCreatedFirstName = firstName;
        LastCreatedRoleName = defaultRoleName;
        return Task.FromResult(CreatedUser ?? user);
    }

    public Task<bool> DeleteUserAndRelatedData(int userId)
    {
        DeleteUserCallCount++;
        DeletedUserId = userId;
        return Task.FromResult(DeleteResult);
    }

    public Task<IEnumerable<UserModel>> GetUsers() => throw new NotSupportedException();

    public Task<UserModel> UpdateUser(UserModel user) => throw new NotSupportedException();
}
