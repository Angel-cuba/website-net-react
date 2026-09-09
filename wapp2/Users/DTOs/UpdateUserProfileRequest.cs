namespace Wapp2.Users.DTOs
{
    public class UpdateUserProfileRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
    }
}