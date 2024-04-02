using System.Collections.Generic;

using transact.Entity;
using transact.Extensions;

namespace transact
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "transact";
        public static string ApplicationID = "HDS";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static bool IsBundledWithHost = false;
        public static List<string> ContractBasePath = new List<string>();
        public static List<FileSyncManager?> BusinessFileSyncManager = new List<FileSyncManager?>();
        public static string BusinessServerUrl = "";
        public static bool IsTransactionLogging = false;
        public static string TransactionLogBasePath = "";
        public static int TransactionLogFileSizeLimitBytes = 104857600;
        public static int TransactionLogMaxRollingFiles = 30;
        public static int CircuitBreakResetSecond = 60;
        public static string ModuleBasePath = "";
        public static string DatabaseContractPath = "";
        public static bool IsValidationRequest = false;
        public static bool IsAllowDynamicRequest = false;
        public static List<string> AllowTenantTransactionCommands = new List<string>();
        public static bool IsLogServer = false;
        public static bool IsTransactAggregate = false;
        public static bool IsDataMasking = false;
        public static char MaskingChar = '*';
        public static string MaskingMethod = "Syn";
        public static string LogServerUrl = "";
        public static bool UseApiAuthorize = false;
        public static List<string> BypassAuthorizeIP = new List<string>();
        public static List<string> WithOrigins = new List<string>();
        public static bool IsExceptionDetailText = false;
        public static int DefaultCommandTimeout = 30;
        public static bool IsApiFindServer = false;
        public static string SystemID = "";
        public static string AvailableEnvironment = "";
        public static bool IsCodeDataCache = true;
        public static int CodeDataCacheTimeout = 20;
        public static Dictionary<string, List<string>> AllowRequestTransactions = new Dictionary<string, List<string>>();
        public static Dictionary<string, string> RoutingCommandUri = new Dictionary<string, string>();
        public static List<PublicTransaction>? PublicTransactions = new List<PublicTransaction>();
        public static List<string> CacheKeys = new List<string>();
    }
}
