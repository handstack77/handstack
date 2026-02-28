using agent.Security;
using agent.Services;

using Microsoft.AspNetCore.Mvc;

namespace agent.Controllers
{
    [Route("targets")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class TargetsController : AgentControllerBase
    {
        private readonly ITargetProcessManager targetProcessManager;
        private readonly ITargetAuditLogger auditLogger;

        public TargetsController(ITargetProcessManager targetProcessManager, ITargetAuditLogger auditLogger)
        {
            this.targetProcessManager = targetProcessManager;
            this.auditLogger = auditLogger;
        }

        [HttpGet("")]
        public async Task<ActionResult> GetTargets(CancellationToken cancellationToken)
        {
            var targets = targetProcessManager.GetTargets();
            await auditLogger.WriteTargetsAuditAsync(HttpContext, "targets.list", null, true, StatusCodes.Status200OK, $"count={targets.Count}", cancellationToken);
            return Ok(targets);
        }

        [HttpGet("{id}/status")]
        public async Task<ActionResult> GetStatus(string id, CancellationToken cancellationToken)
        {
            var status = await targetProcessManager.GetStatusAsync(id, cancellationToken);
            if (status is null)
            {
                await auditLogger.WriteTargetsAuditAsync(HttpContext, "targets.status", id, false, StatusCodes.Status404NotFound, "Target not found.", cancellationToken);
                return NotFound(new
                {
                    id,
                    message = "Target not found."
                });
            }

            await auditLogger.WriteTargetsAuditAsync(HttpContext, "targets.status", id, true, StatusCodes.Status200OK, status.State, cancellationToken);
            return Ok(status);
        }

        [HttpPost("{id}/start")]
        public async Task<ActionResult> Start(string id, CancellationToken cancellationToken)
        {
            var result = await targetProcessManager.StartAsync(id, cancellationToken);
            await auditLogger.WriteTargetsAuditAsync(HttpContext, "targets.start", id, result.Success, ToCommandStatusCode(result), result.Message, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{id}/stop")]
        public async Task<ActionResult> Stop(string id, CancellationToken cancellationToken)
        {
            var result = await targetProcessManager.StopAsync(id, cancellationToken);
            await auditLogger.WriteTargetsAuditAsync(HttpContext, "targets.stop", id, result.Success, ToCommandStatusCode(result), result.Message, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{id}/restart")]
        public async Task<ActionResult> Restart(string id, CancellationToken cancellationToken)
        {
            var result = await targetProcessManager.RestartAsync(id, cancellationToken);
            await auditLogger.WriteTargetsAuditAsync(HttpContext, "targets.restart", id, result.Success, ToCommandStatusCode(result), result.Message, cancellationToken);
            return ToCommandResult(result);
        }
    }
}
