using System.Collections.Generic;

using HandStack.Web;

namespace repository.Entity
{
    public class ModuleConfigJson : ModuleSetting
    {
        public ModuleConfig ModuleConfig { get; set; }

        public ModuleConfigJson()
        {
            ModuleID = "";
            Name = "";
            IsBundledWithHost = false;
            Version = "";
            ModuleConfig = new ModuleConfig();
        }
    }

    public record ModuleConfig
    {
        public string AuthorizationKey { get; set; }

        public string FileServerUrl { get; set; }

        public string BusinessServerUrl { get; set; }

        public List<string> ContractBasePath { get; set; }

        public string ModuleBasePath { get; set; }

        public string DatabaseContractPath { get; set; }

        public string ModuleFilePath { get; set; }

        public bool IsModuleLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public string XFrameOptions { get; set; }

        public string ContentSecurityPolicy { get; set; }

        public List<string> AllowClientIP { get; set; }

        public ModuleConfig()
        {
            FileServerUrl = "";
            DatabaseContractPath = "";
            AuthorizationKey = "";
            BusinessServerUrl = "";
            ContractBasePath = new List<string>();
            ModuleBasePath = "";
            ModuleFilePath = "";
            IsModuleLogging = false;
            ModuleLogFilePath = "";
            XFrameOptions = "";
            ContentSecurityPolicy = "";
            AllowClientIP = new List<string>() { "*" };
        }
    }
}
