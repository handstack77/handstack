using System.Collections.Generic;
using System.Threading.Tasks;

namespace HandStack.Web.Modules
{
    public interface IModuleConfigurationManager
    {
        Task<IEnumerable<ModuleInfo>> GetModulesAsync();
    }
}
