using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.Contract
{
    public partial class ResultType
    {
        [JsonProperty("property")]
        public Dictionary<string, object>? Property { get; set; }

        [JsonProperty("outputAction")]
        public OutputAction OutputAction { get; set; }

        [JsonProperty("mapID")]
        public string DataSetID { get; set; }

        [JsonProperty("responseType")]
        public string ResponseType { get; set; }

        [JsonProperty("dataSetMeta")]
        public List<string> DataSetMeta { get; set; }

        [JsonProperty("dataMapCount")]
        public List<int> DataMapCount { get; set; }

        [JsonProperty("dataSet")]
        public List<DataMapItem> DataSet { get; set; }

        public ResultType()
        {
            ResponseType = "";
            Property = null;
            OutputAction = new OutputAction();
            DataSetID = "";
            DataSetMeta = new List<string>();
            DataMapCount = new List<int>();
            DataSet = new List<DataMapItem>();
        }
    }
}
