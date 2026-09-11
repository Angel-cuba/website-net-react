using Tasks.Models;
using Tasks.DTOs;
using Tasks.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wapp2.Shared.Security;
using Wapp2.Shared.DTOs;

namespace Tasks.Controllers
{
    [Route("api/tasks/")]
    [ApiController]
    [Authorize]
    public class TaskController : ControllerBase
    {
        private readonly ITaskService _service;
        private readonly ICurrentUserService _currentUserService;

        public TaskController(ITaskService service, ICurrentUserService currentUserService)
        {
            _service = service;
            _currentUserService = currentUserService;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetTasks()
        {
            var tasks = await _service.GetTasks(_currentUserService.UserId);

            return Ok(tasks);
        }

        [HttpGet("shared")]
        public async Task<ActionResult<ApiResponse<IEnumerable<SharedTaskResponse>>>>
            GetSharedTasks()
        {
            var tasks = await _service.GetSharedTasks(_currentUserService.UserId);

            return Ok(ApiResponse<IEnumerable<SharedTaskResponse>>.Ok(
                tasks,
                "Shared tasks loaded successfully."
            ));
        }

        [HttpGet("shared/owned")]
        public async Task<ActionResult<ApiResponse<IEnumerable<OwnedSharedTaskResponse>>>>
            GetOwnedSharedTasks()
        {
            var tasks = await _service.GetOwnedSharedTasks(_currentUserService.UserId);

            return Ok(ApiResponse<IEnumerable<OwnedSharedTaskResponse>>.Ok(
                tasks,
                "Owned shared tasks loaded successfully."
            ));
        }

        [HttpGet("{id:int}/sharing")]
        public async Task<ActionResult<ApiResponse<TaskSharingResponse>>> GetTaskSharing(
            int id
        )
        {
            var sharing = await _service.GetTaskSharing(
                id,
                _currentUserService.UserId
            );

            if (sharing == null)
            {
                return NotFound(ApiResponse<TaskSharingResponse>.Fail("Task not found."));
            }

            return Ok(ApiResponse<TaskSharingResponse>.Ok(
                sharing,
                "Task sharing loaded successfully."
            ));
        }

        [HttpDelete("{id:int}/access/{accessId:int}")]
        public async Task<IActionResult> RevokeTaskAccess(int id, int accessId)
        {
            var deleted = await _service.RevokeTaskAccess(
                id,
                accessId,
                _currentUserService.UserId
            );

            if (!deleted)
            {
                return NotFound(ApiResponse<object>.Fail("Task access not found."));
            }

            return NoContent();
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTask(int id)
        {
            var task = await _service.GetTask(id, _currentUserService.UserId);
            if (task == null)
            {
                return NotFound();
            }
            return Ok(task);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateTask([FromBody] TaskModel task)
        {
            var createdTask = await _service.CreateTask(task, _currentUserService.UserId);

            return CreatedAtAction(nameof(GetTask), new { id = createdTask.Id }, createdTask);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskModel task)
        {
            task.Id = id;
            if (await _service.GetTask(id, _currentUserService.UserId) == null)
            {
                return NotFound();
            }

            var updatedTask = await _service.UpdateTask(task, _currentUserService.UserId);

            return Ok(updatedTask);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            if (await _service.GetTask(id, _currentUserService.UserId) == null)
            {
                return NotFound();
            }

            await _service.DeleteTask(id, _currentUserService.UserId);

            return NoContent();
        }
    }
}
