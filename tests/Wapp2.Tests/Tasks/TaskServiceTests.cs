using System.Net;
using Tasks.DTOs;
using Tasks.Models;
using Tasks.Repositories;
using Tasks.Services;
using Wapp2.Notifications.Interfaces;
using Wapp2.Shared.Middleware;

namespace Wapp2.Tests.Tasks;

public class TaskServiceTests
{
    [Fact]
    public async Task UpdateTask_WhenTaskIsNotVisible_ThrowsNotFound()
    {
        var repository = new TaskRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = new TaskService(repository, notifier);

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
        var service = new TaskService(repository, notifier);

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
        var service = new TaskService(repository, notifier);

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
        var service = new TaskService(repository, notifier);

        var result = await service.UpdateTask(task, userId: 42);

        Assert.Same(task, result);
        Assert.Equal(1, repository.UpdateTaskCallCount);
        Assert.Same(task, repository.LastUpdatedTask);
        Assert.Equal([11, 12], notifier.SharedTasksChangedFor);
        Assert.Equal([13], notifier.InvitationsChangedFor);
        Assert.Equal([7], notifier.TaskSharingChangedFor);
    }

    [Fact]
    public async Task UpdateTaskAccessPermission_WhenAccessDoesNotExist_ReturnsFalse()
    {
        var repository = new TaskRepositoryStub();
        var notifier = new RecordingRealtimeNotifier();
        var service = new TaskService(repository, notifier);

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
        var service = new TaskService(repository, notifier);

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
        var service = new TaskService(repository, notifier);

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
        var service = new TaskService(repository, notifier);

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
            DueDate = DateTime.UtcNow.AddHours(8)
        };
    }

    private sealed class TaskRepositoryStub : ITaskRepository
    {
        public TaskUpdateAccessDetailsModel? UpdateAccess { get; init; }
        public IReadOnlyList<int> AccessUserIds { get; init; } = [];
        public IReadOnlyList<int> InvitationUserIds { get; init; } = [];
        public int? PermissionUserId { get; init; }
        public int? RevokedUserId { get; init; }
        public bool RejectUpdate { get; init; }
        public int UpdateTaskCallCount { get; private set; }
        public TaskModel? LastUpdatedTask { get; private set; }

        public Task<TaskUpdateAccessDetailsModel?> GetTaskUpdateAccess(int taskId, int userId)
        {
            return Task.FromResult(UpdateAccess);
        }

        public Task<TaskModel?> UpdateTask(TaskModel task, int userId)
        {
            UpdateTaskCallCount++;
            LastUpdatedTask = task;
            return Task.FromResult(RejectUpdate ? null : task);
        }

        public Task<IEnumerable<int>> GetTaskAccessUserIds(int taskId, int ownerUserId)
        {
            return Task.FromResult<IEnumerable<int>>(AccessUserIds);
        }

        public Task<IEnumerable<int>> GetTaskInvitationUserIds(int taskId, int ownerUserId)
        {
            return Task.FromResult<IEnumerable<int>>(InvitationUserIds);
        }

        public Task<int?> UpdateTaskAccessPermission(
            int taskId,
            int accessId,
            bool canEdit,
            int ownerUserId
        )
        {
            return Task.FromResult(PermissionUserId);
        }

        public Task<int?> DeleteTaskAccess(int taskId, int accessId, int ownerUserId)
        {
            return Task.FromResult(RevokedUserId);
        }

        public Task<TaskModel?> GetTask(int id, int ownerUserId) =>
            throw new NotSupportedException();

        public Task<IEnumerable<TaskModel>> GetTasks(int ownerUserId) =>
            throw new NotSupportedException();

        public Task<IEnumerable<SharedTaskDetailsModel>> GetSharedTasks(int userId) =>
            throw new NotSupportedException();

        public Task<IEnumerable<OwnedSharedTaskDetailsModel>> GetOwnedSharedTasks(
            int ownerUserId
        ) => throw new NotSupportedException();

        public Task<TaskSharingDetailsModel?> GetTaskSharing(int taskId, int ownerUserId) =>
            throw new NotSupportedException();

        public Task<TaskModel> CreateTask(TaskModel task, int ownerUserId) =>
            throw new NotSupportedException();

        public Task DeleteTask(int id, int ownerUserId) =>
            throw new NotSupportedException();
    }

    private sealed class RecordingRealtimeNotifier : IRealtimeNotifier
    {
        public List<int> InvitationsChangedFor { get; } = [];
        public List<int> SharedTasksChangedFor { get; } = [];
        public List<int> TaskSharingChangedFor { get; } = [];

        public IEnumerable<int> AllNotifications =>
            InvitationsChangedFor.Concat(SharedTasksChangedFor).Concat(TaskSharingChangedFor);

        public Task InvitationsChanged(int userId)
        {
            InvitationsChangedFor.Add(userId);
            return Task.CompletedTask;
        }

        public Task SharedTasksChanged(int userId)
        {
            SharedTasksChangedFor.Add(userId);
            return Task.CompletedTask;
        }

        public Task TaskSharingChanged(int userId)
        {
            TaskSharingChangedFor.Add(userId);
            return Task.CompletedTask;
        }
    }
}
