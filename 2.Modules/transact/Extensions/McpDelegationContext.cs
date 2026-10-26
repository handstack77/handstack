using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using transact.Entity;

namespace transact.Extensions
{
    public sealed class McpDelegationContext : IMcpDelegationContext
    {
        public McpDelegationOptions Options => ModuleConfiguration.McpDelegation;

        public BusinessContract? GetBusinessContract(string applicationID, string projectID, string transactionID)
        {
            return TransactionMapper.GetBusinessContract(applicationID, projectID, transactionID);
        }
    }
}
