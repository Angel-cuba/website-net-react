namespace Wapp2.Invitations.Models;

public class TaskInvitationDetailsModel : TaskInvitationModel
{
    public string TaskTitle { get; set; } = string.Empty;
    public string InvitedByEmail { get; set; } = string.Empty;
    public string InvitedByFirstName { get; set; } = string.Empty;
    public string InvitedByLastName { get; set; } = string.Empty;
    public bool HasActiveAccess { get; set; }
}
