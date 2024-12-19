using System.Collections.Generic;

using HandStack.Web.Entity;

using prompter.Extensions;

using Serilog;

namespace prompter.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "prompter";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static List<string> AllowClientIP = new List<string>() { "*" };
        public static bool IsBundledWithHost = false;
        public static List<string> ContractBasePath = new List<string>();
        public static Dictionary<string, FileSyncManager> PromptFileSyncManager = new Dictionary<string, FileSyncManager>();
        public static string BusinessServerUrl = "";
        public static string ModuleBasePath = "";
        public static string DatabaseContractPath = "";
        public static int CircuitBreakResetSecond = 30;
        public static bool IsApiFindServer = false;
        public static bool IsTransactionLogging = false;
        public static string ModuleLogFilePath = "";
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static List<DataSource> LLMSource = new List<DataSource>();
        public static ILogger? ModuleLogger = null;
    }
}
