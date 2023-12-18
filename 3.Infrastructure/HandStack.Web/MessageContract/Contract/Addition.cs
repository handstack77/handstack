using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class Addition
    {
        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("code")]
        public string Code { get; set; }

        [JsonProperty("text")]
        public string Text { get; set; }

        public Addition()
        {
            Type = "";
            Code = "";
            Text = "";
        }
    }
}
