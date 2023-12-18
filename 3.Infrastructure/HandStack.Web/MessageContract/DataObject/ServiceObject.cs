using System.Collections.Generic;

namespace HandStack.Web.MessageContract.DataObject
{
    public class ServiceObject
    {
        public ServiceObject()
        {
            RequestID = "";
            ServiceID = "";
            ReturnType = "";
            ClientTag = "";
            DateTimeTicks = "";
            NameValues = new List<TransactField>();
        }

        public string RequestID { get; set; }

        public string ServiceID { get; set; }

        public string ReturnType { get; set; }

        public string ClientTag { get; set; }

        public string DateTimeTicks { get; set; }

        public List<TransactField> NameValues { get; set; }
    }
}
