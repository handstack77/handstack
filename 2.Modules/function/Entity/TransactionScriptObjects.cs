using HandStack.Web.MessageContract.DataObject;

namespace function.Entity
{
    public record TransactionScriptObjects
    {
        public QueryObject DynamicObject = new();
        public ModuleScriptMap ModuleScriptMap = new();
    }
}
