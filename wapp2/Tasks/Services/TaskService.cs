using Tasks.Models;
using Tasks.DTOs;
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

        public async Task<IEnumerable<SharedTaskResponse>> GetSharedTasks(int userId)
        {
            var tasks = await _repository.GetSharedTasks(userId);
            return tasks.Select(MapSharedTaskResponse);
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

        private static SharedTaskResponse MapSharedTaskResponse(SharedTaskDetailsModel task)
        {
            var ownerName = string.Join(
                " ",
                new[] { task.OwnerFirstName, task.OwnerLastName }
                    .Where(name => !string.IsNullOrWhiteSpace(name))
            );

            return new SharedTaskResponse
            {
                Id = task.Id,
                Title = task.Title,
                Category = task.Category,
                Description = task.Description,
                DueDate = task.DueDate,
                IsCompleted = task.IsCompleted,
                Priority = task.Priority,
                Status = task.Status,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                OwnerEmail = task.OwnerEmail,
                OwnerName = string.IsNullOrWhiteSpace(ownerName)
                    ? task.OwnerEmail
                    : ownerName,
                OwnerAvatarUrl = task.OwnerAvatarUrl,
                CanEdit = task.CanEdit,
                SharedAt = task.SharedAt
            };
        }
    }
}
