using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class Route
    {
        [JsonProperty("systemID")]
        public string SystemID { get; set; }

        [JsonProperty("hostName")]
        public string HostName { get; set; }

        [JsonProperty("environment")]
        public string Environment { get; set; }

        [JsonProperty("requestTick")]
        public long RequestTick { get; set; }

        [JsonProperty("acceptTick")]
        public long AcceptTick { get; set; }

        [JsonProperty("responseTick")]
        public long ResponseTick { get; set; }

        public Route()
        {
            SystemID = "";
            HostName = "";
            Environment = "";
            RequestTick = 0;
            ResponseTick = 0;
        }
    }
}
