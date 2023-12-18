using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class Masking
    {
        [JsonProperty("targetFieldID")]
        public string TargetFieldID { get; set; }

        [JsonProperty("matchPattern")]
        public string MatchPattern { get; set; }

        public Masking()
        {
            TargetFieldID = "";
            MatchPattern = "";
        }
    }
}
