using Newtonsoft.Json;

namespace openapi.Entity
{
    public partial record ApiDataSource
    {
        [JsonProperty("DataSourceID")]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty("DataProvider")]
        public string DataProvider { get; set; } = string.Empty;

        [JsonProperty("ConnectionString")]
        public string ConnectionString { get; set; } = string.Empty;

        [JsonProperty("IsEncryption")]
        public bool IsEncryption { get; set; } = false;
    }
}
