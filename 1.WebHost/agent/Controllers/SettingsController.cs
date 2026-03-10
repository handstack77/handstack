using System.Net.Http;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;

using agent.Options;
using agent.Security;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace agent.Controllers
{
    [Route("settings")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class SettingsController : SettingsModuleControllerBase
    {
        public SettingsController(
            IOptionsMonitor<AgentOptions> optionsMonitor,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory)
            : base(optionsMonitor, httpClientFactory, loggerFactory)
        {
        }

        [HttpGet("{id}/status")]
        public async Task<ActionResult> GetStatus(string id, CancellationToken cancellationToken)
        {
            var result = await base.GetSettingsStatusAsync(id, cancellationToken);
            return ToOperationResult(result);
        }

        [HttpPost("{id}")]
        public async Task<ActionResult> Save(string id, [FromBody] JsonObject payload, CancellationToken cancellationToken)
        {
            var result = await base.SaveSettingsAsync(id, payload, cancellationToken);
            return ToOperationResult(result);
        }
    }
}
