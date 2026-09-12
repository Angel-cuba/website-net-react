using Wapp2.Tests.TestDoubles;
using Wapp2.Users.DTOs;
using Wapp2.Users.Models;
using Wapp2.Users.Services;

namespace Wapp2.Tests.Users;

public class UserProfileServiceTests
{
    [Fact]
    public async Task GetUserProfile_WhenProfileDoesNotExist_ReturnsNull()
    {
        var repository = new UserProfileRepositoryStub();
        var service = new UserProfileService(repository);

        var response = await service.GetUserProfile(42);

        Assert.Null(response);
        Assert.Equal(42, repository.GetUserId);
    }

    [Fact]
    public async Task GetUserProfile_WhenProfileExists_MapsResponse()
    {
        var repository = new UserProfileRepositoryStub
        {
            ProfileToGet = CreateProfile()
        };
        var service = new UserProfileService(repository);

        var response = await service.GetUserProfile(42);

        Assert.NotNull(response);
        Assert.Equal("Ada", response.FirstName);
        Assert.Equal("Lovelace", response.LastName);
        Assert.Equal("https://example.com/avatar.jpg", response.AvatarUrl);
        Assert.Equal("Writes careful programs.", response.Bio);
    }

    [Fact]
    public async Task GetUserProfile_WhenNamesAreNull_MapsThemToEmptyStrings()
    {
        var profile = CreateProfile();
        profile.FirstName = null!;
        profile.LastName = null!;
        var repository = new UserProfileRepositoryStub { ProfileToGet = profile };
        var service = new UserProfileService(repository);

        var response = await service.GetUserProfile(42);

        Assert.NotNull(response);
        Assert.Equal(string.Empty, response.FirstName);
        Assert.Equal(string.Empty, response.LastName);
    }

    [Fact]
    public async Task UpdateUserProfile_WhenRepositoryCannotFindProfile_ReturnsNull()
    {
        var request = CreateUpdateRequest();
        var repository = new UserProfileRepositoryStub();
        var service = new UserProfileService(repository);

        var response = await service.UpdateUserProfile(42, request);

        Assert.Null(response);
        Assert.Equal(42, repository.UpdateUserId);
        Assert.Same(request, repository.LastUpdateRequest);
    }

    [Fact]
    public async Task UpdateUserProfile_WhenSuccessful_MapsUpdatedProfile()
    {
        var request = CreateUpdateRequest();
        var repository = new UserProfileRepositoryStub
        {
            ProfileToUpdate = CreateProfile()
        };
        var service = new UserProfileService(repository);

        var response = await service.UpdateUserProfile(42, request);

        Assert.NotNull(response);
        Assert.Equal("Ada", response.FirstName);
        Assert.Equal("Lovelace", response.LastName);
        Assert.Equal(42, repository.UpdateUserId);
        Assert.Same(request, repository.LastUpdateRequest);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task DeleteUserProfile_ReturnsRepositoryResult(bool deleteResult)
    {
        var repository = new UserProfileRepositoryStub { DeleteResult = deleteResult };
        var service = new UserProfileService(repository);

        var response = await service.DeleteUserProfile(42);

        Assert.Equal(deleteResult, response);
        Assert.Equal(42, repository.DeleteUserId);
    }

    private static UserProfileModel CreateProfile()
    {
        return new UserProfileModel
        {
            UserId = 42,
            FirstName = "Ada",
            LastName = "Lovelace",
            AvatarUrl = "https://example.com/avatar.jpg",
            Bio = "Writes careful programs."
        };
    }

    private static UpdateUserProfileRequest CreateUpdateRequest()
    {
        return new UpdateUserProfileRequest
        {
            FirstName = "Ada",
            LastName = "Lovelace",
            AvatarUrl = "https://example.com/avatar.jpg",
            Bio = "Writes careful programs."
        };
    }
}
