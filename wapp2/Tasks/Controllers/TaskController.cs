using Tasks.Repositories;
using Tasks.Models;
using Tasks.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;

namespace Tasks.Controllers
{
    [Route("api/tasks/")]
    [ApiController]
    public class TaskController: ControllerBase
    {
        private readonly ITaskService _service;

        public TaskController(ITaskService service)
        {
            _service = service;
        }
        [HttpGet("all")]
        public async Task<IActionResult> GetTasks()
        {
            var tasks = await _service.GetTasks();
            if (tasks == null || !tasks.Any())
            {
                return NotFound();
            }
            return Ok(tasks);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTask(int id)
        {
            var task = await _service.GetTask(id);
            if (task == null)
            {
                return NotFound();
            }
            return Ok(task);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateTask([FromBody] TaskModel task)
        {
            var createdTask = await _service.CreateTask(task);
            return CreatedAtAction(nameof(GetTask), new { id = createdTask.Id }, createdTask);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskModel task)
        {
            task.Id = id;
            if (await _service.GetTask(id) == null)
            {
                return NotFound();
            }
            var updatedTask = await _service.UpdateTask(task);
            return Ok(updatedTask);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            if (await _service.GetTask(id) == null)
            {
                return NotFound();
            }
            await _service.DeleteTask(id);
            return NoContent();
        }
    }
}