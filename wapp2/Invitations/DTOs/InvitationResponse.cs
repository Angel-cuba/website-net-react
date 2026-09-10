namespace Wapp2.Invitations.DTOs;

public class InvitationResponse
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public string InvitedEmail { get; set; } = string.Empty;
    public string InvitedByEmail { get; set; } = string.Empty;
    public string InvitedByName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
}
