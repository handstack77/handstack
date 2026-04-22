using Newtonsoft.Json;

namespace graphclient.Entity
{
    public record GraphDataSource
    {
        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty("DataSourceID")]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty("GraphProvider")]
        public string GraphProvider { get; set; } = string.Empty;

        [JsonProperty("ConnectionString")]
        public string ConnectionString { get; set; } = string.Empty;

        [JsonProperty("UserName")]
        public string UserName { get; set; } = string.Empty;

        [JsonProperty("Password")]
        public string Password { get; set; } = string.Empty;

        [JsonProperty("Database")]
        public string Database { get; set; } = string.Empty;

        [JsonProperty("IsEncryption")]
        public string IsEncryption { get; set; } = "N";

        [JsonProperty("Comment")]
        public string Comment { get; set; } = string.Empty;
    }
}
