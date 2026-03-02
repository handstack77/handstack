using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using agent.Security;
using agent.Services;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace agent.Controllers
{
    [Route("")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class MonitoringController : AgentControllerBase
    {
        private readonly IHostStatsProvider hostStatsProvider;
        private readonly ITargetProcessManager targetProcessManager;
        private readonly IDotNetMonitorCollector dotNetMonitorCollector;

        public MonitoringController(
            IHostStatsProvider hostStatsProvider,
            ITargetProcessManager targetProcessManager,
            IDotNetMonitorCollector dotNetMonitorCollector)
        {
            this.hostStatsProvider = hostStatsProvider;
            this.targetProcessManager = targetProcessManager;
            this.dotNetMonitorCollector = dotNetMonitorCollector;
        }

        [HttpGet("stats")]
        public async Task<ActionResult> GetStats(CancellationToken cancellationToken)
        {
            var stats = await hostStatsProvider.GetStatsAsync(cancellationToken);
            return Ok(stats);
        }

        [HttpGet("collect/{id}")]
        public async Task<ActionResult> Collect(string id, CancellationToken cancellationToken)
        {
            if (targetProcessManager.TryGetTarget(id, out var target) == false || target is null)
            {
                return NotFound(new
                {
                    id,
                    message = "Target not found."
                });
            }

            var status = await targetProcessManager.GetStatusAsync(id, cancellationToken);
            if (status?.Pid is null || string.Equals(status.State, "Running", StringComparison.OrdinalIgnoreCase) == false)
            {
                return BadRequest(new
                {
                    id,
                    message = "Target process is not running."
                });
            }

            var collectResult = await dotNetMonitorCollector.CollectAsync(target, status.Pid.Value, cancellationToken);
            if (collectResult.Success == true)
            {
                return Ok(collectResult);
            }

            return Problem(
                detail: collectResult.Message,
                title: "Collect failed",
                statusCode: StatusCodes.Status502BadGateway,
                extensions: new Dictionary<string, object?>
                {
                    ["targetId"] = collectResult.TargetId,
                    ["pid"] = collectResult.Pid,
                    ["directoryPath"] = collectResult.DirectoryPath,
                    ["errors"] = collectResult.Errors
                });
        }
    }
}
