using System.Net;
using Microsoft.Data.SqlClient;
using Tasks.Repositories;
using Wapp2.Invitations.DTOs;
using Wapp2.Invitations.Interfaces;
using Wapp2.Invitations.Models;
using Wapp2.Notifications.Interfaces;
using Wapp2.Shared.Middleware;
using Wapp2.Users.Interfaces;

namespace Wapp2.Invitations.Services;

public class InvitationService(
    IInvitationRepository invitationRepository,
    ITaskRepository taskRepository,
    IUserRepository userRepository,
    IRealtimeNotifier realtimeNotifier
) : IInvitationService
{
    public async Task<InvitationResponse> CreateInvitation(
        int taskId,
        int currentUserId,
        CreateInvitationRequest request
    )
    {
        var task = await taskRepository.GetTask(taskId, currentUserId);
        if (task == null)
        {
            throw new ErrorHandlingMiddlewareException(
                "Task not found.",
                HttpStatusCode.NotFound
            );
        }

        var invitedEmail = request.InvitedEmail.Trim().ToLowerInvariant();
        var invitedUser = await userRepository.GetUserByEmail(invitedEmail);
        if (invitedUser == null)
        {
            throw new ErrorHandlingMiddlewareException(
                "The invited user is not registered.",
                HttpStatusCode.NotFound
            );
        }

        if (invitedUser.Id == currentUserId)
        {
            throw new ErrorHandlingMiddlewareException(
                "You cannot invite yourself to your own task.",
                HttpStatusCode.Conflict
            );
        }

        if (await invitationRepository.HasTaskAccess(taskId, invitedUser.Id))
        {
            throw new ErrorHandlingMiddlewareException(
                "This user already has access to the task.",
                HttpStatusCode.Conflict
            );
        }

        if (await invitationRepository.GetPendingInvitation(taskId, invitedUser.Id) != null)
        {
            throw new ErrorHandlingMiddlewareException(
                "A pending invitation already exists for this user.",
                HttpStatusCode.Conflict
            );
        }

        try
        {
            var invitation = await invitationRepository.CreateInvitation(
                new TaskInvitationModel
                {
                    TaskId = taskId,
                    InvitedUserId = invitedUser.Id,
                    InvitedEmail = invitedUser.Email,
                    InvitedByUserId = currentUserId
                }
            );

            if (invitation.InvitedUserId is int invitedUserId)
            {
                await realtimeNotifier.InvitationsChanged(invitedUserId);
            }
            await realtimeNotifier.TaskSharingChanged(currentUserId);

            return MapResponse(invitation);
        }
        catch (SqlException exception) when (exception.Number is 2601 or 2627)
        {
            throw new ErrorHandlingMiddlewareException(
                "A pending invitation already exists for this user.",
                HttpStatusCode.Conflict
            );
        }
    }

    public async Task<IEnumerable<InvitationResponse>> GetReceivedInvitations(
        int currentUserId
    )
    {
        var invitations = await invitationRepository.GetReceivedInvitations(currentUserId);
        return invitations.Select(MapResponse);
    }

    public async Task<InvitationResponse> RespondToInvitation(
        int invitationId,
        int currentUserId,
        RespondInvitationRequest request
    )
    {
        var invitation = await invitationRepository.GetInvitationForRecipient(
            invitationId,
            currentUserId
        );

        if (invitation == null)
        {
            throw new ErrorHandlingMiddlewareException(
                "Invitation not found.",
                HttpStatusCode.NotFound
            );
        }

        if (invitation.Status != InvitationStatuses.Pending)
        {
            throw new ErrorHandlingMiddlewareException(
                "This invitation has already been answered.",
                HttpStatusCode.Conflict
            );
        }

        var decision = request.Decision.Trim().ToLowerInvariant();
        if (decision != InvitationStatuses.Accepted && decision != InvitationStatuses.Rejected)
        {
            throw new ErrorHandlingMiddlewareException(
                "Decision must be accepted or rejected.",
                HttpStatusCode.BadRequest
            );
        }

        var updatedInvitation = await invitationRepository.RespondToInvitation(
            invitationId,
            currentUserId,
            decision
        );

        if (updatedInvitation == null)
        {
            throw new ErrorHandlingMiddlewareException(
                "This invitation is no longer pending.",
                HttpStatusCode.Conflict
            );
        }

        await realtimeNotifier.InvitationsChanged(currentUserId);
        await realtimeNotifier.TaskSharingChanged(updatedInvitation.InvitedByUserId);

        if (decision == InvitationStatuses.Accepted)
        {
            await realtimeNotifier.SharedTasksChanged(currentUserId);
        }

        return MapResponse(updatedInvitation);
    }

    public async Task<bool> CancelInvitation(int invitationId, int currentUserId)
    {
        var deletedInvitation = await invitationRepository.DeletePendingInvitation(
            invitationId,
            currentUserId
        );

        if (deletedInvitation?.InvitedUserId is int invitedUserId)
        {
            await realtimeNotifier.InvitationsChanged(invitedUserId);
        }
        if (deletedInvitation != null)
        {
            await realtimeNotifier.TaskSharingChanged(currentUserId);
        }

        return deletedInvitation != null;
    }

    private static InvitationResponse MapResponse(TaskInvitationDetailsModel invitation)
    {
        var inviterName = string.Join(
            " ",
            new[] { invitation.InvitedByFirstName, invitation.InvitedByLastName }
                .Where(name => !string.IsNullOrWhiteSpace(name))
        );

        return new InvitationResponse
        {
            Id = invitation.Id,
            TaskId = invitation.TaskId,
            TaskTitle = invitation.TaskTitle,
            InvitedEmail = invitation.InvitedEmail ?? string.Empty,
            InvitedByEmail = invitation.InvitedByEmail,
            InvitedByName = string.IsNullOrWhiteSpace(inviterName)
                ? invitation.InvitedByEmail
                : inviterName,
            Status = invitation.Status,
            HasActiveAccess = invitation.HasActiveAccess,
            CreatedAt = invitation.CreatedAt,
            RespondedAt = invitation.RespondedAt
        };
    }
}
