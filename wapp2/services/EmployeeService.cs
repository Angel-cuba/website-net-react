using EmployeeManagementApi.Models;
using EmployeeManagementApi.Repositories;
using EmployeeManagementApi.services.interfaces;

namespace EmployeeManagementApi.services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _repository;

        public EmployeeService(IEmployeeRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<Employee>> GetEmployees()
        {
            return await _repository.GetEmployees();
        }

        public async Task<Employee?> GetEmployee(int id)
        {
            return await _repository.GetEmployee(id);
        }
        public async Task<Employee> CreateEmployee(Employee employee)
        {
            return await _repository.CreateEmployee(employee);
        }

        public async Task<Employee> UpdateEmployee(Employee employee)
        {
            // Check if the employee exists before updating
            var existingEmployee = await _repository.GetEmployee(employee.Id);
            if (existingEmployee == null)
            {
                throw new KeyNotFoundException($"Employee with Id {employee.Id} not found.");
            }
            return await _repository.UpdateEmployee(employee);
        }

        public async Task DeleteEmployee(int id)
        {
            var existingEmployee = await _repository.GetEmployee(id);
            if (existingEmployee == null)
            {
                throw new KeyNotFoundException($"Employee with Id {id} not found.");                
            }
            await _repository.DeleteEmployee(id);
        }
    }
}