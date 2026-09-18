namespace Tasks.DTOs;

public class TaskInvitationActivityResponse
{
    public int InvitationId { get; set; }
    public string InvitedEmail { get; set; } = string.Empty;
    public string InvitedName { get; set; } = string.Empty;
    public string? InvitedAvatarUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime RespondedAt { get; set; }
}
