using Tasks.Models;

namespace Tasks.Repositories
{
    public interface ITaskRepository
    {
        Task<TaskModel?> GetTask(int id);
        Task<IEnumerable<TaskModel>> GetTasks();
        Task<TaskModel> CreateTask(TaskModel task);
        Task<TaskModel> UpdateTask(TaskModel task);
        Task DeleteTask(int id);

    }
}
