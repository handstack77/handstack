using System.Text.Json.Nodes;

namespace agent.Entity
{
    public sealed class SettingsSaveResponse : OperationResult
    {
        public string Id { get; set; } = "";

        public string AppSettingsPath { get; set; } = "";

        public bool Saved { get; set; }

        public List<string> ChangedKeys { get; set; } = new List<string>();

        public List<string> RemovedKeys { get; set; } = new List<string>();

        public bool RuntimeApplied { get; set; }

        public JsonNode? RuntimeApplyResult { get; set; }

        public List<string> RestartRequiredKeys { get; set; } = new List<string>();
    }
}
