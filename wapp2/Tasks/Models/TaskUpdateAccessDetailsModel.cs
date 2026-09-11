namespace Tasks.Models;

public class TaskUpdateAccessDetailsModel
{
    public int OwnerUserId { get; set; }
    public bool CanEdit { get; set; }
}
