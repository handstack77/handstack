using System;

namespace HandStack.Web.Entity
{
    public partial class RepositoryItems
    {
        public string ApplicationID { get; set; } = "";

        public string RepositoryID { get; set; } = "";

        public string ItemID { get; set; } = "";

        public string DependencyID { get; set; } = "";

        public string FileName { get; set; } = "";

        public long SortingNo { get; set; } = 0;

        public string Comment { get; set; } = "";

        public string PhysicalPath { get; set; } = "";

        public string AbsolutePath { get; set; } = "";

        public string RelativePath { get; set; } = "";

        public string Extension { get; set; } = "";

        public long Size { get; set; } = 0;

        public string MD5 { get; set; } = "";

        public string MimeType { get; set; } = "";

        public DateTime? CreationTime { get; set; }

        public DateTime? LastWriteTime { get; set; }

        public string CustomPath1 { get; set; } = "";

        public string CustomPath2 { get; set; } = "";

        public string CustomPath3 { get; set; } = "";

        public string PolicyPath { get; set; } = "";

        public string CreatedMemberNo { get; set; } = "";

        public DateTime? CreatedAt { get; set; }

        public DateTime? ModifiedAt { get; set; }
    }

}
