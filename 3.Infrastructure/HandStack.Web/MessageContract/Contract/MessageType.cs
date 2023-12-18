using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class MessageType
    {
        [JsonProperty("responseStatus")]
        public string ResponseStatus { get; set; }

        [JsonProperty("mainCode")]
        public string MainCode { get; set; }

        [JsonProperty("mainText")]
        public string MainText { get; set; }

        [JsonProperty("additions")]
        public List<Addition> Additions { get; set; }

        public MessageType()
        {
            ResponseStatus = "";
            MainCode = "";
            MainText = "";
            Additions = new List<Addition>();
        }
    }
}
