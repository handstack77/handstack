using System.Collections.Generic;

using graphclient.Extensions;

using Serilog;

namespace graphclient.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "graphclient";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static List<string> AllowClientIP = new() { "*" };
        public static bool IsBundledWithHost = false;
        public static bool IsContractFileWatching = true;
        public static List<string> ContractBasePath = new();
        public static Dictionary<string, FileSyncManager> GraphFileSyncManager = new();
        public static string BusinessServerUrl = "";
        public static bool IsTransactionLogging = false;
        public static string ModuleLogFilePath = "";
        public static bool IsProfileLogging = false;
        public static string ProfileLogFilePath = "";
        public static int CircuitBreakResetSecond = 60;
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static string DefaultDataSourceID = "";
        public static int DefaultCommandTimeout = 30;
        public static List<GraphDataSource> GraphDataSource = new();
        public static ILogger? ModuleLogger = null;
        public static ILogger? ProfileLogger = null;
    }
}
