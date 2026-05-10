using System.Collections.Generic;

using HandStack.Web;
using HandStack.Web.Entity;

namespace command.Entity
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

        public int CircuitBreakResetSecond { get; set; }

        public int DefaultCommandTimeout { get; set; }

        public int DefaultMaxOutputBytes { get; set; }

        public bool IsLogServer { get; set; }

        public string LogServerUrl { get; set; }

        public bool IsContractFileWatching { get; set; }

        public List<string> ContractBasePath { get; set; }

        public bool IsTransactionLogging { get; set; }

        public string ModuleLogFilePath { get; set; }

        public List<string> AllowClientIP { get; set; }

        public ModuleSecurityConfig Security { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            BusinessServerUrl = "";
            CircuitBreakResetSecond = 60;
            DefaultCommandTimeout = 30;
            DefaultMaxOutputBytes = 1048576;
            IsLogServer = false;
            LogServerUrl = "";
            IsContractFileWatching = false;
            ContractBasePath = new List<string>();
            IsTransactionLogging = false;
            ModuleLogFilePath = "";
            AllowClientIP = new List<string>() { "*" };
            Security = new ModuleSecurityConfig();
        }
    }

    public record ModuleSecurityConfig
    {
        public List<string> AllowedExecutableBasePaths { get; set; }

        public List<string> BlockedForwardHeaders { get; set; }

        public ModuleSecurityConfig()
        {
            AllowedExecutableBasePaths = new List<string>();
            BlockedForwardHeaders = new List<string>() { "Host", "Content-Length", "Transfer-Encoding", "Connection", "Upgrade", "Proxy-Authorization" };
        }
    }
}
