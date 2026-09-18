using System.Net;
using Tasks.Models;
using Tasks.DTOs;
using Tasks.Repositories;
using Tasks.Interfaces;
using Wapp2.Notifications.Interfaces;
using Wapp2.Shared.Middleware;

namespace Tasks.Services
{
    public class TaskService : ITaskService
    {
        private static readonly TimeSpan MinimumDueDateLeadTime = TimeSpan.FromHours(5);
        private readonly ITaskRepository _repository;
        private readonly IRealtimeNotifier _realtimeNotifier;
        private readonly TimeProvider _timeProvider;

        public TaskService(
            ITaskRepository repository,
            IRealtimeNotifier realtimeNotifier,
            TimeProvider timeProvider
        )
        {
            _repository = repository;
            _realtimeNotifier = realtimeNotifier;
            _timeProvider = timeProvider;
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

        public async Task<IEnumerable<OwnedSharedTaskResponse>> GetOwnedSharedTasks(
            int ownerUserId
        )
        {
            var tasks = await _repository.GetOwnedSharedTasks(ownerUserId);
            return tasks.Select(MapOwnedSharedTaskResponse);
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
                RecentResponses = sharing.RecentResponses
                    .Select(invitation => new TaskInvitationActivityResponse
                    {
                        InvitationId = invitation.InvitationId,
                        InvitedEmail = invitation.InvitedEmail,
                        InvitedName = FormatDisplayName(
                            invitation.InvitedFirstName,
                            invitation.InvitedLastName,
                            invitation.InvitedEmail
                        ),
                        InvitedAvatarUrl = invitation.InvitedAvatarUrl,
                        Status = invitation.Status,
                        RejectionReason = invitation.RejectionReason,
                        CreatedAt = invitation.CreatedAt,
                        RespondedAt = invitation.RespondedAt
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
            ValidateDueDate(taskModel);
            return await _repository.CreateTask(taskModel, ownerUserId);
        }

        public async Task<TaskModel> UpdateTask(TaskModel taskModel, int userId)
        {
            var updateAccess = await _repository.GetTaskUpdateAccess(
                taskModel.Id,
                userId
            );
            if (updateAccess == null)
            {
                throw new KeyNotFoundException($"Task with Id {taskModel.Id} not found.");
            }
            if (!updateAccess.CanEdit)
            {
                throw new ErrorHandlingMiddlewareException(
                    "You do not have permission to edit this task.",
                    HttpStatusCode.Forbidden
                );
            }

            ValidateDueDate(taskModel);
            var updatedTask = await _repository.UpdateTask(taskModel, userId);
            if (updatedTask == null)
            {
                throw new ErrorHandlingMiddlewareException(
                    "You do not have permission to edit this task.",
                    HttpStatusCode.Forbidden
                );
            }

            var sharedUserIds = (
                await _repository.GetTaskAccessUserIds(
                    taskModel.Id,
                    updateAccess.OwnerUserId
                )
            ).ToList();
            var invitedUserIds = (
                await _repository.GetTaskInvitationUserIds(
                    taskModel.Id,
                    updateAccess.OwnerUserId
                )
            ).ToList();

            await Task.WhenAll(
                NotifySharedTasksChanged(sharedUserIds),
                NotifyInvitationsChanged(invitedUserIds),
                _realtimeNotifier.TaskSharingChanged(updateAccess.OwnerUserId)
            );
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
            var invitedUserIds = (
                await _repository.GetTaskInvitationUserIds(id, ownerUserId)
            ).ToList();
            await _repository.DeleteTask(id, ownerUserId);
            await NotifySharedTasksChanged(sharedUserIds);
            await NotifyInvitationsChanged(invitedUserIds);
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
            await _realtimeNotifier.InvitationsChanged(userId);
            await _realtimeNotifier.TaskSharingChanged(ownerUserId);
            return true;
        }

        public async Task<bool> UpdateTaskAccessPermission(
            int taskId,
            int accessId,
            bool canEdit,
            int ownerUserId
        )
        {
            var affectedUserId = await _repository.UpdateTaskAccessPermission(
                taskId,
                accessId,
                canEdit,
                ownerUserId
            );

            if (affectedUserId is not int userId)
            {
                return false;
            }

            await Task.WhenAll(
                _realtimeNotifier.SharedTasksChanged(userId),
                _realtimeNotifier.TaskSharingChanged(ownerUserId)
            );
            return true;
        }

        private Task NotifySharedTasksChanged(IEnumerable<int> userIds)
        {
            return Task.WhenAll(userIds.Select(_realtimeNotifier.SharedTasksChanged));
        }

        private Task NotifyInvitationsChanged(IEnumerable<int> userIds)
        {
            return Task.WhenAll(userIds.Select(_realtimeNotifier.InvitationsChanged));
        }

        private void ValidateDueDate(TaskModel taskModel)
        {
            if (taskModel.DueDate is not DateTime dueDate)
            {
                return;
            }

            var dueDateUtc = dueDate.Kind switch
            {
                DateTimeKind.Utc => dueDate,
                DateTimeKind.Local => dueDate.ToUniversalTime(),
                DateTimeKind.Unspecified => DateTime.SpecifyKind(dueDate, DateTimeKind.Utc),
                _ => dueDate
            };
            var minimumDueDate = _timeProvider
                .GetUtcNow()
                .UtcDateTime
                .Add(MinimumDueDateLeadTime);

            if (dueDateUtc < minimumDueDate)
            {
                throw new ErrorHandlingMiddlewareException(
                    "Due date must be at least 5 hours from now.",
                    HttpStatusCode.BadRequest
                );
            }

            taskModel.DueDate = dueDateUtc;
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

        private static OwnedSharedTaskResponse MapOwnedSharedTaskResponse(
            OwnedSharedTaskDetailsModel task
        )
        {
            return new OwnedSharedTaskResponse
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
                ActiveAccessCount = task.ActiveAccessCount,
                PendingInvitationCount = task.PendingInvitationCount
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
