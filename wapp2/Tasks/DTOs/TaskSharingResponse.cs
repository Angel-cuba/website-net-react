namespace Tasks.DTOs;

public class TaskSharingResponse
{
    public int TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public IReadOnlyList<PendingTaskInvitationResponse> PendingInvitations { get; set; } = [];
    public IReadOnlyList<TaskAccessResponse> Members { get; set; } = [];
}
