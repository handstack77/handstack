using HandStack.Web.MessageContract.DataObject;

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
        public double? Temperature = null;
        public double? TopP = null;
        public int? MaxOutputTokens = null;
        public int? ContextTokens = null;
        public bool Think = false;
        public bool Stream = false;
        public LLMProviders LLMProvider;
        public string? FewShot = string.Empty;
        public string? ConversationHistory = string.Empty;
    }
}
