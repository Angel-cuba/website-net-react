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

        public async Task<TaskModel> UpdateTask(TaskModel task, int ownerUserId)
        {
            using var db = _sqlConnectionFactory.CreateConnection();
            await db.ExecuteAsync(
                """
                UPDATE dbo.Tasks
                SET Title = @Title,
                    Category = @Category,
                    Description = @Description,
                    DueDate = @DueDate,
                    IsCompleted = @IsCompleted,
                    Priority = @Priority,
                    Status = @Status,
                    UpdatedAt = SYSUTCDATETIME()
                WHERE Id = @Id AND OwnerUserId = @OwnerUserId
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
                    OwnerUserId = ownerUserId
                }
            );
            task.OwnerUserId = ownerUserId;

            return task;
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
    }
}
