using System;

namespace HandStack.Web.MessageContract.DataObject
{
    public class RepositoryItemsObject
    {
        public string ItemID = "";
        public string FileName = "";
        public int Sequence = 0;
        public string ItemSummery = "";
        public string AbsolutePath = "";
        public string RelativePath = "";
        public string Extension = "";
        public int Size = 0;
        public string RepositoryID = "";
        public string DependencyID = "";
        public string CustomID1 = "";
        public string CustomID2 = "";
        public string CustomID3 = "";
        public string PolicyPath = "";
        public int CreatePersonID = 0;
        public DateTime CreateDate = DateTime.Now;
    }
}
