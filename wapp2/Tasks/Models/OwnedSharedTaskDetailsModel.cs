namespace Tasks.Models;

public class OwnedSharedTaskDetailsModel : TaskModel
{
    public int ActiveAccessCount { get; set; }
    public int PendingInvitationCount { get; set; }
}
