using System.Text.Json.Nodes;

namespace agent.Entity
{
    public sealed class ModuleSaveResponse : OperationResult
    {
        public string TargetId { get; set; } = "";

        public string ModuleId { get; set; } = "";

        public string ModulePath { get; set; } = "";

        public bool Saved { get; set; }

        public bool RuntimeApplied { get; set; }

        public JsonNode? RuntimeApplyResult { get; set; }

        public List<string> ChangedPaths { get; set; } = new List<string>();

        public List<string> RemovedPaths { get; set; } = new List<string>();

        public List<string> RestartRequiredPaths { get; set; } = new List<string>();
    }
}
