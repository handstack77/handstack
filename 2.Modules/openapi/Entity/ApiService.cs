using Newtonsoft.Json;

namespace openapi.Entity
{
    public partial class ApiService
    {
        [JsonProperty("APIServiceID")]
        public string APIServiceID { get; set; } = string.Empty;

        [JsonProperty("InterfaceID")]
        public string InterfaceID { get; set; } = string.Empty;

        [JsonProperty("InterfaceName")]
        public string InterfaceName { get; set; } = string.Empty;

        [JsonProperty("DataSourceID")]
        public string DataSourceID { get; set; } = string.Empty;

        [JsonProperty("CommandText")]
        public string CommandText { get; set; } = string.Empty;

        [JsonProperty("DefaultFormat")]
        public string DefaultFormat { get; set; } = string.Empty;

        [JsonProperty("FormatJsonYN")]
        public bool FormatJsonYN { get; set; } = false;

        [JsonProperty("FormatXmlYN")]
        public bool FormatXmlYN { get; set; } = false;

        [JsonProperty("FormatSoapYN")]
        public bool FormatSoapYN { get; set; } = false;

        [JsonProperty("FormatRssYN")]
        public bool FormatRssYN { get; set; } = false;

        [JsonProperty("FormatAtomYN")]
        public bool FormatAtomYN { get; set; } = false;

        [JsonProperty("LimitPeriod")]
        public string LimitPeriod { get; set; } = string.Empty;

        [JsonProperty("LimitCallCount")]
        public long LimitCallCount { get; set; } = 0;

        [JsonProperty("IsLimitIPAddress")]
        public bool IsLimitIPAddress { get; set; } = false;

        [JsonProperty("AccessControl")]
        public string AccessControl { get; set; } = string.Empty;

        [JsonProperty("CacheDuration")]
        public long CacheDuration { get; set; } = 0;
    }
}
