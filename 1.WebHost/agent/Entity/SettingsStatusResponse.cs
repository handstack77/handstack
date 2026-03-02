using System.Collections.Generic;
using System.Text.Json.Nodes;

namespace agent.Entity
{
    public sealed class SettingsStatusResponse : OperationResult
    {
        public string Id { get; set; } = "";

        public string AppSettingsPath { get; set; } = "";

        public JsonNode? AppSettings { get; set; }

        public List<string> ConfiguredModules { get; set; } = new List<string>();

        public List<LoadedModuleItem> LoadedModules { get; set; } = new List<LoadedModuleItem>();

        public string RuntimeState { get; set; } = "Unknown";

        public string RuntimeMessage { get; set; } = "";
    }

    public sealed class LoadedModuleItem
    {
        public string ModuleID { get; set; } = "";

        public string Name { get; set; } = "";

        public string Version { get; set; } = "";

        public List<string> EventAction { get; set; } = new List<string>();

        public List<string> SubscribeAction { get; set; } = new List<string>();
    }
}
