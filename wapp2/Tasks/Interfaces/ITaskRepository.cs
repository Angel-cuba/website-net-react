using Tasks.Models;

namespace Tasks.Repositories
{
    public interface ITaskRepository
    {
        Task<TaskModel?> GetTask(int id, int ownerUserId);
        Task<IEnumerable<TaskModel>> GetTasks(int ownerUserId);
        Task<IEnumerable<SharedTaskDetailsModel>> GetSharedTasks(int userId);
        Task<TaskSharingDetailsModel?> GetTaskSharing(int taskId, int ownerUserId);
        Task<TaskModel> CreateTask(TaskModel task, int ownerUserId);
        Task<TaskModel> UpdateTask(TaskModel task, int ownerUserId);
        Task DeleteTask(int id, int ownerUserId);
        Task<bool> DeleteTaskAccess(int taskId, int accessId, int ownerUserId);
    }
}
