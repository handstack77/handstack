using System.Collections.Generic;

using command.Extensions;

using Serilog;

namespace command.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "command";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static List<string> AllowClientIP = new List<string>() { "*" };
        public static bool IsBundledWithHost = false;
        public static bool IsContractFileWatching = true;
        public static List<string> ContractBasePath = new List<string>();
        public static Dictionary<string, FileSyncManager> CommandFileSyncManager = new Dictionary<string, FileSyncManager>();
        public static string BusinessServerUrl = "";
        public static bool IsTransactionLogging = false;
        public static string ModuleLogFilePath = "";
        public static int CircuitBreakResetSecond = 60;
        public static int DefaultCommandTimeout = 30;
        public static int DefaultMaxOutputBytes = 1048576;
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static ILogger? ModuleLogger = null;
    }
}

