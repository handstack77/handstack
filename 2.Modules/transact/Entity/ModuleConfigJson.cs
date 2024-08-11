using System.Collections.Generic;

using HandStack.Web;
using HandStack.Web.Extensions;

namespace transact.Entity
{
    public class ModuleConfigJson : ModuleSetting
    {
        public ModuleConfig ModuleConfig { get; set; }

        public ModuleConfigJson()
        {
            ModuleConfig = new ModuleConfig();
        }
    }

    public class ModuleConfig
    {
        public string AuthorizationKey { get; set; }

        public string SystemID { get; set; }

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public int DefaultCommandTimeout { get; set; }

        public bool IsExceptionDetailText { get; set; }

        public bool IsTransactAggregate { get; set; }

        public bool IsDataMasking { get; set; }

        public string MaskingChar { get; set; }

        public string MaskingMethod { get; set; }

        public bool IsLogServer { get; set; }

        public bool IsValidationRequest { get; set; }

        public bool IsAllowDynamicRequest { get; set; }

        public List<string> AllowTenantTransactionCommands { get; set; }

        public string ModuleBasePath { get; set; }

        public List<string> ContractBasePath { get; set; }

        public bool UseApiAuthorize { get; set; }

        public List<string> BypassAuthorizeIP { get; set; }

        public List<string> WithOrigins { get; set; }

        public string AvailableEnvironment { get; set; }

        public string LogServerUrl { get; set; }

        public bool IsCodeDataCache { get; set; }

        public int CodeDataCacheTimeout { get; set; }

        public string DatabaseContractPath { get; set; }

        public bool IsTransactionLogging { get; set; }

        public string TransactionLogBasePath { get; set; }

        public int TransactionLogFileSizeLimitBytes { get; set; }

        public int TransactionLogMaxRollingFiles { get; set; }

        public ExpiringList<PublicTransaction> PublicTransactions { get; set; }

        public Dictionary<string, string> RoutingCommandUri { get; set; }

        public Dictionary<string, List<string>> AllowRequestTransactions { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            SystemID = "";
            BusinessServerUrl = "";
            CircuitBreakResetSecond = 60;
            DefaultCommandTimeout = 180000;
            IsExceptionDetailText = true;
            IsLogServer = false;
            IsTransactAggregate = false;
            IsDataMasking = false;
            IsAllowDynamicRequest = false;
            AllowTenantTransactionCommands = new List<string>();
            MaskingChar = "";
            MaskingMethod = "";
            ModuleBasePath = "";
            ContractBasePath = new List<string>();
            UseApiAuthorize = false;
            BypassAuthorizeIP = new List<string>();
            WithOrigins = new List<string>();
            AvailableEnvironment = "";
            LogServerUrl = "";
            IsCodeDataCache = true;
            CodeDataCacheTimeout = 20;
            DatabaseContractPath = "";
            IsTransactionLogging = true;
            TransactionLogBasePath = "";
            TransactionLogFileSizeLimitBytes = 104857600;
            TransactionLogMaxRollingFiles = 30;
            PublicTransactions = new ExpiringList<PublicTransaction>();
            RoutingCommandUri = new Dictionary<string, string>();
            AllowRequestTransactions = new Dictionary<string, List<string>>();
        }
    }
}
