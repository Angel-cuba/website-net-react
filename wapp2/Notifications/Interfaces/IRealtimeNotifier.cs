namespace Wapp2.Notifications.Interfaces;

public interface IRealtimeNotifier
{
    Task InvitationsChanged(int userId);
    Task SharedTasksChanged(int userId);
    Task TaskSharingChanged(int userId);
}
