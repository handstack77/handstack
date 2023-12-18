using System.Collections.Generic;
using System.Data;

using HandStack.Web.MessageContract.Enumeration;

namespace HandStack.Web.MessageContract.Message
{
    public class ApplicationResponse
    {
        public ApplicationResponse()
        {
            Acknowledge = AcknowledgeType.Success;
            CorrelationID = "";
            ExceptionText = "";
            ResultDataSet = null;
            ResultMeta = new List<string>();
            ResultJson = "";
            ResultObject = null;
            ResultInteger = 0;
        }

        public AcknowledgeType Acknowledge { get; set; }

        public string CorrelationID { get; set; }

        public string ExceptionText { get; set; }

        public DataSet? ResultDataSet { get; set; }

        public List<string> ResultMeta { get; set; }

        public string ResultJson { get; set; }

        public object? ResultObject { get; set; }

        public int ResultInteger { get; set; }
    }
}
