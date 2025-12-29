using System;
using System.Collections.Generic;

using HandStack.Web;
using HandStack.Web.Extensions;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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

    public record ModuleConfig
    {
        public string AuthorizationKey { get; set; }

        public string SystemID { get; set; }

        public string BusinessServerUrl { get; set; }

        public int CircuitBreakResetSecond { get; set; }

        public bool IsTransactAggregate { get; set; }

        public bool IsDataMasking { get; set; }

        public string MaskingChar { get; set; }

        public string MaskingMethod { get; set; }

        public bool IsLogServer { get; set; }

        public bool IsValidationRequest { get; set; }

        public bool IsValidationGlobalID { get; set; }

        public List<string> BypassGlobalIDTransactions { get; set; }

        public bool IsAllowDynamicRequest { get; set; }

        public List<string> AllowTenantTransactionCommands { get; set; }

        public string ModuleBasePath { get; set; }

        public bool IsContractFileWatching { get; set; }

        public List<string> ContractBasePath { get; set; }

        public string TrustedProxyIP { get; set; }

        public bool HasTrustedCheckIP { get; set; }

        public bool UseApiAuthorize { get; set; }

        public List<string> BypassAuthorizeIP { get; set; }

        [JsonConverter(typeof(AvailableEnvironmentConverter))]
        public List<string> AvailableEnvironment { get; set; }

        public string LogServerUrl { get; set; }

        public bool IsCodeDataCache { get; set; }

        public int CodeDataCacheTimeout { get; set; }

        public string DatabaseContractPath { get; set; }

        public bool IsTransactionLogging { get; set; }

        public string TransactionLogBasePath { get; set; }

        public ExpiringList<PublicTransaction> PublicTransactions { get; set; }

        public Dictionary<string, string> RoutingCommandUri { get; set; }

        public Dictionary<string, List<string>> AllowRequestTransactions { get; set; }

        public List<string> AllowClientIP { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            SystemID = "";
            BusinessServerUrl = "";
            CircuitBreakResetSecond = 60;
            IsLogServer = false;
            IsTransactAggregate = false;
            IsDataMasking = false;
            IsValidationRequest = false;
            IsValidationGlobalID = false;
            BypassGlobalIDTransactions = new List<string>();
            IsAllowDynamicRequest = false;
            AllowTenantTransactionCommands = new List<string>();
            MaskingChar = "";
            MaskingMethod = "";
            ModuleBasePath = "";
            IsContractFileWatching = false;
            ContractBasePath = new List<string>();
            TrustedProxyIP = "";
            HasTrustedCheckIP = false;
            UseApiAuthorize = false;
            BypassAuthorizeIP = new List<string>();
            AvailableEnvironment = new List<string> { "D" };
            LogServerUrl = "";
            IsCodeDataCache = true;
            CodeDataCacheTimeout = 20;
            DatabaseContractPath = "";
            IsTransactionLogging = false;
            TransactionLogBasePath = "";
            PublicTransactions = new ExpiringList<PublicTransaction>();
            RoutingCommandUri = new Dictionary<string, string>();
            AllowRequestTransactions = new Dictionary<string, List<string>>();
            AllowClientIP = new List<string>() { "*" };
        }
    }

    public class AvailableEnvironmentConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(List<string>);
        }

        public override object? ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            var token = JToken.Load(reader);
            if (token.Type == JTokenType.Array)
            {
                return token.ToObject<List<string>>();
            }
            else if (token.Type == JTokenType.String)
            {
                return token.ToString().Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            }

            return new List<string>() { "D" };
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            var list = value as List<string>;
            if (list != null)
            {
                writer.WriteValue(string.Join(",", list));
            }
        }
    }
}
