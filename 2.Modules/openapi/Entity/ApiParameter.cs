using Newtonsoft.Json;

namespace openapi.Entity
{
    public partial class ApiParameter
    {
        [JsonProperty("ParameterID")]
        public string ParameterID { get; set; } = string.Empty;

        [JsonProperty("ParameterType")]
        public string ParameterType { get; set; } = string.Empty;

        [JsonProperty("DefaultValue")]
        public string DefaultValue { get; set; } = string.Empty;

        [JsonProperty("Length")]
        public long Length { get; set; } = 0;

        [JsonProperty("RequiredYN")]
        public bool RequiredYN { get; set; } = false;
    }
}
