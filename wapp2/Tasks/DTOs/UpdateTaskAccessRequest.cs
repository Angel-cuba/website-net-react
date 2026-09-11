using System.ComponentModel.DataAnnotations;

namespace Tasks.DTOs;

public class UpdateTaskAccessRequest
{
    [Required]
    public bool? CanEdit { get; set; }
}
