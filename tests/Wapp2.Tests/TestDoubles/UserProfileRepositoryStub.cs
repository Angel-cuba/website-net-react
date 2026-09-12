using Wapp2.Users.DTOs;
using Wapp2.Users.Interfaces;
using Wapp2.Users.Models;

namespace Wapp2.Tests.TestDoubles;

internal sealed class UserProfileRepositoryStub : IUserProfileRepository
{
    public UserProfileModel? ProfileToGet { get; init; }
    public UserProfileModel? ProfileToUpdate { get; init; }
    public bool DeleteResult { get; init; }
    public int? GetUserId { get; private set; }
    public int? UpdateUserId { get; private set; }
    public int? DeleteUserId { get; private set; }
    public UpdateUserProfileRequest? LastUpdateRequest { get; private set; }

    public Task<UserProfileModel?> GetUserProfile(int userId)
    {
        GetUserId = userId;
        return Task.FromResult(ProfileToGet);
    }

    public Task<UserProfileModel?> UpdateUserProfile(
        int userId,
        UpdateUserProfileRequest request
    )
    {
        UpdateUserId = userId;
        LastUpdateRequest = request;
        return Task.FromResult(ProfileToUpdate);
    }

    public Task<bool> DeleteUserProfile(int userId)
    {
        DeleteUserId = userId;
        return Task.FromResult(DeleteResult);
    }
}
