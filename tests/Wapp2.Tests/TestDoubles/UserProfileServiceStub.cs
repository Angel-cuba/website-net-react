using Wapp2.Users.DTOs;
using Wapp2.Users.Interfaces;

namespace Wapp2.Tests.TestDoubles;

internal sealed class UserProfileServiceStub : IUserProfileService
{
    public UserProfileResponse? ProfileToGet { get; init; }
    public int? LastGetUserId { get; private set; }

    public Task<UserProfileResponse?> GetUserProfile(int userId)
    {
        LastGetUserId = userId;
        return Task.FromResult(ProfileToGet);
    }

    public Task<UserProfileResponse?> UpdateUserProfile(
        int userId,
        UpdateUserProfileRequest request
    ) => throw new NotSupportedException();

    public Task<bool> DeleteUserProfile(int userId) => throw new NotSupportedException();
}
