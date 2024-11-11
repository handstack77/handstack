using System.Collections.Generic;

using HandStack.Web;
using HandStack.Web.Entity;

namespace prompter.Entity
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

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public bool IsLogServer { get; set; }

        public string LogServerUrl { get; set; }

        public List<string> ContractBasePath { get; set; }

        public bool IsTransactionLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public List<DataSource> LLMSource { get; set; }

        public List<string> AllowClientIP { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            ModuleBasePath = "";
            DatabaseContractPath = "";
            BusinessServerUrl = "";
            IsTransactionLogging = false;
            ModuleLogFilePath = "";
            IsLogServer = false;
            LogServerUrl = "";
            ContractBasePath = new List<string>();
            CircuitBreakResetSecond = 30;
            LLMSource = new List<DataSource>();
            AllowClientIP = new List<string>() { "*" };
        }
    }
}
