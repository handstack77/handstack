using System;
using System.Collections.Generic;

using HandStack.Web.MessageContract.Enumeration;

namespace HandStack.Web.MessageContract.Message
{
    public class DynamicResponse
    {
        public DynamicResponse()
        {
            Acknowledge = AcknowledgeType.Success;
            CorrelationID = "";
            ExceptionText = "";
            Informations = Array.Empty<string>();
            Version = "";
            ResponseID = "";
            Environment = "";
            RowsAffected = 0;
            ResultMeta = new List<string>();
            ResultJson = null;
            ResultObject = null;
            ResultInteger = 0;
        }

        public AcknowledgeType Acknowledge;

        public string CorrelationID;

        public string ExceptionText;

        public string[] Informations;

        public string Version;

        public string ResponseID;

        public string Environment;

        public int RowsAffected;

        public List<string> ResultMeta { get; set; }

        public dynamic? ResultJson { get; set; }

        public object? ResultObject { get; set; }

        public int ResultInteger { get; set; }
    }
}
