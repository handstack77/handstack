using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial record Routing
    {
        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty(nameof(CommandType))]
        public string CommandType { get; set; } = string.Empty;

        [JsonProperty(nameof(Environment))]
        public string Environment { get; set; } = string.Empty;

        [JsonProperty(nameof(Uri))]
        public string Uri { get; set; } = string.Empty;

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; } = string.Empty;
    }
}
