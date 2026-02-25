using System;
using System.Collections.Generic;

namespace wwwroot.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "wwwroot";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static bool IsBundledWithHost = false;
        public static bool IsContractRequestPath = false;
        public static string ContractBasePath = "";
        public static string WWWRootBasePath = "";
        public static string ModuleFilePath = "";
        public static string BusinessServerUrl = "";
        public static bool IsModuleLogging = false;
        public static string ModuleLogFilePath = "";
        public static List<string> FileSyncTokens = new List<string>();
        public static int CircuitBreakResetSecond = 60;
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static bool IsExceptionDetailText = false;
        public static int DefaultCommandTimeout = 30;
        public static Dictionary<string, List<string>> TenantAppOrigins = new Dictionary<string, List<string>>();
        public static Dictionary<string, List<string>> TenantAppReferers = new Dictionary<string, List<string>>();

        public static string MyStaticMethod(string parameter)
        {
            Console.WriteLine($"MyStaticMethod called with parameter: {parameter}");
            return parameter;
        }
    }
}
