using System.Collections.Generic;

using HandStack.Web.MessageContract.Enumeration;

namespace HandStack.Web.MessageContract.Message
{
    public class MediatorResponse
    {
        public MediatorResponse()
        {
            Acknowledge = AcknowledgeType.Success;
            CorrelationID = "";
            ExceptionText = "";
            Version = "";
            ResponseID = "";
            Environment = "";
            ResultMeta = new List<string>();
            Result = null;
        }

        public AcknowledgeType Acknowledge;

        public string CorrelationID;

        public string ExceptionText;

        public string Version;

        public string ResponseID;

        public string Environment;

        public List<string> ResultMeta { get; set; }

        public dynamic? Result { get; set; }
    }
}
