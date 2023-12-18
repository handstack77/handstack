using System.Collections.Generic;

using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;

namespace HandStack.Web.MessageContract.Message
{
    public class DynamicRequest
    {
        public DynamicRequest()
        {
            ClientTag = "";
            AccessToken = "";
            Version = "";
            RequestID = "";
            Action = "";
            Environment = "";
            ReturnType = ExecuteDynamicTypeObject.Json;
            GlobalID = "";
            IsTransaction = false;
            DynamicObjects = new List<QueryObject>();
        }

        public string ClientTag;

        public string AccessToken;

        public string Version;

        public string RequestID;

        public Dictionary<string, string>? LoadOptions;

        public string Action;

        public string Environment;

        public ExecuteDynamicTypeObject ReturnType { get; set; }

        public string GlobalID { get; set; }

        public bool IsTransaction { get; set; }

        public List<QueryObject> DynamicObjects { get; set; }
    }
}
