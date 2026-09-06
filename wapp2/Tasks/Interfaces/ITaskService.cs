using Tasks.Models;
namespace Tasks.Interfaces
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskModel>> GetTasks(int ownerUserId);
        Task<TaskModel?> GetTask(int id, int ownerUserId);
        Task<TaskModel> CreateTask(TaskModel task, int ownerUserId);
        Task<TaskModel> UpdateTask(TaskModel task, int ownerUserId);
        Task DeleteTask(int id, int ownerUserId);
    }
}
