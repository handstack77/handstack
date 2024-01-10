namespace HandStack.Web.MessageContract.Message
{
    public class DownloadRequest
    {
        public DownloadRequest()
        {
            UserWorkID = "";
            ApplicationID = "";
            RepositoryID = "";
            ItemID = "";
            BusinessID = "";
            FileMD5 = "";
            TokenID = "";
            Disposition = "";
        }

        public string UserWorkID { get; set; }

        public string ApplicationID { get; set; }

        public string RepositoryID { get; set; }

        public string ItemID { get; set; }

        public string BusinessID { get; set; }

        public string FileMD5 { get; set; }

        public string TokenID { get; set; }

        public string Disposition { get; set; }
    }
}
