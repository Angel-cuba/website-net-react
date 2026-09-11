using Microsoft.AspNetCore.SignalR;
using Wapp2.Notifications.Hubs;
using Wapp2.Notifications.Interfaces;

namespace Wapp2.Notifications.Services;

public sealed class SignalRRealtimeNotifier(
    IHubContext<NotificationHub> hubContext,
    ILogger<SignalRRealtimeNotifier> logger
) : IRealtimeNotifier
{
    public Task InvitationsChanged(int userId)
    {
        return SendToUser(userId, "InvitationsChanged");
    }

    public Task SharedTasksChanged(int userId)
    {
        return SendToUser(userId, "SharedTasksChanged");
    }

    public Task TaskSharingChanged(int userId)
    {
        return SendToUser(userId, "TaskSharingChanged");
    }

    private async Task SendToUser(int userId, string eventName)
    {
        try
        {
            await hubContext.Clients.User(userId.ToString()).SendAsync(eventName);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Unable to send realtime event {EventName} to user {UserId}.",
                eventName,
                userId
            );
        }
    }
}
