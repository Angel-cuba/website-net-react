using EmployeeManagementApi.Repositories;
using EmployeeManagementApi.Models;
using EmployeeManagementApi.services.interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;

namespace EmployeeManagementApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController: ControllerBase
    {
        private readonly IEmployeeService _service;

        public EmployeeController(IEmployeeService service)
        {
            _service = service;
        }
        [HttpGet("all")]
        public async Task<IActionResult> GetEmployees()
        {
            var employees = await _service.GetEmployees();
            if (employees == null || !employees.Any())
            {
                return NotFound();
            }
            return Ok(employees);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetEmployee(int id)
        {
            var employee = await _service.GetEmployee(id);
            if (employee == null)
            {
                return NotFound();
            }
            return Ok(employee);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateEmployee([FromBody] Employee employee)
        {
            var createdEmployee = await _service.CreateEmployee(employee);
            return CreatedAtAction(nameof(GetEmployee), new { id = createdEmployee.Id }, createdEmployee);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] Employee employee)
        {
            employee.Id = id;
            if (await _service.GetEmployee(id) == null)
            {
                return NotFound();
            }
            var updatedEmployee = await _service.UpdateEmployee(employee);
            return Ok(updatedEmployee);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            if (await _service.GetEmployee(id) == null)
            {
                return NotFound();
            }
            await _service.DeleteEmployee(id);
            return NoContent();
        }
    }
}