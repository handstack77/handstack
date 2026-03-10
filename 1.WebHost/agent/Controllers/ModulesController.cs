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
    [Route("modules")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class ModulesController : SettingsModuleControllerBase
    {
        public ModulesController(
            IOptionsMonitor<AgentOptions> optionsMonitor,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory)
            : base(optionsMonitor, httpClientFactory, loggerFactory)
        {
        }

        [HttpGet("{moduleId}")]
        public async Task<ActionResult> GetModule(string moduleId, [FromQuery(Name = "id")] string? targetId, CancellationToken cancellationToken)
        {
            var result = await base.GetModuleAsync(moduleId, targetId, cancellationToken);
            return ToOperationResult(result);
        }

        [HttpPost("{moduleId}")]
        public async Task<ActionResult> SaveModule(string moduleId, [FromQuery(Name = "id")] string? targetId, [FromBody] JsonObject payload, CancellationToken cancellationToken)
        {
            var result = await base.SaveModuleAsync(moduleId, targetId, payload, cancellationToken);
            return ToOperationResult(result);
        }
    }
}
