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

    public class ModuleConfig
    {
        public string AuthorizationKey { get; set; }

        public string FileServerUrl { get; set; }

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public int DefaultCommandTimeout { get; set; }

        public bool IsExceptionDetailText { get; set; }

        public bool IsLogServer { get; set; }

        public string LocalStoragePath { get; set; }

        public string LogServerUrl { get; set; }

        public List<string> ContractBasePath { get; set; }

        public string ModuleBasePath { get; set; }

        public string DatabaseContractPath { get; set; }

        public string ModuleFilePath { get; set; }

        public bool IsModuleLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public int ModuleLogFileSizeLimitBytes { get; set; }

        public int ModuleMaxRollingFiles { get; set; }

        public ModuleConfig()
        {
            FileServerUrl = "";
            DatabaseContractPath = "";
            AuthorizationKey = "";
            BusinessServerUrl = "";
            CircuitBreakResetSecond = 60;
            DefaultCommandTimeout = 30;
            IsExceptionDetailText = false;
            IsLogServer = false;
            LocalStoragePath = "";
            LogServerUrl = "";
            ContractBasePath = new List<string>();
            ModuleBasePath = "";
            ModuleFilePath = "";
            IsModuleLogging = false;
            ModuleLogFilePath = "";
            ModuleLogFileSizeLimitBytes = 104857600;
            ModuleMaxRollingFiles = 30;
        }
    }
}
