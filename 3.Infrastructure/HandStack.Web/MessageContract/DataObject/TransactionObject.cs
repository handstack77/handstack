using System.Collections.Generic;

namespace HandStack.Web.MessageContract.DataObject
{
    public class TransactionObject
    {
        public TransactionObject()
        {
            RequestID = "";
            GlobalID = "";
            TransactionID = "";
            ServiceID = "";
            TransactionScope = false;
            ClientTag = "";
            DateTimeTicks = "";
            ReturnType = "";
            InputsItemCount = new List<int>();
            Inputs = new List<List<TransactField>>();
        }

        public Dictionary<string, string>? LoadOptions { get; set; }

        public string RequestID { get; set; }

        public string GlobalID { get; set; }

        public string TransactionID { get; set; }

        public string ServiceID { get; set; }

        public bool TransactionScope { get; set; }

        public string ClientTag { get; set; }

        public string DateTimeTicks { get; set; }

        public string ReturnType { get; set; }

        public List<int> InputsItemCount { get; set; }

        public List<List<TransactField>> Inputs { get; set; }
    }
}
