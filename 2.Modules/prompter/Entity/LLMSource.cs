using Newtonsoft.Json;

namespace prompter.Entity
{
    public record LLMSource
    {
        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty("DataSourceID")]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty("TanantPattern")]
        public string TanantPattern { get; set; } = string.Empty;

        [JsonProperty("TanantValue")]
        public string TanantValue { get; set; } = string.Empty;

        [JsonProperty("DataProvider")]
        public string DataProvider { get; set; } = string.Empty;

        [JsonProperty("LLMProvider")]
        public string LLMProvider { get; set; } = string.Empty;

        [JsonProperty("ApiKey")]
        public string ApiKey { get; set; } = string.Empty;

        [JsonProperty("ModelID")]
        public string ModelID { get; set; } = string.Empty;

        [JsonProperty("Endpoint")]
        public string Endpoint { get; set; } = string.Empty;

        [JsonProperty("Temperature")]
        public double? Temperature { get; set; }

        [JsonProperty("TopP")]
        public double? TopP { get; set; }

        [JsonProperty("MaxOutputTokens")]
        public int? MaxOutputTokens { get; set; }

        [JsonProperty("ContextTokens")]
        public int? ContextTokens { get; set; }

        [JsonProperty("Think")]
        public bool Think { get; set; } = false;

        [JsonProperty("Stream")]
        public bool Stream { get; set; } = false;

        [JsonProperty("IsEncryption")]
        public string IsEncryption { get; set; } = string.Empty;

        [JsonProperty("Comment")]
        public string Comment { get; set; } = string.Empty;
    }
}
