using System.Text.Json.Nodes;

using agent.Security;
using agent.Services;

using Microsoft.AspNetCore.Mvc;

namespace agent.Controllers
{
    [Route("modules")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class ModulesController : AgentControllerBase
    {
        private readonly ISettingsModuleService settingsModuleService;

        public ModulesController(ISettingsModuleService settingsModuleService)
        {
            this.settingsModuleService = settingsModuleService;
        }

        [HttpGet("{moduleId}")]
        public async Task<ActionResult> GetModule(string moduleId, [FromQuery(Name = "id")] string? targetId, CancellationToken cancellationToken)
        {
            var result = await settingsModuleService.GetModuleAsync(moduleId, targetId, cancellationToken);
            return ToOperationResult(result);
        }

        [HttpPost("{moduleId}")]
        public async Task<ActionResult> SaveModule(string moduleId, [FromQuery(Name = "id")] string? targetId, [FromBody] JsonObject payload, CancellationToken cancellationToken)
        {
            var result = await settingsModuleService.SaveModuleAsync(moduleId, targetId, payload, cancellationToken);
            return ToOperationResult(result);
        }
    }
}
