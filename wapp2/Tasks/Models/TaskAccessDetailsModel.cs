namespace Tasks.Models;

public class TaskAccessDetailsModel
{
    public int AccessId { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool CanEdit { get; set; }
    public DateTime SharedAt { get; set; }
}
