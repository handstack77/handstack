namespace HandStack.Web.MessageContract.DataObject
{
    public class ExceptionFault
    {
        public ExceptionFault()
        {
            Message = "";
            Source = "";
            StackTrace = "";
        }

        public string Message { get; set; }

        public string Source { get; set; }

        public string StackTrace { get; set; }
    }
}
