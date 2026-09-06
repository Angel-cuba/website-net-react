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

        public async Task<IEnumerable<TaskModel>> GetTasks(int ownerUserId)
        {
            return await _repository.GetTasks(ownerUserId);
        }

        public async Task<TaskModel?> GetTask(int id, int ownerUserId)
        {
            return await _repository.GetTask(id, ownerUserId);
        }

        public async Task<TaskModel> CreateTask(TaskModel taskModel, int ownerUserId)
        {
            return await _repository.CreateTask(taskModel, ownerUserId);
        }

        public async Task<TaskModel> UpdateTask(TaskModel taskModel, int ownerUserId)
        {
            var existingTask = await _repository.GetTask(taskModel.Id, ownerUserId);
            if (existingTask == null)
            {
                throw new KeyNotFoundException($"Task with Id {taskModel.Id} not found.");
            }
            return await _repository.UpdateTask(taskModel, ownerUserId);
        }

        public async Task DeleteTask(int id, int ownerUserId)
        {
            var existingTask = await _repository.GetTask(id, ownerUserId);
            if (existingTask == null)
            {
                throw new KeyNotFoundException($"Task with Id {id} not found.");
            }
            await _repository.DeleteTask(id, ownerUserId);
        }
    }
}
