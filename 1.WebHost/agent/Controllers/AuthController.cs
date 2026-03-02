using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

using agent.Security;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;

namespace agent.Controllers
{
    [ApiController]
    [Route("auth")]
    public sealed class AuthController : ControllerBase
    {
        private const string CreatedAtClaimType = "handstack:created_at";
        private const string ExpiredAtClaimType = "handstack:expired_at";

        private readonly UserCredentialValidator userCredentialValidator;

        public AuthController(UserCredentialValidator userCredentialValidator)
        {
            this.userCredentialValidator = userCredentialValidator;
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest? request)
        {
            if (request is null)
            {
                return BadRequest(new
                {
                    message = "Request body is required."
                });
            }

            if (userCredentialValidator.TryValidate(request.EmailID, request.Password, out var user, out var errorCode) == false || user is null)
            {
                return Unauthorized(new
                {
                    message = "Invalid credentials.",
                    errorCode
                });
            }

            var identity = new ClaimsIdentity(CookieAuthenticationDefaults.AuthenticationScheme);
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.EmailID.Trim()));
            identity.AddClaim(new Claim(ClaimTypes.Email, user.EmailID.Trim()));
            identity.AddClaim(new Claim(ClaimTypes.Name, string.IsNullOrWhiteSpace(user.UserName) == true ? user.EmailID.Trim() : user.UserName.Trim()));
            identity.AddClaim(new Claim(CreatedAtClaimType, user.CreatedAt ?? ""));
            identity.AddClaim(new Claim(ExpiredAtClaimType, user.ExpiredAt ?? ""));

            var roles = ParseRoles(user.Roles);
            foreach (string role in roles)
            {
                identity.AddClaim(new Claim(ClaimTypes.Role, role));
            }

            var properties = new AuthenticationProperties
            {
                IsPersistent = true
            };

            if (UserCredentialValidator.TryParseDate(user.ExpiredAt, out var expiredAt) == true)
            {
                properties.ExpiresUtc = expiredAt;
            }

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                properties);

            return Ok(new
            {
                message = "Login successful.",
                user = BuildUserResponse(user.EmailID, new ClaimsPrincipal(identity))
            });
        }

        [HttpGet("me")]
        public ActionResult Me()
        {
            if (User.Identity?.IsAuthenticated != true)
            {
                return Unauthorized(new
                {
                    message = "User is not authenticated."
                });
            }

            var emailID = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
            return Ok(new
            {
                authenticated = true,
                user = BuildUserResponse(emailID, User)
            });
        }

        [HttpPost("logout")]
        public async Task<ActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            return Ok(new
            {
                message = "Logout successful."
            });
        }

        private static object BuildUserResponse(string emailID, ClaimsPrincipal principal)
        {
            return new
            {
                EmailID = emailID,
                UserName = principal.FindFirst(ClaimTypes.Name)?.Value ?? "",
                Roles = string.Join(",", principal.FindAll(ClaimTypes.Role).Select(claim => claim.Value)),
                ExpiredAt = principal.FindFirst(ExpiredAtClaimType)?.Value ?? "",
                CreatedAt = principal.FindFirst(CreatedAtClaimType)?.Value ?? ""
            };
        }

        private static IReadOnlyList<string> ParseRoles(string? roles)
        {
            if (string.IsNullOrWhiteSpace(roles) == true)
            {
                return Array.Empty<string>();
            }

            return roles
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(role => string.IsNullOrWhiteSpace(role) == false)
                .ToArray();
        }

        public sealed class LoginRequest
        {
            public string EmailID { get; set; } = "";

            public string Password { get; set; } = "";
        }
    }
}
