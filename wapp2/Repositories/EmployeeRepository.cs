using System.Data;
using Dapper;
using EmployeeManagementApi.Models;
using Microsoft.Data.SqlClient;

namespace EmployeeManagementApi.Repositories
{
    public class EmployeeRepository(IConfiguration config) : IEmployeeRepository
    {
        private readonly string _cs = config.GetConnectionString("DefaultConnection")!;

        public async Task<Employee?> GetEmployee(int id)
        {
            using IDbConnection db = new SqlConnection(_cs);
            return await db.QueryFirstOrDefaultAsync<Employee>("SELECT * FROM dbo.Employee WHERE Id = @id", new { id });
        }

        public async Task<IEnumerable<Employee>> GetEmployees()
        {
            using IDbConnection db = new SqlConnection(_cs);
            return await db.QueryAsync<Employee>("SELECT * FROM dbo.Employee");
        }

        public async Task<Employee> CreateEmployee(Employee employee)
        {
            using IDbConnection db = new SqlConnection(_cs);
            var sql = "INSERT INTO dbo.Employee (name, department) OUTPUT INSERTED.Id VALUES (@Name, @Department)";
            var id = await db.QuerySingleAsync<int>(sql, employee);
            employee.Id = id;
            return employee;
        }

        public async Task<Employee> UpdateEmployee(Employee employee)
        {
            using IDbConnection db = new SqlConnection(_cs);
            var sql = "UPDATE dbo.Employee SET name = @Name, department = @Department WHERE Id = @Id";
            await db.ExecuteAsync(sql, employee);
            return employee;
        }

        public async Task DeleteEmployee(int id)
        {
            using IDbConnection db = new SqlConnection(_cs);
            var sql = "DELETE FROM dbo.Employee WHERE Id = @id";
            await db.ExecuteAsync(sql, new { id });
        }
    }
}
