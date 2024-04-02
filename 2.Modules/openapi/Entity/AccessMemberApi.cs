using System.Collections.Generic;

using Newtonsoft.Json;

namespace openapi.Entity
{
    public partial class AccessMemberApi
    {
        [JsonProperty("AccessID")]
        public string AccessID { get; set; } = string.Empty;

        [JsonProperty("MemberNo")]
        public string MemberNo { get; set; } = string.Empty;

        [JsonProperty("SecretKey")]
        public string SecretKey { get; set; } = string.Empty;

        [JsonProperty("IPAddress")]
        public string IPAddress { get; set; } = string.Empty;

        [JsonProperty("AllowIPAddress")]
        public List<string> AllowIPAddress { get; set; } = new List<string>();

        [JsonProperty("LimitPeriod")]
        public string LimitPeriod { get; set; } = string.Empty;

        [JsonProperty("LimitCallCount")]
        public long LimitCallCount { get; set; } = 0;

        [JsonProperty("RequestCallCount")]
        public long RequestCallCount { get; set; } = 0;

        [JsonProperty("CumulativeCallCount")]
        public long CumulativeCallCount { get; set; } = 0;
    }
}
