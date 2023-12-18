using System.Collections.Generic;

using HandStack.Web.MessageContract.DataObject;

namespace HandStack.Web.MessageContract.Message
{
    public class RepositoryRequest
    {
        public RepositoryRequest()
        {
            GlobalID = "";
            RepositoryID = "";
            DependencyID = "";
            TemporaryID = "";
            ItemID = "";
            UseYN = false;
            this.repositoryObject = new RepositoryObject();
            this.repositoryItemsObject = new List<RepositoryItemsObject>();
        }

        public string GlobalID { get; set; }

        public string RepositoryID { get; set; }

        public string DependencyID { get; set; }

        public string TemporaryID { get; set; }

        public string ItemID { get; set; }

        public bool UseYN { get; set; }

        public RepositoryObject repositoryObject { get; set; }

        public List<RepositoryItemsObject> repositoryItemsObject { get; set; }
    }
}
