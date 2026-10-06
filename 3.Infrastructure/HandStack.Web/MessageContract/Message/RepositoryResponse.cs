using System.Collections.Generic;

using HandStack.Web.MessageContract.DataObject;

namespace HandStack.Web.MessageContract.Message
{
    public class RepositoryResponse
    {
        public RepositoryResponse()
        {
            this.affect = 0;
            this.repositoryObject = new RepositoryObject();
            this.repositorysObject = [];
            this.repositoryItemObject = new RepositoryItemsObject();
            this.repositoryItemsObject = [];
        }

        public int affect { get; set; }

        public RepositoryObject repositoryObject { get; set; }

        public List<RepositoryObject> repositorysObject { get; set; }

        public RepositoryItemsObject repositoryItemObject { get; set; }

        public List<RepositoryItemsObject> repositoryItemsObject { get; set; }
    }
}
