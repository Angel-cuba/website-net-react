namespace Wapp2.Invitations.Models;

public class TaskInvitationModel
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public int? InvitedUserId { get; set; }
    public string? InvitedEmail { get; set; }
    public int InvitedByUserId { get; set; }
    public string Status { get; set; } = InvitationStatuses.Pending;
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}
