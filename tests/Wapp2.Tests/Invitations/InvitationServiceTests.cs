using System.Net;
using Tasks.Models;
using Wapp2.Invitations.DTOs;
using Wapp2.Invitations.Models;
using Wapp2.Invitations.Services;
using Wapp2.Shared.Middleware;
using Wapp2.Tests.TestDoubles;
using Wapp2.Users.Models;

namespace Wapp2.Tests.Invitations;

public class InvitationServiceTests
{
    [Fact]
    public async Task CreateInvitation_WhenOwnerCannotSeeTask_ThrowsNotFound()
    {
        var invitations = new InvitationRepositoryStub();
        var tasks = new TaskRepositoryStub();
        var users = new UserRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = new InvitationService(invitations, tasks, users, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.CreateInvitation(10, 7, CreateRequest("person@example.com"))
        );

        Assert.Equal(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.Equal(10, tasks.LastGetTaskId);
        Assert.Equal(7, tasks.LastGetTaskOwnerUserId);
        Assert.Null(users.LastEmailLookup);
        Assert.Equal(0, invitations.CreateInvitationCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task CreateInvitation_WhenRecipientIsNotRegistered_ThrowsNotFound()
    {
        var invitations = new InvitationRepositoryStub();
        var tasks = new TaskRepositoryStub { TaskToGet = CreateTask() };
        var users = new UserRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = new InvitationService(invitations, tasks, users, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.CreateInvitation(10, 7, CreateRequest(" Person@Example.COM "))
        );

        Assert.Equal(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.Equal("person@example.com", users.LastEmailLookup);
        Assert.Equal(0, invitations.CreateInvitationCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task CreateInvitation_WhenInvitingOwner_ThrowsConflict()
    {
        var invitations = new InvitationRepositoryStub();
        var tasks = new TaskRepositoryStub { TaskToGet = CreateTask() };
        var users = new UserRepositoryStub { UserByEmail = CreateUser(id: 7) };
        var notifier = new RecordingRealtimeNotifier();
        var service = new InvitationService(invitations, tasks, users, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.CreateInvitation(10, 7, CreateRequest("owner@example.com"))
        );

        Assert.Equal(HttpStatusCode.Conflict, exception.StatusCode);
        Assert.Equal(0, invitations.CreateInvitationCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task CreateInvitation_WhenRecipientAlreadyHasAccess_ThrowsConflict()
    {
        var invitations = new InvitationRepositoryStub { HasAccess = true };
        var tasks = new TaskRepositoryStub { TaskToGet = CreateTask() };
        var users = new UserRepositoryStub { UserByEmail = CreateUser(id: 42) };
        var notifier = new RecordingRealtimeNotifier();
        var service = new InvitationService(invitations, tasks, users, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.CreateInvitation(10, 7, CreateRequest("person@example.com"))
        );

        Assert.Equal(HttpStatusCode.Conflict, exception.StatusCode);
        Assert.Equal(10, invitations.LastAccessTaskId);
        Assert.Equal(42, invitations.LastAccessUserId);
        Assert.Equal(0, invitations.CreateInvitationCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task CreateInvitation_WhenPendingInvitationExists_ThrowsConflict()
    {
        var invitations = new InvitationRepositoryStub
        {
            PendingInvitation = new TaskInvitationModel { Id = 100, TaskId = 10 }
        };
        var tasks = new TaskRepositoryStub { TaskToGet = CreateTask() };
        var users = new UserRepositoryStub { UserByEmail = CreateUser(id: 42) };
        var notifier = new RecordingRealtimeNotifier();
        var service = new InvitationService(invitations, tasks, users, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.CreateInvitation(10, 7, CreateRequest("person@example.com"))
        );

        Assert.Equal(HttpStatusCode.Conflict, exception.StatusCode);
        Assert.Equal(0, invitations.CreateInvitationCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task CreateInvitation_WhenValid_CreatesPendingInvitationAndNotifiesBothUsers()
    {
        var created = CreateInvitationDetails(
            status: InvitationStatuses.Pending,
            recipientId: 42
        );
        var invitations = new InvitationRepositoryStub { CreatedInvitation = created };
        var tasks = new TaskRepositoryStub { TaskToGet = CreateTask() };
        var users = new UserRepositoryStub { UserByEmail = CreateUser(id: 42) };
        var notifier = new RecordingRealtimeNotifier();
        var service = new InvitationService(invitations, tasks, users, notifier);

        var response = await service.CreateInvitation(
            10,
            7,
            CreateRequest(" Person@Example.COM ")
        );

        Assert.Equal(1, invitations.CreateInvitationCallCount);
        Assert.Equal(10, invitations.LastCreatedInvitation?.TaskId);
        Assert.Equal(42, invitations.LastCreatedInvitation?.InvitedUserId);
        Assert.Equal("person@example.com", invitations.LastCreatedInvitation?.InvitedEmail);
        Assert.Equal(7, invitations.LastCreatedInvitation?.InvitedByUserId);
        Assert.Equal(100, response.Id);
        Assert.Equal("Ada Guest", response.InvitedByName);
        Assert.Equal([42], notifier.InvitationsChangedFor);
        Assert.Equal([7], notifier.TaskSharingChangedFor);
        Assert.Empty(notifier.SharedTasksChangedFor);
    }

    [Fact]
    public async Task GetReceivedInvitations_MapsNamesAndEmailFallback()
    {
        var withName = CreateInvitationDetails(InvitationStatuses.Pending, 42);
        var withoutName = CreateInvitationDetails(InvitationStatuses.Accepted, 42);
        withoutName.Id = 101;
        withoutName.InvitedByFirstName = string.Empty;
        withoutName.InvitedByLastName = "   ";
        withoutName.InvitedEmail = null;
        var invitations = new InvitationRepositoryStub
        {
            ReceivedInvitations = [withName, withoutName]
        };
        var service = new InvitationService(
            invitations,
            new TaskRepositoryStub(),
            new UserRepositoryStub(),
            new RecordingRealtimeNotifier()
        );

        var responses = (await service.GetReceivedInvitations(42)).ToArray();

        Assert.Equal(2, responses.Length);
        Assert.Equal("Ada Guest", responses[0].InvitedByName);
        Assert.Equal("owner@example.com", responses[1].InvitedByName);
        Assert.Equal(string.Empty, responses[1].InvitedEmail);
    }

    [Fact]
    public async Task RespondToInvitation_WhenInvitationIsNotForRecipient_ThrowsNotFound()
    {
        var invitations = new InvitationRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(invitations, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.RespondToInvitation(100, 42, RespondRequest("accepted"))
        );

        Assert.Equal(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.Equal(0, invitations.RespondToInvitationCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task RespondToInvitation_WhenAlreadyAnswered_ThrowsConflict()
    {
        var invitations = new InvitationRepositoryStub
        {
            InvitationForRecipient = new TaskInvitationModel
            {
                Id = 100,
                Status = InvitationStatuses.Accepted
            }
        };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(invitations, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.RespondToInvitation(100, 42, RespondRequest("accepted"))
        );

        Assert.Equal(HttpStatusCode.Conflict, exception.StatusCode);
        Assert.Equal(0, invitations.RespondToInvitationCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task RespondToInvitation_WhenDecisionIsInvalid_ThrowsBadRequest()
    {
        var invitations = CreatePendingRecipientRepository();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(invitations, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.RespondToInvitation(100, 42, RespondRequest("maybe"))
        );

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.Equal(0, invitations.RespondToInvitationCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task RespondToInvitation_WhenPendingStateChangesBeforeUpdate_ThrowsConflict()
    {
        var invitations = CreatePendingRecipientRepository();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(invitations, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.RespondToInvitation(100, 42, RespondRequest("accepted"))
        );

        Assert.Equal(HttpStatusCode.Conflict, exception.StatusCode);
        Assert.Equal(1, invitations.RespondToInvitationCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task RespondToInvitation_WhenAccepted_NormalizesDecisionAndNotifiesTaskAccess()
    {
        var invitations = new InvitationRepositoryStub
        {
            InvitationForRecipient = CreatePendingInvitation(),
            RespondedInvitation = CreateInvitationDetails(InvitationStatuses.Accepted, 42)
        };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(invitations, notifier);

        var response = await service.RespondToInvitation(
            100,
            42,
            RespondRequest(" Accepted ")
        );

        Assert.Equal(InvitationStatuses.Accepted, invitations.LastDecision);
        Assert.Equal(InvitationStatuses.Accepted, response.Status);
        Assert.Equal([42], notifier.InvitationsChangedFor);
        Assert.Equal([7], notifier.TaskSharingChangedFor);
        Assert.Equal([42], notifier.SharedTasksChangedFor);
    }

    [Fact]
    public async Task RespondToInvitation_WhenRejected_DoesNotNotifySharedTasks()
    {
        var invitations = new InvitationRepositoryStub
        {
            InvitationForRecipient = CreatePendingInvitation(),
            RespondedInvitation = CreateInvitationDetails(InvitationStatuses.Rejected, 42)
        };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(invitations, notifier);

        var response = await service.RespondToInvitation(
            100,
            42,
            RespondRequest("rejected")
        );

        Assert.Equal(InvitationStatuses.Rejected, response.Status);
        Assert.Equal([42], notifier.InvitationsChangedFor);
        Assert.Equal([7], notifier.TaskSharingChangedFor);
        Assert.Empty(notifier.SharedTasksChangedFor);
    }

    [Fact]
    public async Task CancelInvitation_WhenInvitationIsNotPending_ReturnsFalseWithoutEvents()
    {
        var invitations = new InvitationRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(invitations, notifier);

        var cancelled = await service.CancelInvitation(100, 7);

        Assert.False(cancelled);
        Assert.Equal(100, invitations.LastDeleteInvitationId);
        Assert.Equal(7, invitations.LastDeleteOwnerUserId);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task CancelInvitation_WithRegisteredRecipient_NotifiesRecipientAndOwner()
    {
        var invitations = new InvitationRepositoryStub
        {
            DeletedInvitation = CreatePendingInvitation()
        };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(invitations, notifier);

        var cancelled = await service.CancelInvitation(100, 7);

        Assert.True(cancelled);
        Assert.Equal([42], notifier.InvitationsChangedFor);
        Assert.Equal([7], notifier.TaskSharingChangedFor);
        Assert.Empty(notifier.SharedTasksChangedFor);
    }

    [Fact]
    public async Task CancelInvitation_WithoutRecipientId_NotifiesOnlyOwner()
    {
        var deleted = CreatePendingInvitation();
        deleted.InvitedUserId = null;
        var invitations = new InvitationRepositoryStub { DeletedInvitation = deleted };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(invitations, notifier);

        var cancelled = await service.CancelInvitation(100, 7);

        Assert.True(cancelled);
        Assert.Empty(notifier.InvitationsChangedFor);
        Assert.Equal([7], notifier.TaskSharingChangedFor);
    }

    private static InvitationService CreateService(
        InvitationRepositoryStub invitations,
        RecordingRealtimeNotifier notifier
    )
    {
        return new InvitationService(
            invitations,
            new TaskRepositoryStub(),
            new UserRepositoryStub(),
            notifier
        );
    }

    private static InvitationRepositoryStub CreatePendingRecipientRepository()
    {
        return new InvitationRepositoryStub
        {
            InvitationForRecipient = CreatePendingInvitation()
        };
    }

    private static TaskInvitationModel CreatePendingInvitation()
    {
        return new TaskInvitationModel
        {
            Id = 100,
            TaskId = 10,
            InvitedUserId = 42,
            InvitedEmail = "person@example.com",
            InvitedByUserId = 7,
            Status = InvitationStatuses.Pending
        };
    }

    private static TaskInvitationDetailsModel CreateInvitationDetails(
        string status,
        int? recipientId
    )
    {
        return new TaskInvitationDetailsModel
        {
            Id = 100,
            TaskId = 10,
            TaskTitle = "Shared task",
            InvitedUserId = recipientId,
            InvitedEmail = "person@example.com",
            InvitedByUserId = 7,
            InvitedByEmail = "owner@example.com",
            InvitedByFirstName = "Ada",
            InvitedByLastName = "Guest",
            Status = status,
            HasActiveAccess = status == InvitationStatuses.Accepted,
            CreatedAt = new DateTime(2026, 9, 12, 8, 0, 0, DateTimeKind.Utc)
        };
    }

    private static TaskModel CreateTask()
    {
        return new TaskModel { Id = 10, Title = "Shared task" };
    }

    private static UserModel CreateUser(int id)
    {
        return new UserModel { Id = id, Email = "person@example.com" };
    }

    private static CreateInvitationRequest CreateRequest(string email)
    {
        return new CreateInvitationRequest { InvitedEmail = email };
    }

    private static RespondInvitationRequest RespondRequest(string decision)
    {
        return new RespondInvitationRequest { Decision = decision };
    }
}
