using Tasks.Models;
namespace Tasks.Interfaces
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskModel>> GetTasks();
        Task<TaskModel?> GetTask(int id);
        Task<TaskModel> CreateTask(TaskModel task);
        Task<TaskModel> UpdateTask(TaskModel task);
        Task DeleteTask(int id);
    }
}
