using System;
using System.Collections.Generic;

using deploy.Entity;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace deploy.Controllers
{
    [ApiController]
    public abstract class DeployControllerBase : ControllerBase
    {
        protected ActionResult ToOperationResult(OperationResult result)
        {
            if (result.Success == true)
            {
                return Ok(result);
            }

            if (string.Equals(result.ErrorCode, "not_found", StringComparison.Ordinal) == true)
            {
                return NotFound(result);
            }

            if (string.Equals(result.ErrorCode, "invalid_payload", StringComparison.Ordinal) == true)
            {
                return BadRequest(result);
            }

            return Problem(
                title: "작업 실패",
                detail: result.Message,
                statusCode: StatusCodes.Status500InternalServerError,
                extensions: new Dictionary<string, object?>
                {
                    ["errorCode"] = result.ErrorCode,
                    ["errors"] = result.Errors
                });
        }
    }
}
