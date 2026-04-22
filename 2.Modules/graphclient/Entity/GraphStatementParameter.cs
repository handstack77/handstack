using Newtonsoft.Json;

namespace graphclient.Entity
{
    public record GraphStatementParameter
    {
        [JsonProperty]
        public string Name { get; set; } = string.Empty;

        [JsonProperty]
        public string DefaultValue { get; set; } = string.Empty;

        [JsonProperty]
        public string TestValue { get; set; } = string.Empty;
    }
}
