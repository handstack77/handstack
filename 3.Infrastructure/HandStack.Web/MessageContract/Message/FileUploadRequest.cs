using System;

namespace HandStack.Web.MessageContract.Message
{
    public class FileUploadRequest
    {
        public FileUploadRequest()
        {
            IsFIle = false;
            FileName = "";
            Length = 0;
            LastWriteTime = null;
        }

        public bool IsFIle { get; set; }

        public string FileName { get; set; }

        public long Length { get; set; }

        public DateTime? LastWriteTime { get; set; }
    }
}
