namespace transact.Entity
{
    public record PublicTransaction
    {
        public string ApplicationID { get; set; }
        public string ProjectID { get; set; }
        public string TransactionID { get; set; }

        public PublicTransaction()
        {
            ApplicationID = "";
            ProjectID = "";
            TransactionID = "";
        }
    }
}
