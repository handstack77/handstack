using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial record DataSource
    {
        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty(nameof(DataSourceID))]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionIsolationLevel))]
        public string TransactionIsolationLevel { get; set; } = "ReadCommitted";

        [JsonProperty(nameof(TanantPattern))]
        public string TanantPattern { get; set; } = string.Empty;

        [JsonProperty(nameof(TanantValue))]
        public string TanantValue { get; set; } = string.Empty;

        [JsonProperty(nameof(DataProvider))]
        public string DataProvider { get; set; } = string.Empty;

        [JsonProperty(nameof(ConnectionString))]
        public string ConnectionString { get; set; } = string.Empty;

        [JsonProperty(nameof(LLMProvider))]
        public string LLMProvider { get; set; } = string.Empty;

        [JsonProperty(nameof(ApiKey))]
        public string ApiKey { get; set; } = string.Empty;

        [JsonProperty(nameof(ModelID))]
        public string ModelID { get; set; } = string.Empty;

        [JsonProperty(nameof(Endpoint))]
        public string Endpoint { get; set; } = string.Empty;

        [JsonProperty(nameof(IsEncryption))]
        public string IsEncryption { get; set; } = string.Empty;

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; } = string.Empty;
    }
}
