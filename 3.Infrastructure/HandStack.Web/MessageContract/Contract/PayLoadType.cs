using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class PayLoadType
    {
        [JsonProperty("property")]
        public Dictionary<string, object> Property { get; set; }

        [JsonProperty("mapID")]
        public string MapID { get; set; }

        [JsonProperty("dataMapInterface")]
        public string DataMapInterface { get; set; }

        [JsonProperty("dataMapCount")]
        public List<int> DataMapCount { get; set; }

        [JsonProperty("dataMapSet")]
        public List<List<DataMapItem>> DataMapSet { get; set; }

        [JsonProperty("dataMapSetRaw")]
        public List<string> DataMapSetRaw { get; set; }

        public PayLoadType()
        {
            Property = new Dictionary<string, object>();
            MapID = "";
            DataMapInterface = "";
            DataMapCount = new List<int>();
            DataMapSet = new List<List<DataMapItem>>();
            DataMapSetRaw = new List<string>();
        }
    }
}
