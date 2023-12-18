using System;
using System.Collections.Generic;

namespace transact.Entity
{
    public partial class Transaction
    {
        public string TX_ID { get; set; }
        public string ProjectID { get; set; }
        public string BusinessID { get; set; }
        public string TransactionID { get; set; }
        public string ServiceID { get; set; }
        public string ReturnType { get; set; }
        public bool AutoCommit { get; set; }
        public DateTimeOffset ModifiedDate { get; set; }
        public List<Input> Inputs { get; set; }

        public Transaction()
        {
            TX_ID = "";
            ProjectID = "";
            BusinessID = "";
            TransactionID = "";
            ServiceID = "";
            ReturnType = "";
            AutoCommit = false;
            ModifiedDate = DateTimeOffset.Now;
            Inputs = new List<Input>();
        }
    }
}
