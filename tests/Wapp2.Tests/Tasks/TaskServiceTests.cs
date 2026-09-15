using System.Net;
using Tasks.DTOs;
using Tasks.Models;
using Tasks.Services;
using Wapp2.Shared.Middleware;
using Wapp2.Tests.TestDoubles;

namespace Wapp2.Tests.Tasks;

public class TaskServiceTests
{
    private static readonly DateTimeOffset CurrentTime = new(
        2026,
        9,
        14,
        12,
        0,
        0,
        TimeSpan.Zero
    );

    [Fact]
    public async Task CreateTask_WhenDueDateIsLessThanFiveHoursAway_ThrowsBadRequest()
    {
        var task = CreateTask();
        task.DueDate = CurrentTime.AddHours(5).AddTicks(-1).UtcDateTime;
        var repository = new TaskRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.CreateTask(task, ownerUserId: 42)
        );

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.Equal(0, repository.CreateTaskCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task CreateTask_WhenDueDateIsExactlyFiveHoursAway_Persists()
    {
        var task = CreateTask();
        task.DueDate = CurrentTime.AddHours(5).UtcDateTime;
        var repository = new TaskRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var result = await service.CreateTask(task, ownerUserId: 42);

        Assert.Same(task, result);
        Assert.Equal(1, repository.CreateTaskCallCount);
        Assert.Same(task, repository.LastCreatedTask);
        Assert.Equal(42, repository.LastCreateOwnerUserId);
    }

    [Fact]
    public async Task CreateTask_WhenDueDateIsMissing_Persists()
    {
        var task = CreateTask();
        task.DueDate = null;
        var repository = new TaskRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var result = await service.CreateTask(task, ownerUserId: 42);

        Assert.Same(task, result);
        Assert.Equal(1, repository.CreateTaskCallCount);
        Assert.Null(repository.LastCreatedTask!.DueDate);
    }

    [Fact]
    public async Task UpdateTask_WhenTaskIsNotVisible_ThrowsNotFound()
    {
        var repository = new TaskRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.UpdateTask(CreateTask(), userId: 42)
        );

        Assert.Contains("not found", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(0, repository.UpdateTaskCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task UpdateTask_WhenAccessIsViewOnly_ThrowsForbidden()
    {
        var repository = new TaskRepositoryStub
        {
            UpdateAccess = new TaskUpdateAccessDetailsModel
            {
                OwnerUserId = 7,
                CanEdit = false
            }
        };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.UpdateTask(CreateTask(), userId: 42)
        );

        Assert.Equal(HttpStatusCode.Forbidden, exception.StatusCode);
        Assert.Equal(0, repository.UpdateTaskCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task UpdateTask_WhenAccessDisappearsBeforePersistence_ThrowsForbidden()
    {
        var repository = new TaskRepositoryStub
        {
            UpdateAccess = new TaskUpdateAccessDetailsModel
            {
                OwnerUserId = 7,
                CanEdit = true
            },
            RejectUpdate = true
        };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.UpdateTask(CreateTask(), userId: 42)
        );

        Assert.Equal(HttpStatusCode.Forbidden, exception.StatusCode);
        Assert.Equal(1, repository.UpdateTaskCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task UpdateTask_WhenAuthorized_PersistsAndNotifiesAffectedUsers()
    {
        var task = CreateTask();
        var repository = new TaskRepositoryStub
        {
            UpdateAccess = new TaskUpdateAccessDetailsModel
            {
                OwnerUserId = 7,
                CanEdit = true
            },
            AccessUserIds = [11, 12],
            InvitationUserIds = [13]
        };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var result = await service.UpdateTask(task, userId: 42);

        Assert.Same(task, result);
        Assert.Equal(1, repository.UpdateTaskCallCount);
        Assert.Same(task, repository.LastUpdatedTask);
        Assert.Equal([11, 12], notifier.SharedTasksChangedFor);
        Assert.Equal([13], notifier.InvitationsChangedFor);
        Assert.Equal([7], notifier.TaskSharingChangedFor);
    }

    [Fact]
    public async Task UpdateTask_WhenDueDateIsLessThanFiveHoursAway_ThrowsBadRequest()
    {
        var task = CreateTask();
        task.DueDate = CurrentTime.AddHours(4).UtcDateTime;
        var repository = new TaskRepositoryStub
        {
            UpdateAccess = new TaskUpdateAccessDetailsModel
            {
                OwnerUserId = 7,
                CanEdit = true
            }
        };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var exception = await Assert.ThrowsAsync<ErrorHandlingMiddlewareException>(
            () => service.UpdateTask(task, userId: 42)
        );

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.Equal(0, repository.UpdateTaskCallCount);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task UpdateTaskAccessPermission_WhenAccessDoesNotExist_ReturnsFalse()
    {
        var repository = new TaskRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var updated = await service.UpdateTaskAccessPermission(
            taskId: 10,
            accessId: 20,
            canEdit: true,
            ownerUserId: 7
        );

        Assert.False(updated);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task UpdateTaskAccessPermission_WhenAccessExists_NotifiesMemberAndOwner()
    {
        var repository = new TaskRepositoryStub { PermissionUserId = 42 };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var updated = await service.UpdateTaskAccessPermission(
            taskId: 10,
            accessId: 20,
            canEdit: true,
            ownerUserId: 7
        );

        Assert.True(updated);
        Assert.Equal([42], notifier.SharedTasksChangedFor);
        Assert.Empty(notifier.InvitationsChangedFor);
        Assert.Equal([7], notifier.TaskSharingChangedFor);
    }

    [Fact]
    public async Task RevokeTaskAccess_WhenAccessDoesNotExist_ReturnsFalse()
    {
        var repository = new TaskRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var revoked = await service.RevokeTaskAccess(
            taskId: 10,
            accessId: 20,
            ownerUserId: 7
        );

        Assert.False(revoked);
        Assert.Empty(notifier.AllNotifications);
    }

    [Fact]
    public async Task RevokeTaskAccess_WhenAccessExists_NotifiesMemberAndOwner()
    {
        var repository = new TaskRepositoryStub { RevokedUserId = 42 };
        var notifier = new RecordingRealtimeNotifier();
        var service = CreateService(repository, notifier);

        var revoked = await service.RevokeTaskAccess(
            taskId: 10,
            accessId: 20,
            ownerUserId: 7
        );

        Assert.True(revoked);
        Assert.Equal([42], notifier.SharedTasksChangedFor);
        Assert.Equal([42], notifier.InvitationsChangedFor);
        Assert.Equal([7], notifier.TaskSharingChangedFor);
    }

    private static TaskModel CreateTask()
    {
        return new TaskModel
        {
            Id = 10,
            Title = "Test task",
            Description = "Task used by the service unit tests.",
            Category = "Testing",
            Priority = "High",
            Status = "in-progress",
            DueDate = CurrentTime.AddHours(8).UtcDateTime
        };
    }

    private static TaskService CreateService(
        TaskRepositoryStub repository,
        RecordingRealtimeNotifier notifier
    )
    {
        return new TaskService(
            repository,
            notifier,
            new FixedTimeProvider(CurrentTime)
        );
    }

}
