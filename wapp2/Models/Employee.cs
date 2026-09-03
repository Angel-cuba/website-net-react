using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementApi.Models
{
    public class Employee
    {
        public int Id { get; set; }

        [Required, StringLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string Department { get; set; } = string.Empty;
    }
}
