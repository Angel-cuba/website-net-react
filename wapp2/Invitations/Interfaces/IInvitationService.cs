using Wapp2.Invitations.DTOs;

namespace Wapp2.Invitations.Interfaces;

public interface IInvitationService
{
    Task<InvitationResponse> CreateInvitation(
        int taskId,
        int currentUserId,
        CreateInvitationRequest request
    );
    Task<IEnumerable<InvitationResponse>> GetReceivedInvitations(int currentUserId);
    Task<InvitationResponse> RespondToInvitation(
        int invitationId,
        int currentUserId,
        RespondInvitationRequest request
    );
    Task<bool> CancelInvitation(int invitationId, int currentUserId);
}
