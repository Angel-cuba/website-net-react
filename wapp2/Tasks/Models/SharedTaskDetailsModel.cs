namespace Tasks.Models;

public class SharedTaskDetailsModel : TaskModel
{
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerFirstName { get; set; } = string.Empty;
    public string OwnerLastName { get; set; } = string.Empty;
    public string? OwnerAvatarUrl { get; set; }
    public bool CanEdit { get; set; }
    public DateTime SharedAt { get; set; }
}
