using Tasks.Models;
using Tasks.Repositories;
using Tasks.Interfaces;

namespace Tasks.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository _repository;

        public TaskService(ITaskRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<TaskModel>> GetTasks()
        {
            return await _repository.GetTasks();
        }

        public async Task<TaskModel?> GetTask(int id)
        {
            return await _repository.GetTask(id);
        }
        public async Task<TaskModel> CreateTask(TaskModel taskModel)
        {
            return await _repository.CreateTask(taskModel  );
        }

        public async Task<TaskModel> UpdateTask(TaskModel taskModel)
        {
            // Check if the task exists before updating
            var existingTask = await _repository.GetTask(taskModel.Id);
            if (existingTask == null)
            {
                throw new KeyNotFoundException($"Task with Id {taskModel.Id} not found.");
            }
            return await _repository.UpdateTask(taskModel);
        }

        public async Task DeleteTask(int id)
        {
            var existingTask = await _repository.GetTask(id);
            if (existingTask == null)
            {
                throw new KeyNotFoundException($"Task with Id {id} not found.");
            }
            await _repository.DeleteTask(id);
        }
    }
}
