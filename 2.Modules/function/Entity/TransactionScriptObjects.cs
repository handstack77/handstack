using HandStack.Web.MessageContract.DataObject;

namespace function.Entity
{
    public class TransactionScriptObjects
    {
        public QueryObject DynamicObject = new QueryObject();
        public ModuleScriptMap ModuleScriptMap = new ModuleScriptMap();
        public ModuleSourceMap? DataSourceMap = new ModuleSourceMap();
    }
}
