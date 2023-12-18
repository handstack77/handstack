using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class OutputAction
    {
        [JsonProperty("outputType")]
        public string OutputType { get; set; }

        [JsonProperty("nextTransactionID")]
        public string NextTransactionID { get; set; }

        [JsonProperty("nextFunctionID")]
        public string NextFunctionID { get; set; }

        [JsonProperty("reportName")]
        public string ReportName { get; set; }

        [JsonProperty("reportOptions")]
        public string ReportOptions { get; set; }

        [JsonProperty("screenID")]
        public string ScreenID { get; set; }

        public OutputAction()
        {
            OutputType = "";
            NextTransactionID = "";
            NextFunctionID = "";
            ReportName = "";
            ReportOptions = "";
            ScreenID = "";
        }
    }
}
