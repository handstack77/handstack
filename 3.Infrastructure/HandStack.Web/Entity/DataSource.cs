using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial record DataSource
    {
        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty("DataSourceID")]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty("TransactionIsolationLevel")]
        public string TransactionIsolationLevel { get; set; } = "ReadCommitted";

        [JsonProperty("TanantPattern")]
        public string TanantPattern { get; set; } = string.Empty;

        [JsonProperty("TanantValue")]
        public string TanantValue { get; set; } = string.Empty;

        [JsonProperty("DataProvider")]
        public string DataProvider { get; set; } = string.Empty;

        [JsonProperty("ConnectionString")]
        public string ConnectionString { get; set; } = string.Empty;

        [JsonProperty("LLMProvider")]
        public string LLMProvider { get; set; } = string.Empty;

        [JsonProperty("ApiKey")]
        public string ApiKey { get; set; } = string.Empty;

        [JsonProperty("ModelID")]
        public string ModelID { get; set; } = string.Empty;

        [JsonProperty("Endpoint")]
        public string Endpoint { get; set; } = string.Empty;

        [JsonProperty("IsEncryption")]
        public string IsEncryption { get; set; } = string.Empty;

        [JsonProperty("Comment")]
        public string Comment { get; set; } = string.Empty;
    }
}
