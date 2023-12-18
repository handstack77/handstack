using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class DataMapItem
    {
        [JsonProperty("id")]
        public string FieldID { get; set; }

        [JsonProperty("value")]
        public object? Value { get; set; }

        public DataMapItem()
        {
            FieldID = "";
            Value = null;
        }
    }
}
