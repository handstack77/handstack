using System.Collections.Generic;

using HandStack.Web;
using HandStack.Web.Entity;

namespace dbclient.Entity
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

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public int DefaultCommandTimeout { get; set; }

        public bool IsLogServer { get; set; }

        public string LocalStoragePath { get; set; }

        public string LogServerUrl { get; set; }

        public List<string> ContractBasePath { get; set; }

        public bool IsTransactionLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public bool IsProfileLogging { get; set; }

        public string ProfileLogFilePath { get; set; }

        public List<DataSource> DataSource { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            BusinessServerUrl = "";
            CircuitBreakResetSecond = 60;
            DefaultCommandTimeout = 30;
            IsLogServer = false;
            LocalStoragePath = "";
            LogServerUrl = "";
            ContractBasePath = new List<string>();
            IsTransactionLogging = false;
            ModuleLogFilePath = "";
            IsProfileLogging = false;
            ProfileLogFilePath = "";
            DataSource = new List<DataSource>();
        }
    }
}
