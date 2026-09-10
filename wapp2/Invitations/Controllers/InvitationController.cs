using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wapp2.Invitations.DTOs;
using Wapp2.Invitations.Interfaces;
using Wapp2.Shared.DTOs;
using Wapp2.Shared.Security;

namespace Wapp2.Invitations.Controllers;

[ApiController]
[Authorize]
[Route("api/invitations")]
public class InvitationController(
    IInvitationService invitationService,
    ICurrentUserService currentUserService
) : ControllerBase
{
    [HttpPost("~/api/tasks/{taskId:int}/invitations")]
    public async Task<ActionResult<ApiResponse<InvitationResponse>>> CreateInvitation(
        int taskId,
        [FromBody] CreateInvitationRequest request
    )
    {
        var invitation = await invitationService.CreateInvitation(
            taskId,
            currentUserService.UserId,
            request
        );

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<InvitationResponse>.Ok(
                invitation,
                "Invitation created successfully."
            )
        );
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<InvitationResponse>>>>
        GetReceivedInvitations()
    {
        var invitations = await invitationService.GetReceivedInvitations(
            currentUserService.UserId
        );

        return Ok(ApiResponse<IEnumerable<InvitationResponse>>.Ok(
            invitations,
            "Invitations loaded successfully."
        ));
    }

    [HttpPatch("{invitationId:int}")]
    public async Task<ActionResult<ApiResponse<InvitationResponse>>> RespondToInvitation(
        int invitationId,
        [FromBody] RespondInvitationRequest request
    )
    {
        var invitation = await invitationService.RespondToInvitation(
            invitationId,
            currentUserService.UserId,
            request
        );

        return Ok(ApiResponse<InvitationResponse>.Ok(
            invitation,
            "Invitation updated successfully."
        ));
    }

    [HttpDelete("{invitationId:int}")]
    public async Task<IActionResult> CancelInvitation(int invitationId)
    {
        var deleted = await invitationService.CancelInvitation(
            invitationId,
            currentUserService.UserId
        );

        if (!deleted)
        {
            return NotFound(ApiResponse<object>.Fail("Pending invitation not found."));
        }

        return NoContent();
    }
}
