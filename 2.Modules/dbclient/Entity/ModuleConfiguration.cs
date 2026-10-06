using System;
using System.Collections.Generic;
using dbclient.Extensions;
using HandStack.Web.Entity;
using Serilog;

namespace dbclient.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "dbclient";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static List<string> AllowClientIP = ["*"];
        public static bool IsBundledWithHost = false;
        public static bool IsContractFileWatching = true;
        public static readonly string[] ContractFileExtensions = { ".xml", ".dbc" };
        public static readonly string ContractFileWatcherFilter = "*.xml|*.dbc";
        public static List<string> ContractBasePath = [];
        public static Dictionary<string, FileSyncManager> SQLFileSyncManager = [];
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
        public static List<DataSource> DataSource = [];
        public static ILogger? ModuleLogger = null;
        public static ILogger? ProfileLogger = null;

        public static bool IsContractFileExtension(string extension)
        {
            return Array.Exists(ContractFileExtensions, item => item.Equals(extension, StringComparison.OrdinalIgnoreCase));
        }
    }
}
