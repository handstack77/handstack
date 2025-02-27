using HandStack.Web.MessageContract.DataObject;

using Microsoft.SemanticKernel;

using prompter.Entity;
using prompter.Enumeration;

namespace prompter.Entity
{
    public record TransactionDynamicObjects
    {
        public QueryObject DynamicTransaction = new QueryObject();
        public PromptMap Statement = new PromptMap();
        public string ApiKey = string.Empty;
        public string ModelID = string.Empty;
        public string ServiceID = string.Empty;
        public string Endpoint = string.Empty;
        public LLMProviders LLMProvider;
        public Kernel? PromptExecution;
        public string? FewShot = string.Empty;
        public string? ConversationHistory = string.Empty;
    }
}
