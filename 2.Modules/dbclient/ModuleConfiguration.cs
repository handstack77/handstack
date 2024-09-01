using System.Collections.Generic;

using dbclient.Extensions;

using HandStack.Web.Entity;

using Serilog;

namespace dbclient
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "dbclient";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static bool IsBundledWithHost = false;
        public static List<string> ContractBasePath = new List<string>();
        public static Dictionary<string, FileSyncManager> SQLFileSyncManager = new Dictionary<string, FileSyncManager>();
        public static string BusinessServerUrl = "";
        public static bool IsTransactionLogging = false;
        public static string ModuleLogFilePath = "";
        public static bool IsProfileLogging = false;
        public static string ProfileLogFilePath = "";
        public static int CircuitBreakResetSecond = 60;
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static int DefaultCommandTimeout = 30;
        public static List<DataSource> DataSource = new List<DataSource>();
        public static ILogger? ModuleLogger = null;
        public static ILogger? ProfileLogger = null;
    }
}
