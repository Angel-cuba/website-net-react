namespace Wapp2.Shared.Security;

public interface ICurrentUserService
{
    int UserId { get; }
    string Email { get; }
}
