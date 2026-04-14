using System.Collections.Generic;

using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;

using Newtonsoft.Json.Linq;

namespace transact.Entity
{
    public class WorkflowRunResult
    {
        public WorkflowRunResult()
        {
            Success = false;
            ExceptionText = "";
            DataSet = new List<DataMapItem>();
            ResultMeta = new List<string>();
            Values = new Dictionary<string, JToken>(System.StringComparer.OrdinalIgnoreCase);
        }

        public bool Success { get; set; }

        public string ExceptionText { get; set; }

        public List<DataMapItem> DataSet { get; set; }

        public List<string> ResultMeta { get; set; }

        public Dictionary<string, JToken> Values { get; set; }
    }

    public sealed class WorkflowStepResult : WorkflowRunResult
    {
    }
}
