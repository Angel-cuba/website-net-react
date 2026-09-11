using Dapper;
using Microsoft.Data.SqlClient;
using Tasks.Models;
using Wapp2.Shared.Database;

namespace Tasks.Repositories
{
    public class TaskRepository(ISqlConnectionFactory sqlConnectionFactory) : ITaskRepository
    {
        private readonly ISqlConnectionFactory _sqlConnectionFactory = sqlConnectionFactory;

        public async Task<TaskModel?> GetTask(int id, int ownerUserId)
        {
            using var db = _sqlConnectionFactory.CreateConnection();
            return await db.QueryFirstOrDefaultAsync<TaskModel>(
                "SELECT * FROM dbo.Tasks WHERE Id = @Id AND OwnerUserId = @OwnerUserId",
                new { Id = id, OwnerUserId = ownerUserId }
            );
        }

        public async Task<IEnumerable<TaskModel>> GetTasks(int ownerUserId)
        {
            using var db = _sqlConnectionFactory.CreateConnection();
            return await db.QueryAsync<TaskModel>(
                "SELECT * FROM dbo.Tasks WHERE OwnerUserId = @OwnerUserId ORDER BY CreatedAt DESC",
                new { OwnerUserId = ownerUserId }
            );
        }

        public async Task<IEnumerable<SharedTaskDetailsModel>> GetSharedTasks(int userId)
        {
            using var db = _sqlConnectionFactory.CreateConnection();

            return await db.QueryAsync<SharedTaskDetailsModel>(
                """
                SELECT task.Id,
                       task.Title,
                       task.Category,
                       task.Description,
                       task.OwnerUserId,
                       task.DueDate,
                       task.IsCompleted,
                       task.Priority,
                       task.Status,
                       task.CreatedAt,
                       task.UpdatedAt,
                       owner.Email AS OwnerEmail,
                       COALESCE(profile.FirstName, '') AS OwnerFirstName,
                       COALESCE(profile.LastName, '') AS OwnerLastName,
                       profile.AvatarUrl AS OwnerAvatarUrl,
                       access.CanEdit,
                       access.CreatedAt AS SharedAt
                FROM dbo.TaskAccess access
                INNER JOIN dbo.Tasks task ON task.Id = access.TaskId
                INNER JOIN dbo.Users owner ON owner.Id = task.OwnerUserId
                LEFT JOIN dbo.UserProfiles profile ON profile.UserId = owner.Id
                WHERE access.UserId = @UserId
                ORDER BY access.CreatedAt DESC,
                         task.CreatedAt DESC
                """,
                new { UserId = userId }
            );
        }

        public async Task<IEnumerable<OwnedSharedTaskDetailsModel>> GetOwnedSharedTasks(
            int ownerUserId
        )
        {
            using var db = _sqlConnectionFactory.CreateConnection();

            return await db.QueryAsync<OwnedSharedTaskDetailsModel>(
                """
                SELECT task.Id,
                       task.Title,
                       task.Category,
                       task.Description,
                       task.OwnerUserId,
                       task.DueDate,
                       task.IsCompleted,
                       task.Priority,
                       task.Status,
                       task.CreatedAt,
                       task.UpdatedAt,
                       (
                           SELECT COUNT(*)
                           FROM dbo.TaskAccess access
                           WHERE access.TaskId = task.Id
                       ) AS ActiveAccessCount,
                       (
                           SELECT COUNT(*)
                           FROM dbo.TaskInvitations invitation
                           WHERE invitation.TaskId = task.Id
                             AND invitation.Status = @PendingStatus
                       ) AS PendingInvitationCount
                FROM dbo.Tasks task
                WHERE task.OwnerUserId = @OwnerUserId
                  AND (
                      EXISTS (
                          SELECT 1
                          FROM dbo.TaskAccess access
                          WHERE access.TaskId = task.Id
                      )
                      OR EXISTS (
                          SELECT 1
                          FROM dbo.TaskInvitations invitation
                          WHERE invitation.TaskId = task.Id
                            AND invitation.Status = @PendingStatus
                      )
                  )
                ORDER BY COALESCE(task.UpdatedAt, task.CreatedAt) DESC
                """,
                new
                {
                    OwnerUserId = ownerUserId,
                    PendingStatus = Wapp2.Invitations.Models.InvitationStatuses.Pending
                }
            );
        }

        public async Task<IEnumerable<int>> GetTaskAccessUserIds(
            int taskId,
            int ownerUserId
        )
        {
            using var db = _sqlConnectionFactory.CreateConnection();

            return await db.QueryAsync<int>(
                """
                SELECT access.UserId
                FROM dbo.TaskAccess access
                INNER JOIN dbo.Tasks task ON task.Id = access.TaskId
                WHERE access.TaskId = @TaskId
                  AND task.OwnerUserId = @OwnerUserId
                """,
                new { TaskId = taskId, OwnerUserId = ownerUserId }
            );
        }

        public async Task<IEnumerable<int>> GetTaskInvitationUserIds(
            int taskId,
            int ownerUserId
        )
        {
            using var db = _sqlConnectionFactory.CreateConnection();

            return await db.QueryAsync<int>(
                """
                SELECT DISTINCT invitation.InvitedUserId
                FROM dbo.TaskInvitations invitation
                INNER JOIN dbo.Tasks task ON task.Id = invitation.TaskId
                WHERE invitation.TaskId = @TaskId
                  AND invitation.InvitedUserId IS NOT NULL
                  AND task.OwnerUserId = @OwnerUserId
                """,
                new { TaskId = taskId, OwnerUserId = ownerUserId }
            );
        }

        public async Task<TaskUpdateAccessDetailsModel?> GetTaskUpdateAccess(
            int taskId,
            int userId
        )
        {
            using var db = _sqlConnectionFactory.CreateConnection();

            return await db.QuerySingleOrDefaultAsync<TaskUpdateAccessDetailsModel>(
                """
                SELECT task.OwnerUserId,
                       CAST(
                           CASE
                               WHEN task.OwnerUserId = @UserId OR access.CanEdit = 1 THEN 1
                               ELSE 0
                           END
                           AS bit
                       ) AS CanEdit
                FROM dbo.Tasks task
                LEFT JOIN dbo.TaskAccess access
                    ON access.TaskId = task.Id
                   AND access.UserId = @UserId
                WHERE task.Id = @TaskId
                  AND (
                      task.OwnerUserId = @UserId
                      OR access.Id IS NOT NULL
                  )
                """,
                new { TaskId = taskId, UserId = userId }
            );
        }

        public async Task<TaskSharingDetailsModel?> GetTaskSharing(
            int taskId,
            int ownerUserId
        )
        {
            using var db = _sqlConnectionFactory.CreateConnection();
            using var result = await db.QueryMultipleAsync(
                """
                SELECT Id AS TaskId,
                       Title AS TaskTitle
                FROM dbo.Tasks
                WHERE Id = @TaskId
                  AND OwnerUserId = @OwnerUserId;

                SELECT invitation.Id AS InvitationId,
                       invitation.InvitedUserId,
                       COALESCE(invitation.InvitedEmail, invited.Email, '') AS InvitedEmail,
                       COALESCE(profile.FirstName, '') AS InvitedFirstName,
                       COALESCE(profile.LastName, '') AS InvitedLastName,
                       profile.AvatarUrl AS InvitedAvatarUrl,
                       invitation.CreatedAt
                FROM dbo.TaskInvitations invitation
                INNER JOIN dbo.Tasks task ON task.Id = invitation.TaskId
                LEFT JOIN dbo.Users invited ON invited.Id = invitation.InvitedUserId
                LEFT JOIN dbo.UserProfiles profile ON profile.UserId = invited.Id
                WHERE invitation.TaskId = @TaskId
                  AND task.OwnerUserId = @OwnerUserId
                  AND invitation.Status = @PendingStatus
                ORDER BY invitation.CreatedAt DESC;

                SELECT access.Id AS AccessId,
                       access.UserId,
                       member.Email,
                       COALESCE(profile.FirstName, '') AS FirstName,
                       COALESCE(profile.LastName, '') AS LastName,
                       profile.AvatarUrl,
                       access.CanEdit,
                       access.CreatedAt AS SharedAt
                FROM dbo.TaskAccess access
                INNER JOIN dbo.Tasks task ON task.Id = access.TaskId
                INNER JOIN dbo.Users member ON member.Id = access.UserId
                LEFT JOIN dbo.UserProfiles profile ON profile.UserId = member.Id
                WHERE access.TaskId = @TaskId
                  AND task.OwnerUserId = @OwnerUserId
                ORDER BY access.CreatedAt DESC;
                """,
                new
                {
                    TaskId = taskId,
                    OwnerUserId = ownerUserId,
                    PendingStatus = Wapp2.Invitations.Models.InvitationStatuses.Pending
                }
            );

            var sharing = await result.ReadSingleOrDefaultAsync<TaskSharingDetailsModel>();
            var pendingInvitations = (
                await result.ReadAsync<TaskSharingInvitationDetailsModel>()
            ).AsList();
            var members = (await result.ReadAsync<TaskAccessDetailsModel>()).AsList();

            if (sharing == null)
            {
                return null;
            }

            sharing.PendingInvitations = pendingInvitations;
            sharing.Members = members;
            return sharing;
        }

        public async Task<TaskModel> CreateTask(TaskModel task, int ownerUserId)
        {
            using var db = _sqlConnectionFactory.CreateConnection();
            task.OwnerUserId = ownerUserId;

            var id = await db.QuerySingleAsync<int>(
                """
                INSERT INTO dbo.Tasks
                    (Title, Category, Description, OwnerUserId, DueDate, IsCompleted, Priority, Status)
                OUTPUT INSERTED.Id
                VALUES
                    (@Title, @Category, @Description, @OwnerUserId, @DueDate, @IsCompleted, @Priority, @Status)
                """,
                task
            );

            task.Id = id;
            return task;
        }

        public async Task<TaskModel?> UpdateTask(TaskModel task, int userId)
        {
            using var db = _sqlConnectionFactory.CreateConnection();
            return await db.QuerySingleOrDefaultAsync<TaskModel>(
                """
                UPDATE task
                SET Title = @Title,
                    Category = @Category,
                    Description = @Description,
                    DueDate = @DueDate,
                    IsCompleted = @IsCompleted,
                    Priority = @Priority,
                    Status = @Status,
                    UpdatedAt = SYSUTCDATETIME()
                OUTPUT INSERTED.Id,
                       INSERTED.Title,
                       INSERTED.Category,
                       INSERTED.Description,
                       INSERTED.OwnerUserId,
                       INSERTED.DueDate,
                       INSERTED.IsCompleted,
                       INSERTED.Priority,
                       INSERTED.Status,
                       INSERTED.CreatedAt,
                       INSERTED.UpdatedAt
                FROM dbo.Tasks task
                WHERE task.Id = @Id
                  AND (
                      task.OwnerUserId = @UserId
                      OR EXISTS (
                          SELECT 1
                          FROM dbo.TaskAccess access
                          WHERE access.TaskId = task.Id
                            AND access.UserId = @UserId
                            AND access.CanEdit = 1
                      )
                  )
                """,
                new
                {
                    task.Id,
                    task.Title,
                    task.Category,
                    task.Description,
                    task.DueDate,
                    task.IsCompleted,
                    task.Priority,
                    task.Status,
                    UserId = userId
                }
            );
        }

        public async Task DeleteTask(int id, int ownerUserId)
        {
            using var db = (SqlConnection)_sqlConnectionFactory.CreateConnection();
            await db.OpenAsync();

            using var transaction = await db.BeginTransactionAsync();

            try
            {
                var parameters = new { Id = id, OwnerUserId = ownerUserId };

                await db.ExecuteAsync(
                    """
                    DELETE access
                    FROM dbo.TaskAccess access
                    INNER JOIN dbo.Tasks task ON task.Id = access.TaskId
                    WHERE task.Id = @Id
                      AND task.OwnerUserId = @OwnerUserId
                    """,
                    parameters,
                    transaction
                );

                await db.ExecuteAsync(
                    """
                    DELETE invitation
                    FROM dbo.TaskInvitations invitation
                    INNER JOIN dbo.Tasks task ON task.Id = invitation.TaskId
                    WHERE task.Id = @Id
                      AND task.OwnerUserId = @OwnerUserId
                    """,
                    parameters,
                    transaction
                );

                await db.ExecuteAsync(
                    """
                    DELETE FROM dbo.Tasks
                    WHERE Id = @Id
                      AND OwnerUserId = @OwnerUserId
                    """,
                    parameters,
                    transaction
                );

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<int?> DeleteTaskAccess(
            int taskId,
            int accessId,
            int ownerUserId
        )
        {
            using var db = _sqlConnectionFactory.CreateConnection();

            return await db.QuerySingleOrDefaultAsync<int?>(
                """
                DELETE access
                OUTPUT DELETED.UserId
                FROM dbo.TaskAccess access
                INNER JOIN dbo.Tasks task ON task.Id = access.TaskId
                WHERE access.Id = @AccessId
                  AND access.TaskId = @TaskId
                  AND task.OwnerUserId = @OwnerUserId
                """,
                new
                {
                    TaskId = taskId,
                    AccessId = accessId,
                    OwnerUserId = ownerUserId
                }
            );
        }

        public async Task<int?> UpdateTaskAccessPermission(
            int taskId,
            int accessId,
            bool canEdit,
            int ownerUserId
        )
        {
            using var db = _sqlConnectionFactory.CreateConnection();

            return await db.QuerySingleOrDefaultAsync<int?>(
                """
                UPDATE access
                SET CanEdit = @CanEdit
                OUTPUT INSERTED.UserId
                FROM dbo.TaskAccess access
                INNER JOIN dbo.Tasks task ON task.Id = access.TaskId
                WHERE access.Id = @AccessId
                  AND access.TaskId = @TaskId
                  AND task.OwnerUserId = @OwnerUserId
                """,
                new
                {
                    TaskId = taskId,
                    AccessId = accessId,
                    CanEdit = canEdit,
                    OwnerUserId = ownerUserId
                }
            );
        }
    }
}
