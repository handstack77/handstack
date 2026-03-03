using System.Threading;
using System.Threading.Tasks;

using agent.Security;
using agent.Services;

using Microsoft.AspNetCore.Mvc;

namespace agent.Controllers
{
    [Route("")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class MonitoringController : AgentControllerBase
    {
        private readonly IHostStatsProvider hostStatsProvider;

        public MonitoringController(IHostStatsProvider hostStatsProvider)
        {
            this.hostStatsProvider = hostStatsProvider;
        }

        [HttpGet("stats")]
        public async Task<ActionResult> GetStats(CancellationToken cancellationToken)
        {
            var stats = await hostStatsProvider.GetStatsAsync(cancellationToken);
            return Ok(stats);
        }
    }
}
