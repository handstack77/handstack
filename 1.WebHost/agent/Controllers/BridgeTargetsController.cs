using System.Threading;
using System.Threading.Tasks;
using System.Net.Http;

using agent.Options;
using agent.Security;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace agent.Controllers
{
    [Route("bridge/targets")]
    [ServiceFilter(typeof(HostBridgeKeyActionFilter))]
    public sealed class BridgeTargetsController : TargetProcessControllerBase
    {
        public BridgeTargetsController(
            IOptionsMonitor<AgentOptions> optionsMonitor,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory)
            : base(optionsMonitor, httpClientFactory, loggerFactory)
        {
        }

        [HttpGet("{id}/status")]
        public async Task<ActionResult> GetStatus(string id, CancellationToken cancellationToken)
        {
            var status = await GetStatusAsync(id, cancellationToken);
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
            var result = await StartAsync(id, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{id}/stop")]
        public async Task<ActionResult> Stop(string id, CancellationToken cancellationToken)
        {
            var result = await StopAsync(id, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{id}/restart")]
        public async Task<ActionResult> Restart(string id, CancellationToken cancellationToken)
        {
            var result = await RestartAsync(id, cancellationToken);
            return ToCommandResult(result);
        }
    }
}
