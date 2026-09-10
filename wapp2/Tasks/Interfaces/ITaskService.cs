using Tasks.Models;
using Tasks.DTOs;
namespace Tasks.Interfaces
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskModel>> GetTasks(int ownerUserId);
        Task<IEnumerable<SharedTaskResponse>> GetSharedTasks(int userId);
        Task<TaskModel?> GetTask(int id, int ownerUserId);
        Task<TaskModel> CreateTask(TaskModel task, int ownerUserId);
        Task<TaskModel> UpdateTask(TaskModel task, int ownerUserId);
        Task DeleteTask(int id, int ownerUserId);
    }
}
