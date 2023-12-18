using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class InterfaceType
    {
        [JsonProperty("devicePlatform")]
        public string DevicePlatform { get; set; }

        [JsonProperty("interfaceID")]
        public string InterfaceID { get; set; }

        [JsonProperty("sourceIP")]
        public string SourceIP { get; set; }

        [JsonProperty("sourcePort")]
        public int SourcePort { get; set; }

        [JsonProperty("sourceMAC")]
        public string SourceMac { get; set; }

        [JsonProperty("connectionType")]
        public string ConnectionType { get; set; }

        [JsonProperty("timeout")]
        public int Timeout { get; set; }

        public InterfaceType()
        {
            DevicePlatform = "";
            InterfaceID = "";
            SourceIP = "";
            SourcePort = 0;
            SourceMac = "";
            ConnectionType = "";
            Timeout = 0;
        }
    }
}
