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

        public string AdministratorEmailID { get; set; }

        public string ModuleConfigurationUrl { get; set; }

        public string BusinessServerUrl { get; set; }

        public string ModuleBasePath { get; set; }

        public string DatabaseContractPath { get; set; }

        public string WWWRootBasePath { get; set; }

        public string ModuleFilePath { get; set; }

        public bool IsModuleLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public string ConnectionString { get; set; }

        public ModuleConfig()
        {
            ManagedAccessKey = "";
            EncryptionAES256Key = "";
            AuthorizationKey = "";
            AdministratorEmailID = "";
            ModuleConfigurationUrl = "";
            BusinessServerUrl = "";
            ModuleBasePath = "";
            DatabaseContractPath = "";
            WWWRootBasePath = "";
            ModuleFilePath = "";
            IsModuleLogging = false;
            ModuleLogFilePath = "";
            ConnectionString = "";
        }
    }
}
