using System.Collections.Generic;
using System.Text.Json.Nodes;

namespace agent.Entity
{
    public sealed class SettingsStatusResponse : OperationResult
    {
        public string Id { get; set; } = "";

        public string RuntimeState { get; set; } = "Unknown";

        public JsonNode? RuntimeMessage { get; set; }
    }
}
