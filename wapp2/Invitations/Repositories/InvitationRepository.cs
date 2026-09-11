using Dapper;
using Microsoft.Data.SqlClient;
using Wapp2.Invitations.Interfaces;
using Wapp2.Invitations.Models;
using Wapp2.Shared.Database;

namespace Wapp2.Invitations.Repositories;

public class InvitationRepository(ISqlConnectionFactory sqlConnectionFactory) : IInvitationRepository
{
    public async Task<TaskInvitationModel?> GetPendingInvitation(
        int taskId,
        int invitedUserId
    )
    {
        using var db = sqlConnectionFactory.CreateConnection();

        return await db.QueryFirstOrDefaultAsync<TaskInvitationModel>(
            """
            SELECT Id,
                   TaskId,
                   InvitedUserId,
                   InvitedEmail,
                   InvitedByUserId,
                   Status,
                   CreatedAt,
                   RespondedAt
            FROM dbo.TaskInvitations
            WHERE TaskId = @TaskId
              AND InvitedUserId = @InvitedUserId
              AND Status = @PendingStatus
            """,
            new
            {
                TaskId = taskId,
                InvitedUserId = invitedUserId,
                PendingStatus = InvitationStatuses.Pending
            }
        );
    }

    public async Task<TaskInvitationModel?> GetInvitationForRecipient(
        int invitationId,
        int invitedUserId
    )
    {
        using var db = sqlConnectionFactory.CreateConnection();

        return await db.QueryFirstOrDefaultAsync<TaskInvitationModel>(
            """
            SELECT Id,
                   TaskId,
                   InvitedUserId,
                   InvitedEmail,
                   InvitedByUserId,
                   Status,
                   CreatedAt,
                   RespondedAt
            FROM dbo.TaskInvitations
            WHERE Id = @InvitationId
              AND InvitedUserId = @InvitedUserId
            """,
            new
            {
                InvitationId = invitationId,
                InvitedUserId = invitedUserId
            }
        );
    }

    public async Task<IEnumerable<TaskInvitationDetailsModel>> GetReceivedInvitations(
        int invitedUserId
    )
    {
        using var db = sqlConnectionFactory.CreateConnection();

        return await db.QueryAsync<TaskInvitationDetailsModel>(
            """
            WITH RankedInvitations AS (
                SELECT invitation.*,
                       ROW_NUMBER() OVER (
                           PARTITION BY invitation.TaskId, invitation.InvitedUserId
                           ORDER BY invitation.CreatedAt DESC, invitation.Id DESC
                       ) AS InvitationRank
                FROM dbo.TaskInvitations invitation
                WHERE invitation.InvitedUserId = @InvitedUserId
            )
            SELECT invitation.Id,
                   invitation.TaskId,
                   task.Title AS TaskTitle,
                   invitation.InvitedUserId,
                   invitation.InvitedEmail,
                   invitation.InvitedByUserId,
                   inviter.Email AS InvitedByEmail,
                   COALESCE(profile.FirstName, '') AS InvitedByFirstName,
                   COALESCE(profile.LastName, '') AS InvitedByLastName,
                   invitation.Status,
                   invitation.CreatedAt,
                   invitation.RespondedAt,
                   CAST(
                       CASE WHEN EXISTS (
                           SELECT 1
                           FROM dbo.TaskAccess access
                           WHERE access.TaskId = invitation.TaskId
                             AND access.UserId = invitation.InvitedUserId
                       ) THEN 1 ELSE 0 END
                       AS bit
                   ) AS HasActiveAccess
            FROM RankedInvitations invitation
            INNER JOIN dbo.Tasks task ON task.Id = invitation.TaskId
            INNER JOIN dbo.Users inviter ON inviter.Id = invitation.InvitedByUserId
            LEFT JOIN dbo.UserProfiles profile ON profile.UserId = inviter.Id
            WHERE invitation.InvitationRank = 1
            ORDER BY CASE WHEN invitation.Status = @PendingStatus THEN 0 ELSE 1 END,
                     invitation.CreatedAt DESC
            """,
            new
            {
                InvitedUserId = invitedUserId,
                PendingStatus = InvitationStatuses.Pending
            }
        );
    }

    public async Task<bool> HasTaskAccess(int taskId, int userId)
    {
        using var db = sqlConnectionFactory.CreateConnection();

        return await db.QuerySingleAsync<bool>(
            """
            SELECT CAST(
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM dbo.TaskAccess
                    WHERE TaskId = @TaskId
                      AND UserId = @UserId
                ) THEN 1 ELSE 0 END
                AS bit
            )
            """,
            new
            {
                TaskId = taskId,
                UserId = userId
            }
        );
    }

    public async Task<TaskInvitationDetailsModel> CreateInvitation(
        TaskInvitationModel invitation
    )
    {
        using var db = (SqlConnection)sqlConnectionFactory.CreateConnection();
        await db.OpenAsync();

        using var transaction = await db.BeginTransactionAsync();

        try
        {
            var invitationId = await db.QuerySingleAsync<int>(
                """
                INSERT INTO dbo.TaskInvitations (
                    TaskId,
                    InvitedUserId,
                    InvitedEmail,
                    InvitedByUserId,
                    Status
                )
                OUTPUT INSERTED.Id
                VALUES (
                    @TaskId,
                    @InvitedUserId,
                    @InvitedEmail,
                    @InvitedByUserId,
                    @PendingStatus
                )
                """,
                new
                {
                    invitation.TaskId,
                    invitation.InvitedUserId,
                    invitation.InvitedEmail,
                    invitation.InvitedByUserId,
                    PendingStatus = InvitationStatuses.Pending
                },
                transaction
            );

            var createdInvitation = await GetInvitationDetails(
                db,
                invitationId,
                transaction
            );

            await transaction.CommitAsync();
            return createdInvitation;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<TaskInvitationDetailsModel?> RespondToInvitation(
        int invitationId,
        int invitedUserId,
        string decision
    )
    {
        if (decision != InvitationStatuses.Accepted && decision != InvitationStatuses.Rejected)
        {
            throw new ArgumentOutOfRangeException(
                nameof(decision),
                "Invitation decision must be accepted or rejected."
            );
        }

        using var db = (SqlConnection)sqlConnectionFactory.CreateConnection();
        await db.OpenAsync();

        using var transaction = await db.BeginTransactionAsync();

        try
        {
            var updatedRows = await db.ExecuteAsync(
                """
                UPDATE dbo.TaskInvitations
                SET Status = @Decision,
                    RespondedAt = SYSUTCDATETIME()
                WHERE Id = @InvitationId
                  AND InvitedUserId = @InvitedUserId
                  AND Status = @PendingStatus
                """,
                new
                {
                    InvitationId = invitationId,
                    InvitedUserId = invitedUserId,
                    Decision = decision,
                    PendingStatus = InvitationStatuses.Pending
                },
                transaction
            );

            if (updatedRows == 0)
            {
                await transaction.RollbackAsync();
                return null;
            }

            if (decision == InvitationStatuses.Accepted)
            {
                await db.ExecuteAsync(
                    """
                    INSERT INTO dbo.TaskAccess (TaskId, UserId, CanEdit)
                    SELECT invitation.TaskId,
                           @InvitedUserId,
                           0
                    FROM dbo.TaskInvitations invitation
                    WHERE invitation.Id = @InvitationId
                      AND NOT EXISTS (
                          SELECT 1
                          FROM dbo.TaskAccess access
                          WHERE access.TaskId = invitation.TaskId
                            AND access.UserId = @InvitedUserId
                      )
                    """,
                    new
                    {
                        InvitationId = invitationId,
                        InvitedUserId = invitedUserId
                    },
                    transaction
                );
            }

            var updatedInvitation = await GetInvitationDetails(
                db,
                invitationId,
                transaction
            );

            await transaction.CommitAsync();
            return updatedInvitation;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<TaskInvitationModel?> DeletePendingInvitation(
        int invitationId,
        int invitedByUserId
    )
    {
        using var db = sqlConnectionFactory.CreateConnection();

        return await db.QuerySingleOrDefaultAsync<TaskInvitationModel>(
            """
            DELETE invitation
            OUTPUT DELETED.Id,
                   DELETED.TaskId,
                   DELETED.InvitedUserId,
                   DELETED.InvitedEmail,
                   DELETED.InvitedByUserId,
                   DELETED.Status,
                   DELETED.CreatedAt,
                   DELETED.RespondedAt
            FROM dbo.TaskInvitations invitation
            INNER JOIN dbo.Tasks task ON task.Id = invitation.TaskId
            WHERE invitation.Id = @InvitationId
              AND invitation.InvitedByUserId = @InvitedByUserId
              AND task.OwnerUserId = @InvitedByUserId
              AND invitation.Status = @PendingStatus
            """,
            new
            {
                InvitationId = invitationId,
                InvitedByUserId = invitedByUserId,
                PendingStatus = InvitationStatuses.Pending
            }
        );
    }

    private static async Task<TaskInvitationDetailsModel> GetInvitationDetails(
        SqlConnection db,
        int invitationId,
        System.Data.IDbTransaction transaction
    )
    {
        return await db.QuerySingleAsync<TaskInvitationDetailsModel>(
            """
            SELECT invitation.Id,
                   invitation.TaskId,
                   task.Title AS TaskTitle,
                   invitation.InvitedUserId,
                   invitation.InvitedEmail,
                   invitation.InvitedByUserId,
                   inviter.Email AS InvitedByEmail,
                   COALESCE(profile.FirstName, '') AS InvitedByFirstName,
                   COALESCE(profile.LastName, '') AS InvitedByLastName,
                   invitation.Status,
                   invitation.CreatedAt,
                   invitation.RespondedAt,
                   CAST(
                       CASE WHEN EXISTS (
                           SELECT 1
                           FROM dbo.TaskAccess access
                           WHERE access.TaskId = invitation.TaskId
                             AND access.UserId = invitation.InvitedUserId
                       ) THEN 1 ELSE 0 END
                       AS bit
                   ) AS HasActiveAccess
            FROM dbo.TaskInvitations invitation
            INNER JOIN dbo.Tasks task ON task.Id = invitation.TaskId
            INNER JOIN dbo.Users inviter ON inviter.Id = invitation.InvitedByUserId
            LEFT JOIN dbo.UserProfiles profile ON profile.UserId = inviter.Id
            WHERE invitation.Id = @InvitationId
            """,
            new { InvitationId = invitationId },
            transaction
        );
    }
}
