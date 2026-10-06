using Newtonsoft.Json;

namespace prompter.Entity
{
    public record LLMSource
    {
        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty(nameof(DataSourceID))]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty(nameof(TanantPattern))]
        public string TanantPattern { get; set; } = string.Empty;

        [JsonProperty(nameof(TanantValue))]
        public string TanantValue { get; set; } = string.Empty;

        [JsonProperty(nameof(DataProvider))]
        public string DataProvider { get; set; } = string.Empty;

        [JsonProperty(nameof(LLMProvider))]
        public string LLMProvider { get; set; } = string.Empty;

        [JsonProperty(nameof(ApiKey))]
        public string ApiKey { get; set; } = string.Empty;

        [JsonProperty(nameof(ModelID))]
        public string ModelID { get; set; } = string.Empty;

        [JsonProperty(nameof(Endpoint))]
        public string Endpoint { get; set; } = string.Empty;

        [JsonProperty(nameof(Temperature))]
        public double? Temperature { get; set; }

        [JsonProperty(nameof(TopP))]
        public double? TopP { get; set; }

        [JsonProperty(nameof(MaxOutputTokens))]
        public int? MaxOutputTokens { get; set; }

        [JsonProperty(nameof(ContextTokens))]
        public int? ContextTokens { get; set; }

        [JsonProperty(nameof(Think))]
        public bool Think { get; set; } = false;

        [JsonProperty(nameof(Stream))]
        public bool Stream { get; set; } = false;

        [JsonProperty(nameof(IsEncryption))]
        public string IsEncryption { get; set; } = string.Empty;

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; } = string.Empty;
    }
}
