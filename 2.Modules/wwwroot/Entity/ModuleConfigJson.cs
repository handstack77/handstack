using HandStack.Web;

namespace wwwroot.Entity
{
    public class ModuleConfigJson : ModuleSetting
    {
        public ModuleConfig ModuleConfig { get; set; }

        public ModuleConfigJson()
        {
            ModuleConfig = new ModuleConfig();
        }
    }

    public record ModuleConfig
    {
        public string AuthorizationKey { get; set; }

        public string BusinessServerUrl { get; set; }

        public string ContractRequestPath { get; set; }

        public string ContractBasePath { get; set; }

        public string WWWRootBasePath { get; set; }

        public string ModuleFilePath { get; set; }

        public bool IsModuleLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            BusinessServerUrl = "";
            ContractRequestPath = "";
            ContractBasePath = "";
            WWWRootBasePath = "";
            ModuleFilePath = "";
            IsModuleLogging = false;
            ModuleLogFilePath = "";
        }
    }
}
