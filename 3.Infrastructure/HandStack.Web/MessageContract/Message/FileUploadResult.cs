using System.Collections.Generic;

namespace HandStack.Web.MessageContract.Message
{
    public class FileUploadResult
    {
        public FileUploadResult()
        {
            Result = false;
            Message = "";
            ItemID = "";
            RemainingCount = 0;
        }

        public bool Result { get; set; }

        public string Message { get; set; }

        public string ItemID { get; set; }

        public int RemainingCount { get; set; }
    }

    public class MultiFileUploadResult
    {
        public MultiFileUploadResult()
        {
            Result = false;
            Message = "";
            FileUploadResults = new List<FileUploadResult>();
            RemainingCount = 0;
        }

        public bool Result { get; set; }

        public string Message { get; set; }

        public List<FileUploadResult> FileUploadResults { get; set; }

        public int RemainingCount { get; set; }
    }
}
