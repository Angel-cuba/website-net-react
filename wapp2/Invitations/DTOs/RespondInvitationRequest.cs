using System.ComponentModel.DataAnnotations;

namespace Wapp2.Invitations.DTOs;

public class RespondInvitationRequest
{
    [Required]
    [RegularExpression(
        "^(accepted|rejected)$",
        ErrorMessage = "Decision must be accepted or rejected."
    )]
    public string Decision { get; set; } = string.Empty;
}
