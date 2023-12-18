namespace HandStack.Web.MessageContract.DataObject
{
    public class ResponseObject
    {
        public ResponseObject()
        {
            ResponseID = "";
            ServiceID = "";
            ReturnType = "";
            Result = "";
            ExceptionText = "";
        }

        public string ResponseID { get; set; }

        public string ServiceID { get; set; }

        public string ReturnType { get; set; }

        public string Result { get; set; }

        public string ExceptionText { get; set; }
    }
}
