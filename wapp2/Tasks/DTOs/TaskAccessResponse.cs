namespace Tasks.DTOs;

public class TaskAccessResponse
{
    public int AccessId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool CanEdit { get; set; }
    public DateTime SharedAt { get; set; }
}
