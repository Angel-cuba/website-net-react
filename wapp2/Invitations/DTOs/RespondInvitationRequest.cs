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

    [StringLength(
        500,
        ErrorMessage = "Rejection reason must be 500 characters or fewer."
    )]
    public string? RejectionReason { get; set; }
}
