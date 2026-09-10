using System.ComponentModel.DataAnnotations;

namespace Wapp2.Invitations.DTOs;

public class CreateInvitationRequest
{
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string InvitedEmail { get; set; } = string.Empty;
}
