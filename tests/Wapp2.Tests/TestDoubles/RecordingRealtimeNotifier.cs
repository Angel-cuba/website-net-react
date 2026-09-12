using Wapp2.Notifications.Interfaces;

namespace Wapp2.Tests.TestDoubles;

internal sealed class RecordingRealtimeNotifier : IRealtimeNotifier
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
