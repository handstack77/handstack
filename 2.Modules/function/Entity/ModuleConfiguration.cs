using System.Collections.Generic;

using function.Extensions;

using Serilog;

namespace function.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "function";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static List<string> AllowClientIP = new List<string>() { "*" };
        public static bool IsBundledWithHost = false;
        public static string ModuleBasePath = "";
        public static Dictionary<string, FileSyncManager> FunctionFileSyncManager = new Dictionary<string, FileSyncManager>();
        public static List<string> ContractBasePath = new List<string>();
        public static Dictionary<string, string> ContractModulePath = new Dictionary<string, string>();
        public static string LogMinimumLevel = "";
        public static string NodeFunctionLogBasePath = "";
        public static string LocalStoragePath = "";
        public static int TimeoutMS = -1;
        public static bool IsSingleThread = false;
        public static bool EnableFileWatching = false;
        public static bool WatchGracefulShutdown = true;
        public static List<string> WatchFileNamePatterns = new List<string>();
        public static string ExecutablePath = "";
        public static string NodeAndV8Options = "";
        public static string EnvironmentVariables = "";
        public static bool CSharpEnableFileWatching = false;
        public static string CSharpFunctionLogBasePath = "";
        public static List<string> CSharpWatchFileNamePatterns = new List<string>();
        public static bool PythonEnableFileWatching = false;
        public static bool EnablePythonDLL = false;
        public static string PythonDLLFilePath = "";
        public static string PythonFunctionLogBasePath = "";
        public static List<string> PythonWatchFileNamePatterns = new List<string>();
        public static string BusinessServerUrl = "";
        public static bool IsTransactionLogging = false;
        public static string ModuleLogFilePath = "";
        public static int CircuitBreakResetSecond = 60;
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static string DefaultDataSourceID = "";
        public static List<FunctionSource> FunctionSource = new List<FunctionSource>();
        public static ILogger? ModuleLogger = null;
    }
}
