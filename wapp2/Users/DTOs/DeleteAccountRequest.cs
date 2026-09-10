using System.ComponentModel.DataAnnotations;

namespace Wapp2.Users.DTOs;

public class DeleteAccountRequest
{
    [Required]
    public string Password { get; set; } = string.Empty;
}
