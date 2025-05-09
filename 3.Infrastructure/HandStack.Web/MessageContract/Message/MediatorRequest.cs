using System.Collections.Generic;

using HandStack.Web.MessageContract.Enumeration;

namespace HandStack.Web.MessageContract.Message
{
    public class MediatorRequest
    {
        public MediatorRequest()
        {
            ReturnType = ExecuteDynamicTypeObject.Json;
            ActionModuleID = "";
            SubscribeEventID = "";
            GlobalID = "";
            ApplicationID = "";
            BusinessID = "";
            TransactionID = "";
            Parameters = new Dictionary<string, object?>();
        }

        public ExecuteDynamicTypeObject ReturnType { get; set; }

        public string ActionModuleID { get; set; }

        public string SubscribeEventID { get; set; }

        public string GlobalID { get; set; }

        public string BusinessID { get; set; }

        public string ApplicationID { get; set; }

        public string TransactionID { get; set; }

        public Dictionary<string, object?> Parameters { get; set; }
    }
}
