using System.Collections.Generic;

using HandStack.Web;

namespace graphclient.Entity
{
    public class ModuleConfigJson : ModuleSetting
    {
        public ModuleConfig ModuleConfig { get; set; } = new ModuleConfig();
    }

    public record ModuleConfig
    {
        public string AuthorizationKey { get; set; } = "";

        public string BusinessServerUrl { get; set; } = "";

        public int CircuitBreakResetSecond { get; set; } = 60;

        public int DefaultCommandTimeout { get; set; } = 30;

        public bool IsLogServer { get; set; }

        public string LogServerUrl { get; set; } = "";

        public bool IsContractFileWatching { get; set; }

        public List<string> ContractBasePath { get; set; } = new();

        public bool IsTransactionLogging { get; set; }

        public string ModuleLogFilePath { get; set; } = "";

        public bool IsProfileLogging { get; set; }

        public string ProfileLogFilePath { get; set; } = "";

        public string DefaultDataSourceID { get; set; } = "";

        public List<GraphDataSource> GraphDataSource { get; set; } = new();

        public List<string> AllowClientIP { get; set; } = new() { "*" };

        public List<string> EventAction { get; set; } = new();

        public List<string> SubscribeAction { get; set; } = new();
    }
}
