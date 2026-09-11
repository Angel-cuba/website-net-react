using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Wapp2.Notifications.Hubs;

[Authorize]
public sealed class NotificationHub : Hub;
