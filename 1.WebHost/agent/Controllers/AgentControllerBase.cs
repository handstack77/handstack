using System;
using System.Collections.Generic;

using agent.Entity;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace agent.Controllers
{
    [ApiController]
    public abstract class AgentControllerBase : ControllerBase
    {
        protected ActionResult ToCommandResult(TargetCommandResult result)
        {
            if (result.Success == true)
            {
                return Ok(result);
            }

            if (string.Equals(result.ErrorCode, "target_not_found", StringComparison.Ordinal) == true)
            {
                return NotFound(result);
            }

            if (string.Equals(result.ErrorCode, "already_running", StringComparison.Ordinal) == true)
            {
                return Conflict(result);
            }

            if (string.Equals(result.ErrorCode, "already_stopped", StringComparison.Ordinal) == true)
            {
                return Ok(result);
            }

            return BadRequest(result);
        }

        protected int ToCommandStatusCode(TargetCommandResult result)
        {
            if (result.Success == true)
            {
                return StatusCodes.Status200OK;
            }

            if (string.Equals(result.ErrorCode, "target_not_found", StringComparison.Ordinal) == true)
            {
                return StatusCodes.Status404NotFound;
            }

            if (string.Equals(result.ErrorCode, "already_running", StringComparison.Ordinal) == true)
            {
                return StatusCodes.Status409Conflict;
            }

            if (string.Equals(result.ErrorCode, "already_stopped", StringComparison.Ordinal) == true)
            {
                return StatusCodes.Status200OK;
            }

            return StatusCodes.Status400BadRequest;
        }

        protected ActionResult ToOperationResult(OperationResult result)
        {
            if (result.Success == true)
            {
                return Ok(result);
            }

            if (string.Equals(result.ErrorCode, "target_not_found", StringComparison.Ordinal) == true
                || string.Equals(result.ErrorCode, "appsettings_not_found", StringComparison.Ordinal) == true
                || string.Equals(result.ErrorCode, "module_file_not_found", StringComparison.Ordinal) == true
                || string.Equals(result.ErrorCode, "module_target_not_found", StringComparison.Ordinal) == true)
            {
                return NotFound(result);
            }

            if (string.Equals(result.ErrorCode, "invalid_payload", StringComparison.Ordinal) == true
                || string.Equals(result.ErrorCode, "invalid_module_id", StringComparison.Ordinal) == true
                || string.Equals(result.ErrorCode, "module_target_ambiguous", StringComparison.Ordinal) == true)
            {
                return BadRequest(result);
            }

            return Problem(
                title: "Operation failed",
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
