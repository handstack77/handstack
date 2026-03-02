using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;

using agent.Security;
using agent.Services;

using Microsoft.AspNetCore.Mvc;

namespace agent.Controllers
{
    [Route("settings")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class SettingsController : AgentControllerBase
    {
        private readonly ISettingsModuleService settingsModuleService;

        public SettingsController(ISettingsModuleService settingsModuleService)
        {
            this.settingsModuleService = settingsModuleService;
        }

        [HttpGet("{id}/status")]
        public async Task<ActionResult> GetStatus(string id, CancellationToken cancellationToken)
        {
            var result = await settingsModuleService.GetSettingsStatusAsync(id, cancellationToken);
            return ToOperationResult(result);
        }

        [HttpPost("{id}")]
        public async Task<ActionResult> Save(string id, [FromBody] JsonObject payload, CancellationToken cancellationToken)
        {
            var result = await settingsModuleService.SaveSettingsAsync(id, payload, cancellationToken);
            return ToOperationResult(result);
        }
    }
}
