using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Collections.Frozen;

using HandStack.Web.Extensions;

using transact.Extensions;

namespace transact.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "transact";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static FrozenSet<string> AllowClientIP = new List<string>() { "*" }.ToFrozenSet();
        public static bool IsBundledWithHost = false;
        public static bool IsContractFileWatching = true;
        public static readonly string[] ContractFileExtensions = { ".json", ".txn" };
        public static readonly string ContractFileWatcherFilter = "*.json|*.txn";
        public static List<string> ContractBasePath = new List<string>();
        public static Dictionary<string, FileSyncManager> BusinessFileSyncManager = new Dictionary<string, FileSyncManager>();
        public static string BusinessServerUrl = "";
        public static bool IsTransactionLogging = false;
        public static string TransactionAggregateBasePath = "";
        public static int CircuitBreakResetSecond = 60;
        public static string ModuleBasePath = "";
        public static string DatabaseContractPath = "";
        public static bool IsValidationRequest = false;
        public static bool IsValidationGlobalID = false;
        public static FrozenSet<string> BypassGlobalIDTransactions = FrozenSet<string>.Empty;
        public static bool IsAllowDynamicRequest = false;
        public static FrozenSet<string> AllowTenantTransactionCommands = FrozenSet<string>.Empty;
        public static bool IsLogServer = false;
        public static bool IsTransactAggregate = false;
        public static bool IsTransactAggregateRolling = false;
        public static string TransactAggregateDeleteOldCronTime = "0 1 * * *";
        public static bool IsDataMasking = false;
        public static char MaskingChar = '*';
        public static string MaskingMethod = "Syn";
        public static string LogServerUrl = "";
        public static string TrustedProxyIP = "";
        public static bool HasTrustedCheckIP = false;
        public static bool UseApiAuthorize = false;
        public static string DynamicWorkflowTransaction = "";
        public static string DynamicWorkflowServices = "";
        public static FrozenSet<string> BypassAuthorizeIP = FrozenSet<string>.Empty;
        public static string SystemID = "";
        public static FrozenSet<string> AvailableEnvironment = new List<string> { "D" }.ToFrozenSet();
        public static bool IsCodeDataCache = false;
        public static int CodeDataCacheTimeout = 20;
        public static FrozenDictionary<string, FrozenSet<string>> AllowRequestTransactions = FrozenDictionary<string, FrozenSet<string>>.Empty;
        public static ExpiringDictionary<string, string> RoutingCommandUri = new ExpiringDictionary<string, string>();
        public static ExpiringList<PublicTransaction>? PublicTransactions = new ExpiringList<PublicTransaction>();
        public static ExpiringList<string> RequestGlobalIDList = new ExpiringList<string>(TimeSpan.FromMinutes(3), TimeSpan.FromMinutes(1));
        public static ConcurrentDictionary<string, byte> CacheKeys = new ConcurrentDictionary<string, byte>();

        // AI 자동화 공격 대응 서버측 하드닝 설정. 기본값은 레거시 동작과 동일(비활성).
        public static SecurityHardeningConfig SecurityHardening = new SecurityHardeningConfig();

        public static bool IsContractFileExtension(string extension)
        {
            return Array.Exists(ContractFileExtensions, item => item.Equals(extension, StringComparison.OrdinalIgnoreCase));
        }
    }
}
