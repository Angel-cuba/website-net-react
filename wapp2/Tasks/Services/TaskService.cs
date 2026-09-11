using Tasks.Models;
using Tasks.DTOs;
using Tasks.Repositories;
using Tasks.Interfaces;
using Wapp2.Notifications.Interfaces;

namespace Tasks.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository _repository;
        private readonly IRealtimeNotifier _realtimeNotifier;

        public TaskService(
            ITaskRepository repository,
            IRealtimeNotifier realtimeNotifier
        )
        {
            _repository = repository;
            _realtimeNotifier = realtimeNotifier;
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

        public async Task<TaskSharingResponse?> GetTaskSharing(
            int taskId,
            int ownerUserId
        )
        {
            var sharing = await _repository.GetTaskSharing(taskId, ownerUserId);
            if (sharing == null)
            {
                return null;
            }

            return new TaskSharingResponse
            {
                TaskId = sharing.TaskId,
                TaskTitle = sharing.TaskTitle,
                PendingInvitations = sharing.PendingInvitations
                    .Select(invitation => new PendingTaskInvitationResponse
                    {
                        InvitationId = invitation.InvitationId,
                        InvitedEmail = invitation.InvitedEmail,
                        InvitedName = FormatDisplayName(
                            invitation.InvitedFirstName,
                            invitation.InvitedLastName,
                            invitation.InvitedEmail
                        ),
                        InvitedAvatarUrl = invitation.InvitedAvatarUrl,
                        CreatedAt = invitation.CreatedAt
                    })
                    .ToList(),
                Members = sharing.Members
                    .Select(member => new TaskAccessResponse
                    {
                        AccessId = member.AccessId,
                        Email = member.Email,
                        Name = FormatDisplayName(
                            member.FirstName,
                            member.LastName,
                            member.Email
                        ),
                        AvatarUrl = member.AvatarUrl,
                        CanEdit = member.CanEdit,
                        SharedAt = member.SharedAt
                    })
                    .ToList()
            };
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
            var sharedUserIds = (
                await _repository.GetTaskAccessUserIds(taskModel.Id, ownerUserId)
            ).ToList();
            var updatedTask = await _repository.UpdateTask(taskModel, ownerUserId);

            await NotifySharedTasksChanged(sharedUserIds);
            return updatedTask;
        }

        public async Task DeleteTask(int id, int ownerUserId)
        {
            var existingTask = await _repository.GetTask(id, ownerUserId);
            if (existingTask == null)
            {
                throw new KeyNotFoundException($"Task with Id {id} not found.");
            }
            var sharedUserIds = (
                await _repository.GetTaskAccessUserIds(id, ownerUserId)
            ).ToList();
            await _repository.DeleteTask(id, ownerUserId);
            await NotifySharedTasksChanged(sharedUserIds);
        }

        public async Task<bool> RevokeTaskAccess(
            int taskId,
            int accessId,
            int ownerUserId
        )
        {
            var revokedUserId = await _repository.DeleteTaskAccess(
                taskId,
                accessId,
                ownerUserId
            );

            if (revokedUserId is not int userId)
            {
                return false;
            }

            await _realtimeNotifier.SharedTasksChanged(userId);
            await _realtimeNotifier.TaskSharingChanged(ownerUserId);
            return true;
        }

        private Task NotifySharedTasksChanged(IEnumerable<int> userIds)
        {
            return Task.WhenAll(userIds.Select(_realtimeNotifier.SharedTasksChanged));
        }

        private static SharedTaskResponse MapSharedTaskResponse(SharedTaskDetailsModel task)
        {
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
                OwnerName = FormatDisplayName(
                    task.OwnerFirstName,
                    task.OwnerLastName,
                    task.OwnerEmail
                ),
                OwnerAvatarUrl = task.OwnerAvatarUrl,
                CanEdit = task.CanEdit,
                SharedAt = task.SharedAt
            };
        }

        private static string FormatDisplayName(
            string firstName,
            string lastName,
            string fallback
        )
        {
            var displayName = string.Join(
                " ",
                new[] { firstName, lastName }
                    .Where(name => !string.IsNullOrWhiteSpace(name))
            );

            return string.IsNullOrWhiteSpace(displayName) ? fallback : displayName;
        }
    }
}
