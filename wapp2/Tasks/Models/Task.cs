using System.ComponentModel.DataAnnotations;

namespace Tasks.Models
{
    public class TaskModel
    {
        public int Id { get; set; }

        [Required, StringLength(150)]
        public string Title { get; set; } = string.Empty;

        [StringLength(50)]
        public string? Category { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        public int? OwnerUserId { get; set; }

        public DateTime? DueDate { get; set; }

        public bool IsCompleted { get; set; }

        [StringLength(20)]
        public string? Priority { get; set; }

        [Required, StringLength(20)]
        public string Status { get; set; } = "pending";

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
