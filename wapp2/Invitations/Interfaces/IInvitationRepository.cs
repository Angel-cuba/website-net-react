using Wapp2.Invitations.Models;

namespace Wapp2.Invitations.Interfaces;

public interface IInvitationRepository
{
    Task<TaskInvitationModel?> GetPendingInvitation(int taskId, int invitedUserId);
    Task<TaskInvitationModel?> GetInvitationForRecipient(int invitationId, int invitedUserId);
    Task<IEnumerable<TaskInvitationDetailsModel>> GetReceivedInvitations(int invitedUserId);
    Task<bool> HasTaskAccess(int taskId, int userId);
    Task<TaskInvitationDetailsModel> CreateInvitation(TaskInvitationModel invitation);
    Task<TaskInvitationDetailsModel?> RespondToInvitation(
        int invitationId,
        int invitedUserId,
        string decision
    );
    Task<bool> DeletePendingInvitation(int invitationId, int invitedByUserId);
}
