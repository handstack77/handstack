using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class TransactionType
    {
        [JsonProperty("globalID")]
        public string GlobalID { get; set; }

        [JsonProperty("businessID")]
        public string BusinessID { get; set; }

        [JsonProperty("transactionID")]
        public string TransactionID { get; set; }

        [JsonProperty("functionID")]
        public string FunctionID { get; set; }

        [JsonProperty("commandType")]
        public string CommandType { get; set; }

        [JsonProperty("simulationType")]
        public string SimulationType { get; set; }

        [JsonProperty("terminalGroupID")]
        public string TerminalGroupID { get; set; }

        [JsonProperty("operatorID")]
        public string OperatorID { get; set; }

        [JsonProperty("screenID")]
        public string ScreenID { get; set; }

        [JsonProperty("startTraceID")]
        public string StartTraceID { get; set; }

        [JsonProperty("dataFormat")]
        public string DataFormat { get; set; }

        [JsonProperty("compressionYN")]
        public string CompressionYN { get; set; }

        public TransactionType()
        {
            GlobalID = "";
            BusinessID = "";
            TransactionID = "";
            FunctionID = "";
            SimulationType = "";
            TerminalGroupID = "";
            OperatorID = "";
            ScreenID = "";
            StartTraceID = "";
            DataFormat = "";
            CompressionYN = "";
            CommandType = "";
        }
    }
}
