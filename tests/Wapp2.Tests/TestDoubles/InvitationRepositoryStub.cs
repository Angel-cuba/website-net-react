using Wapp2.Invitations.Interfaces;
using Wapp2.Invitations.Models;

namespace Wapp2.Tests.TestDoubles;

internal sealed class InvitationRepositoryStub : IInvitationRepository
{
    public TaskInvitationModel? PendingInvitation { get; init; }
    public TaskInvitationModel? InvitationForRecipient { get; init; }
    public IReadOnlyList<TaskInvitationDetailsModel> ReceivedInvitations { get; init; } = [];
    public bool HasAccess { get; init; }
    public TaskInvitationDetailsModel? CreatedInvitation { get; init; }
    public TaskInvitationDetailsModel? RespondedInvitation { get; init; }
    public TaskInvitationModel? DeletedInvitation { get; init; }
    public int CreateInvitationCallCount { get; private set; }
    public int RespondToInvitationCallCount { get; private set; }
    public int DeletePendingInvitationCallCount { get; private set; }
    public int? LastAccessTaskId { get; private set; }
    public int? LastAccessUserId { get; private set; }
    public TaskInvitationModel? LastCreatedInvitation { get; private set; }
    public int? LastResponseInvitationId { get; private set; }
    public int? LastResponseUserId { get; private set; }
    public string? LastDecision { get; private set; }
    public int? LastDeleteInvitationId { get; private set; }
    public int? LastDeleteOwnerUserId { get; private set; }

    public Task<TaskInvitationModel?> GetPendingInvitation(int taskId, int invitedUserId)
    {
        return Task.FromResult(PendingInvitation);
    }

    public Task<TaskInvitationModel?> GetInvitationForRecipient(
        int invitationId,
        int invitedUserId
    )
    {
        return Task.FromResult(InvitationForRecipient);
    }

    public Task<IEnumerable<TaskInvitationDetailsModel>> GetReceivedInvitations(
        int invitedUserId
    )
    {
        return Task.FromResult<IEnumerable<TaskInvitationDetailsModel>>(ReceivedInvitations);
    }

    public Task<bool> HasTaskAccess(int taskId, int userId)
    {
        LastAccessTaskId = taskId;
        LastAccessUserId = userId;
        return Task.FromResult(HasAccess);
    }

    public Task<TaskInvitationDetailsModel> CreateInvitation(TaskInvitationModel invitation)
    {
        CreateInvitationCallCount++;
        LastCreatedInvitation = invitation;
        return Task.FromResult(
            CreatedInvitation ?? throw new InvalidOperationException("CreatedInvitation is required.")
        );
    }

    public Task<TaskInvitationDetailsModel?> RespondToInvitation(
        int invitationId,
        int invitedUserId,
        string decision
    )
    {
        RespondToInvitationCallCount++;
        LastResponseInvitationId = invitationId;
        LastResponseUserId = invitedUserId;
        LastDecision = decision;
        return Task.FromResult(RespondedInvitation);
    }

    public Task<TaskInvitationModel?> DeletePendingInvitation(
        int invitationId,
        int invitedByUserId
    )
    {
        DeletePendingInvitationCallCount++;
        LastDeleteInvitationId = invitationId;
        LastDeleteOwnerUserId = invitedByUserId;
        return Task.FromResult(DeletedInvitation);
    }
}
