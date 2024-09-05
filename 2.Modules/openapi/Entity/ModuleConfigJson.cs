using System.Collections.Generic;

using HandStack.Web;
using HandStack.Web.Entity;

namespace openapi.Entity
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

        public string ModuleBasePath { get; set; }

        public string DatabaseContractPath { get; set; }

        public string ModuleConfigurationUrl { get; set; }

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public string ManagerEmailID { get; set; }

        public string ManagerSHA256Password { get; set; }

        public DataSource DataSource { get; set; }

        public string ModuleLogFilePath { get; set; }

        public bool IsLogServer { get; set; }

        public string LogServerUrl { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            ModuleBasePath = "";
            DatabaseContractPath = "";
            ManagerEmailID = "";
            ManagerSHA256Password = "";
            ModuleConfigurationUrl = "";
            DataSource = new DataSource();
            BusinessServerUrl = "";
            ModuleLogFilePath = "";
            IsLogServer = false;
            LogServerUrl = "";
            CircuitBreakResetSecond = 30;
        }
    }
}
