using Newtonsoft.Json;

namespace graphclient.Entity
{
    public record GraphDataSource
    {
        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty(nameof(DataSourceID))]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty(nameof(GraphProvider))]
        public string GraphProvider { get; set; } = string.Empty;

        [JsonProperty(nameof(ConnectionString))]
        public string ConnectionString { get; set; } = string.Empty;

        [JsonProperty(nameof(UserName))]
        public string UserName { get; set; } = string.Empty;

        [JsonProperty(nameof(Password))]
        public string Password { get; set; } = string.Empty;

        [JsonProperty(nameof(Database))]
        public string Database { get; set; } = string.Empty;

        [JsonProperty(nameof(IsEncryption))]
        public string IsEncryption { get; set; } = "N";

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; } = string.Empty;
    }
}
