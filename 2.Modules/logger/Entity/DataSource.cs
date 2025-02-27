using Newtonsoft.Json;

namespace logger.Entity
{
    public partial record DataSource
    {
        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("TableName")]
        public string TableName { get; set; } = string.Empty;

        [JsonProperty("DataProvider")]
        public string DataProvider { get; set; } = string.Empty;

        [JsonProperty("RemovePeriod")]
        public int RemovePeriod { get; set; } = -30;

        [JsonProperty("ConnectionString")]
        public string ConnectionString { get; set; } = string.Empty;

        [JsonProperty("IsEncryption")]
        public string IsEncryption { get; set; } = string.Empty;
    }
}
