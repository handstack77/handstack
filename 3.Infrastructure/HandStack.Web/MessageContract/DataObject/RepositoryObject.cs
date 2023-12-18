using System;
using System.Collections.Generic;

namespace HandStack.Web.MessageContract.DataObject
{
    public class RepositoryObject
    {
        public RepositoryObject()
        {
            RepositoryID = "";
            RepositoryName = "";
            PhysicalPath = "";
            IsVirtualPath = false;
            IsAutoPath = false;
            PolicyPath = "";
            IsMultiUpload = false;
            UseCompress = false;
            UploadExtensions = "";
            UploadCount = 0;
            UploadSizeLimit = 0;
            PolicyException = "";
            RedirectUrl = "";
            UseYN = false;
            Comment = "";
            CreatePersonID = "";
            CreateDate = DateTime.Now;
            RepositoryItems = new List<RepositoryItemsObject>();
        }

        public string RepositoryID { get; set; }

        public string RepositoryName { get; set; }

        public string PhysicalPath { get; set; }

        public bool IsVirtualPath { get; set; }

        public bool IsAutoPath { get; set; }

        public string PolicyPath { get; set; }

        public bool IsMultiUpload { get; set; }

        public bool UseCompress { get; set; }

        public string UploadExtensions { get; set; }

        public int UploadCount { get; set; }

        public int UploadSizeLimit { get; set; }

        public string PolicyException { get; set; }

        public string RedirectUrl { get; set; }

        public bool UseYN { get; set; }

        public string Comment { get; set; }

        public string CreatePersonID { get; set; }

        public DateTime CreateDate { get; set; }

        public List<RepositoryItemsObject> RepositoryItems { get; set; }
    }
}
