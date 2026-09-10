namespace Tasks.DTOs;

public class PendingTaskInvitationResponse
{
    public int InvitationId { get; set; }
    public string InvitedEmail { get; set; } = string.Empty;
    public string InvitedName { get; set; } = string.Empty;
    public string? InvitedAvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}
