using System;
using System.IO;

using YamlDotNet.Core.Tokens;

namespace HandStack.Web.MessageContract.Message
{
    public class DownloadResult
    {
        public DownloadResult()
        {
            Result = false;
            Message = "";
            FileName = "";
            MimeType = "";
            MD5 = "";
            Length = 0;
            CreationTime = null;
            LastWriteTime = null;
        }

        public bool Result { get; set; }

        public string Message { get; set; }

        public string FileName { get; set; }

        public string MimeType { get; set; }

        public string MD5 { get; set; }

        public long Length { get; set; }

        public DateTime? CreationTime { get; set; }

        public DateTime? LastWriteTime { get; set; }
    }
}
