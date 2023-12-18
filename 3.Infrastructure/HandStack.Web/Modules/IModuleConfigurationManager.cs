using System.Collections.Generic;

namespace HandStack.Web.Modules
{
    public interface IModuleConfigurationManager
    {
        IEnumerable<ModuleInfo> GetModules();
    }
}
