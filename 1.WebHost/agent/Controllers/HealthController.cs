using System;

using agent.Security;

using Microsoft.AspNetCore.Mvc;

namespace agent.Controllers
{
    [Route("")]
    public sealed class HealthController : AgentControllerBase
    {
        [HttpGet("")]
        public ActionResult Get()
        {
            return Ok(new
            {
                name = "handstack-agent",
                utcNow = DateTimeOffset.UtcNow,
                status = "ok"
            });
        }

        [HttpGet("validate/{key}")]
        public ActionResult Validate(string key, [FromServices] ManagementKeyValidator validator)
        {
            return Ok(new
            {
                valid = validator.Validate(key),
                header = validator.ManagementHeaderName
            });
        }
    }
}
