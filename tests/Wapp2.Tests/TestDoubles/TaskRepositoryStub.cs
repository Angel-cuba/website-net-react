using Tasks.Models;
using Tasks.Repositories;

namespace Wapp2.Tests.TestDoubles;

internal sealed class TaskRepositoryStub : ITaskRepository
{
    public TaskModel? TaskToGet { get; init; }
    public TaskUpdateAccessDetailsModel? UpdateAccess { get; init; }
    public IReadOnlyList<int> AccessUserIds { get; init; } = [];
    public IReadOnlyList<int> InvitationUserIds { get; init; } = [];
    public int? PermissionUserId { get; init; }
    public int? RevokedUserId { get; init; }
    public bool RejectUpdate { get; init; }
    public int GetTaskCallCount { get; private set; }
    public int UpdateTaskCallCount { get; private set; }
    public int? LastGetTaskId { get; private set; }
    public int? LastGetTaskOwnerUserId { get; private set; }
    public TaskModel? LastUpdatedTask { get; private set; }

    public Task<TaskModel?> GetTask(int id, int ownerUserId)
    {
        GetTaskCallCount++;
        LastGetTaskId = id;
        LastGetTaskOwnerUserId = ownerUserId;
        return Task.FromResult(TaskToGet);
    }

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

    public Task DeleteTask(int id, int ownerUserId) => throw new NotSupportedException();
}
