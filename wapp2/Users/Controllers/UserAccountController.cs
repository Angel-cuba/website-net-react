using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wapp2.Shared.Security;
using Wapp2.Users.DTOs;
using Wapp2.Users.Interfaces;

namespace Wapp2.Users.Controllers;

[ApiController]
[Authorize]
[Route("api/user/account")]
public class UserAccountController(
    IUserAccountService userAccountService,
    ICurrentUserService currentUserService
) : ControllerBase
{
    [HttpDelete]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
    {
        await userAccountService.DeleteAccount(currentUserService.UserId, request);
        return NoContent();
    }
}
