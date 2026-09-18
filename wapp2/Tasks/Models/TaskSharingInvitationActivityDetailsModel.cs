namespace Tasks.Models;

public class TaskSharingInvitationActivityDetailsModel
{
    public int InvitationId { get; set; }
    public int? InvitedUserId { get; set; }
    public string InvitedEmail { get; set; } = string.Empty;
    public string InvitedFirstName { get; set; } = string.Empty;
    public string InvitedLastName { get; set; } = string.Empty;
    public string? InvitedAvatarUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime RespondedAt { get; set; }
}
