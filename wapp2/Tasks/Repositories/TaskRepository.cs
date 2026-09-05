using Dapper;
using Tasks.Models;
using Wapp2.Shared.Database;

namespace Tasks.Repositories
{
    public class TaskRepository(ISqlConnectionFactory sqlConnectionFactory) : ITaskRepository
    {
        private readonly ISqlConnectionFactory _sqlConnectionFactory = sqlConnectionFactory;

        public async Task<TaskModel?> GetTask(int id)
        {
            using var db = _sqlConnectionFactory.CreateConnection();
            return await db.QueryFirstOrDefaultAsync<TaskModel>("SELECT * FROM dbo.Tasks WHERE Id = @Id", new { Id = id });
        }

        public async Task<IEnumerable<TaskModel>> GetTasks()
        {

            using var db = _sqlConnectionFactory.CreateConnection();
            return await db.QueryAsync<TaskModel>("SELECT * FROM dbo.Tasks");
        }

        public async Task<TaskModel> CreateTask(TaskModel task)
        {
            using var db = _sqlConnectionFactory.CreateConnection();
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
        public async Task<TaskModel> UpdateTask(TaskModel task)
        {
            using var db = _sqlConnectionFactory.CreateConnection();
            await db.ExecuteAsync(
                """
                UPDATE dbo.Tasks
                SET Title = @Title,
                    Category = @Category,
                    Description = @Description,
                    OwnerUserId = @OwnerUserId,
                    DueDate = @DueDate,
                    IsCompleted = @IsCompleted,
                    Priority = @Priority,
                    Status = @Status,
                    UpdatedAt = SYSUTCDATETIME()
                WHERE Id = @Id
                """,
                task
            );
            return task;
        }

        public async Task DeleteTask(int id)
        {
            using var db = _sqlConnectionFactory.CreateConnection();
            await db.ExecuteAsync("DELETE FROM dbo.Tasks WHERE Id = @Id", new { Id = id });
        }
    }
}
