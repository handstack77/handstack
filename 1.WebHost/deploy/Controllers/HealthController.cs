using System;

using Microsoft.AspNetCore.Mvc;

namespace deploy.Controllers
{
    [ApiController]
    public sealed class HealthController : ControllerBase
    {
        [HttpGet("/")]
        public IActionResult Get()
        {
            return Ok(new
            {
                name = "handstack-deploy",
                now = DateTimeOffset.UtcNow,
                status = "ok"
            });
        }
    }
}
