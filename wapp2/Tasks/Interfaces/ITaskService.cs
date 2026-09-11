using Tasks.Models;
using Tasks.DTOs;
namespace Tasks.Interfaces
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskModel>> GetTasks(int ownerUserId);
        Task<IEnumerable<SharedTaskResponse>> GetSharedTasks(int userId);
        Task<IEnumerable<OwnedSharedTaskResponse>> GetOwnedSharedTasks(int ownerUserId);
        Task<TaskSharingResponse?> GetTaskSharing(int taskId, int ownerUserId);
        Task<TaskModel?> GetTask(int id, int ownerUserId);
        Task<TaskModel> CreateTask(TaskModel task, int ownerUserId);
        Task<TaskModel> UpdateTask(TaskModel task, int ownerUserId);
        Task DeleteTask(int id, int ownerUserId);
        Task<bool> UpdateTaskAccessPermission(
            int taskId,
            int accessId,
            bool canEdit,
            int ownerUserId
        );
        Task<bool> RevokeTaskAccess(int taskId, int accessId, int ownerUserId);
    }
}
