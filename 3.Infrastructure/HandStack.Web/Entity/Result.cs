using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial class EntityResult
    {
        [JsonProperty("error")]
        public string ErrorText { get; set; } = string.Empty;

        [JsonProperty("message", NullValueHandling = NullValueHandling.Ignore)]
        public string? Message { get; set; } = null;

        [JsonProperty("response", NullValueHandling = NullValueHandling.Ignore)]
        public object? Response { get; set; } = null;
    }
}
