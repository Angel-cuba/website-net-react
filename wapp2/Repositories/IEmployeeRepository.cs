using EmployeeManagementApi.Models;

namespace EmployeeManagementApi.Repositories
{
    public interface IEmployeeRepository
    {
        Task<Employee?> GetEmployee(int id);
        Task<IEnumerable<Employee>> GetEmployees();
        Task<Employee> CreateEmployee(Employee employee);
        Task<Employee> UpdateEmployee(Employee employee);
        Task DeleteEmployee(int id);

    }
}
