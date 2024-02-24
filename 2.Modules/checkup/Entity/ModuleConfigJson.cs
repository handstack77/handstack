using HandStack.Web;

namespace checkup.Entity
{
    public class ModuleConfigJson : ModuleSetting
    {
        public ModuleConfig ModuleConfig { get; set; }

        public ModuleConfigJson()
        {
            ModuleConfig = new ModuleConfig();
        }
    }

    public class ModuleConfig
    {
        public string AuthorizationKey { get; set; }

        public string ManagedAccessKey { get; set; }

        public string EncryptionAES256Key { get; set; }

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public int DefaultCommandTimeout { get; set; }

        public bool IsExceptionDetailText { get; set; }

        public bool IsLogServer { get; set; }

        public bool IsContractFileUpdateToCaching { get; set; }

        public string LocalStoragePath { get; set; }

        public string LogServerUrl { get; set; }

        public string ModuleBasePath { get; set; }

        public string DatabaseContractPath { get; set; }

        public string TransactionContractPath { get; set; }

        public string FunctionContractPath { get; set; }

        public string WWWRootBasePath { get; set; }

        public string ModuleFilePath { get; set; }

        public bool IsModuleLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public int ModuleLogFileSizeLimitBytes { get; set; }

        public int ModuleMaxRollingFiles { get; set; }

        public string ConnectionString { get; set; }

        public ModuleConfig()
        {
            ManagedAccessKey = "";
            EncryptionAES256Key = "";
            AuthorizationKey = "";
            BusinessServerUrl = "";
            CircuitBreakResetSecond = 60;
            DefaultCommandTimeout = 30;
            IsExceptionDetailText = false;
            IsLogServer = false;
            IsContractFileUpdateToCaching = false;
            LocalStoragePath = "";
            LogServerUrl = "";
            ModuleBasePath = "";
            DatabaseContractPath = "";
            TransactionContractPath = "";
            FunctionContractPath = "";
            WWWRootBasePath = "";
            ModuleFilePath = "";
            IsModuleLogging = false;
            ModuleLogFilePath = "";
            ModuleLogFileSizeLimitBytes = 104857600;
            ModuleMaxRollingFiles = 30;
            ConnectionString = "";
        }
    }
}
