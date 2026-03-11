using System.Threading;
using System.Threading.Tasks;

using agent.Security;
using agent.Services;

using Microsoft.AspNetCore.Mvc;

namespace agent.Controllers
{
    [Route("bridge/targets")]
    [ServiceFilter(typeof(HostBridgeKeyActionFilter))]
    public sealed class BridgeTargetsController : AgentControllerBase
    {
        private readonly ITargetProcessManager targetProcessManager;

        public BridgeTargetsController(ITargetProcessManager targetProcessManager)
        {
            this.targetProcessManager = targetProcessManager;
        }

        [HttpGet("{id}/status")]
        public async Task<ActionResult> GetStatus(string id, CancellationToken cancellationToken)
        {
            var status = await targetProcessManager.GetStatusAsync(id, cancellationToken);
            if (status is null)
            {
                return NotFound(new
                {
                    id,
                    message = "대상을 찾을 수 없습니다."
                });
            }

            return Ok(status);
        }

        [HttpPost("{id}/start")]
        public async Task<ActionResult> Start(string id, CancellationToken cancellationToken)
        {
            var result = await targetProcessManager.StartAsync(id, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{id}/stop")]
        public async Task<ActionResult> Stop(string id, CancellationToken cancellationToken)
        {
            var result = await targetProcessManager.StopAsync(id, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{id}/restart")]
        public async Task<ActionResult> Restart(string id, CancellationToken cancellationToken)
        {
            var result = await targetProcessManager.RestartAsync(id, cancellationToken);
            return ToCommandResult(result);
        }
    }
}
