namespace Tasks.Models;

public class TaskSharingDetailsModel
{
    public int TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public IReadOnlyList<TaskSharingInvitationDetailsModel> PendingInvitations { get; set; } = [];
    public IReadOnlyList<TaskAccessDetailsModel> Members { get; set; } = [];
}
