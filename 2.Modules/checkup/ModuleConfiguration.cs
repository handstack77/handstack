using System.Collections.Generic;

namespace checkup
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "checkup";
        public static string ApplicationID = "HDS";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static string ManagedAccessKey = "";
        public static string EncryptionAES256Key = "1234567890123456";
        public static bool IsBundledWithHost = false;
        public static string ModuleBasePath = "";
        public static string DatabaseContractPath = "";
        public static string TransactionContractPath = "";
        public static string FunctionContractPath = "";
        public static string WWWRootBasePath = "";
        public static string ModuleFilePath = "";
        public static string AdministratorEmailID = "";
        public static string BusinessServerUrl = "";
        public static bool IsModuleLogging = false;
        public static string ModuleLogFilePath = "";
        public static int CircuitBreakResetSecond = 60;
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static bool IsExceptionDetailText = false;
        public static int DefaultCommandTimeout = 30;
        public static Dictionary<string, List<string>> TenantAppOrigins = new Dictionary<string, List<string>>();
        public static Dictionary<string, List<string>> TenantAppReferers = new Dictionary<string, List<string>>();
        public static bool IsApiFindServer = false;
        public static bool IsMenuMemoryCache = true;
        public static string ConnectionString = "";
    }
}
