using System.Text.Json.Nodes;

namespace agent.Entity
{
    public sealed class ModuleConfigResponse : OperationResult
    {
        public string TargetId { get; set; } = "";

        public string ModuleId { get; set; } = "";

        public string ModulePath { get; set; } = "";

        public bool IsLoaded { get; set; }

        public JsonNode? Module { get; set; }
    }
}
