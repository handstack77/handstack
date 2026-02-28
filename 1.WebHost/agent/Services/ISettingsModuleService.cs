using System.Text.Json.Nodes;

using agent.Entity;

namespace agent.Services
{
    public interface ISettingsModuleService
    {
        Task<SettingsStatusResponse> GetSettingsStatusAsync(string targetId, CancellationToken cancellationToken);

        Task<SettingsSaveResponse> SaveSettingsAsync(string targetId, JsonObject payload, CancellationToken cancellationToken);

        Task<ModuleConfigResponse> GetModuleAsync(string moduleId, string? targetId, CancellationToken cancellationToken);

        Task<ModuleSaveResponse> SaveModuleAsync(string moduleId, string? targetId, JsonObject payload, CancellationToken cancellationToken);
    }
}
