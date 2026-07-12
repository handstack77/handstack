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

        public bool IsTransactAggregateRolling { get; set; }

        public string TransactAggregateDeleteOldCronTime { get; set; }

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

        public string DynamicWorkflowTransaction { get; set; }

        public string DynamicWorkflowServices { get; set; }

        public List<string> BypassAuthorizeIP { get; set; }

        [JsonConverter(typeof(AvailableEnvironmentConverter))]
        public List<string> AvailableEnvironment { get; set; }

        public string LogServerUrl { get; set; }

        public bool IsCodeDataCache { get; set; }

        public int CodeDataCacheTimeout { get; set; }

        public string DatabaseContractPath { get; set; }

        public bool IsTransactionLogging { get; set; }

        public string TransactionAggregateBasePath { get; set; }

        public ExpiringList<PublicTransaction> PublicTransactions { get; set; }

        public Dictionary<string, string> RoutingCommandUri { get; set; }

        public Dictionary<string, List<string>> AllowRequestTransactions { get; set; }

        public List<string> AllowClientIP { get; set; }

        public SecurityHardeningConfig SecurityHardening { get; set; }

        public ModuleConfig()
        {
            AuthorizationKey = "";
            SystemID = "";
            BusinessServerUrl = "";
            CircuitBreakResetSecond = 60;
            IsLogServer = false;
            IsTransactAggregate = false;
            IsTransactAggregateRolling = false;
            TransactAggregateDeleteOldCronTime = "0 1 * * *";
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
            DynamicWorkflowTransaction = "";
            DynamicWorkflowServices = "";
            BypassAuthorizeIP = new List<string>();
            AvailableEnvironment = new List<string> { "D" };
            LogServerUrl = "";
            IsCodeDataCache = true;
            CodeDataCacheTimeout = 20;
            DatabaseContractPath = "";
            IsTransactionLogging = false;
            TransactionAggregateBasePath = "";
            PublicTransactions = new ExpiringList<PublicTransaction>();
            RoutingCommandUri = new Dictionary<string, string>();
            AllowRequestTransactions = new Dictionary<string, List<string>>();
            AllowClientIP = new List<string>() { "*" };
            SecurityHardening = new SecurityHardeningConfig();
        }
    }

    // AI 자동화 공격(대량·지능형 프로빙, 포맷 역공학, 자원 고갈) 대응을 위한 서버측 하드닝 설정.
    // 모든 기본값은 "기존 동작 유지"로 설정되어 있어, 설정을 추가하지 않으면 레거시 동작과 100% 동일하다.
    // 운영자는 module.json 의 ModuleConfig.SecurityHardening 에서 항목별로 점진적으로 활성화한다.
    public record SecurityHardeningConfig
    {
        // #1,#2: Host 헤더/본문 SourceIP 대신 실제 소켓 IP(Connection.RemoteIpAddress + TrustedProxyIP) 만 신뢰
        public bool EnforceRealClientIP { get; set; }

        // #1: 기존 localhost Host 헤더 기반 인가 우회 유지 여부(레거시 호환 위해 기본 true, 운영 권장 false)
        public bool TrustedLocalhostBypass { get; set; }

        // #3: /meta·/retrieve·/get·/has·/cache-* 열거 엔드포인트에 AuthorizationKey 강제(AllowClientIP "*" 단독 통과 차단)
        public bool LockdownMetadataEndpoints { get; set; }

        // #7: IP/토큰별 유량 제어
        public RateLimitConfig RateLimit { get; set; }

        // #8: 입력 크기 상한(0 = 무제한, 레거시)
        public int MaxDataMapSetCount { get; set; }
        public long MaxDecompressedBytes { get; set; }
        public int MaxRoutes { get; set; }

        // #10: 외부 응답 오류 텍스트를 코드화하고 상세는 서버 로그로만(차분 오라클 제거)
        public bool SanitizeErrorText { get; set; }

        // #12: PermissionRoles 정규식 매칭 타임아웃(0 = 무제한, 레거시)
        public int RegexTimeoutMilliseconds { get; set; }

        // #11: PSH(fire-and-forget) 동시 실행 태스크 상한(0 = 무제한, 레거시)
        public int MaxConcurrentPushTasks { get; set; }

        // #9: X-Workflow-Contract(1회성 동적 Workflow) 역직렬화 전 사전 가드
        //  - 토큰 없는 호출은 역직렬화 이전에 거부(어차피 ValidateOneTimeWorkflowPermission 에서 토큰 필수)
        //  - MaxDecompressedBytes>0 이면 계약 헤더 크기 상한도 역직렬화 이전에 적용
        public bool EnforceWorkflowContractGuard { get; set; }

        public SecurityHardeningConfig()
        {
            EnforceRealClientIP = false;
            TrustedLocalhostBypass = true;
            LockdownMetadataEndpoints = false;
            RateLimit = new RateLimitConfig();
            MaxDataMapSetCount = 0;
            MaxDecompressedBytes = 0;
            MaxRoutes = 0;
            SanitizeErrorText = false;
            RegexTimeoutMilliseconds = 0;
            MaxConcurrentPushTasks = 0;
            EnforceWorkflowContractGuard = false;
        }
    }

    public record RateLimitConfig
    {
        public bool Enabled { get; set; }
        public int PerIpPerMinute { get; set; }
        public int PerTokenPerMinute { get; set; }

        // "AuditOnly": 초과 시 로깅만, "Enforce": 초과 시 429 차단
        public string Mode { get; set; }

        public RateLimitConfig()
        {
            Enabled = false;
            PerIpPerMinute = 600;
            PerTokenPerMinute = 1200;
            Mode = "AuditOnly";
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
