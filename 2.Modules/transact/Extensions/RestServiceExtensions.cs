using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;

using transact.Entity;

namespace transact.Extensions
{
    public static class RestServiceExtensions
    {
        public static bool IsAllowAuthorization(this HttpContext httpContext)
        {
            string remoteIP = httpContext.GetRemoteIpAddress().ToStringSafe();
            bool isLocalRequest = httpContext.Connection.RemoteIpAddress != null && IPAddress.IsLoopback(httpContext.Connection.RemoteIpAddress);
            string? authorizationKey;
            if (isLocalRequest == true)
            {
                authorizationKey = httpContext.Request.GetContainValue("AuthorizationKey");
            }
            else
            {
                authorizationKey = httpContext.Request.GetHeaderValue("AuthorizationKey");
            }

            var isAllowClientIP = ModuleConfiguration.AllowClientIP.Contains("*") || ModuleConfiguration.AllowClientIP.Contains(remoteIP);
            return ModuleConfiguration.AuthorizationKey == authorizationKey || isAllowClientIP;
        }

        // 열거/관리 엔드포인트(/meta·/retrieve·/get·/has·/cache-*·/refresh) 전용 인가.
        // LockdownMetadataEndpoints=false(레거시): 기존 IsAllowAuthorization 과 동일하게 동작.
        // LockdownMetadataEndpoints=true: AllowClientIP "*" 와일드카드 단독 통과를 차단하고
        // AuthorizationKey 일치 또는 명시적으로 등록된(=와일드카드 아님) 클라이언트 IP 만 허용한다.
        public static bool IsAllowMetadataAuthorization(this HttpContext httpContext)
        {
            if (ModuleConfiguration.SecurityHardening.LockdownMetadataEndpoints == false)
            {
                return httpContext.IsAllowAuthorization();
            }

            string remoteIP = httpContext.GetRemoteIpAddress().ToStringSafe();
            bool isLocalRequest = httpContext.Connection.RemoteIpAddress != null && IPAddress.IsLoopback(httpContext.Connection.RemoteIpAddress);
            string? authorizationKey;
            if (isLocalRequest == true)
            {
                authorizationKey = httpContext.Request.GetContainValue("AuthorizationKey");
            }
            else
            {
                authorizationKey = httpContext.Request.GetHeaderValue("AuthorizationKey");
            }

            var isAuthorizationKeyMatched = string.IsNullOrWhiteSpace(ModuleConfiguration.AuthorizationKey) == false && ModuleConfiguration.AuthorizationKey == authorizationKey;
            var isExplicitAllowClientIP = remoteIP != "*" && ModuleConfiguration.AllowClientIP.Contains(remoteIP);

            return isAuthorizationKeyMatched || isExplicitAllowClientIP;
        }

        // 모듈이 신뢰하는 실제 클라이언트 IP(연결/프록시 기반). 요청 본문의 SourceIP 처럼 조작 가능한 값이 아니다.
        public static string GetTrustedClientIP(this HttpContext httpContext)
        {
            return httpContext.GetRemoteIpAddress().ToStringSafe();
        }

        // BypassAuthorizeIP 우회 판정을 중앙화한다.
        // 기본 설정에서는 각 컨트롤러의 레거시 동작과 100% 동일하게 동작한다.
        //  - EnforceRealClientIP=false(레거시): 우회 IP 매칭에 요청 본문 SourceIP 를 사용
        //  - EnforceRealClientIP=true: 조작 불가한 실제 소켓/프록시 기반 IP 를 사용(본문 SourceIP 무시)
        //  - allowLocalhostBypass: TransactionController 레거시의 localhost 우회 분기 보존용
        //    (Workflow 는 localhost 우회가 없었으므로 false 로 호출)
        public static bool IsBypassAuthorizeIP(this HttpContext httpContext, string? requestSourceIP, bool allowLocalhostBypass)
        {
            if (ModuleConfiguration.BypassAuthorizeIP.Contains("*"))
            {
                return true;
            }

            var hardening = ModuleConfiguration.SecurityHardening;

            if (allowLocalhostBypass == true && hardening.TrustedLocalhostBypass == true)
            {
                if (hardening.EnforceRealClientIP == true)
                {
                    var remoteIpAddress = httpContext.Connection.RemoteIpAddress;
                    if (remoteIpAddress != null && IPAddress.IsLoopback(remoteIpAddress) == true)
                    {
                        return true;
                    }
                }
                else if (httpContext.Request.Host.ToString().StartsWith("localhost") == true)
                {
                    return true;
                }
            }

            var candidateIP = hardening.EnforceRealClientIP == true
                ? httpContext.GetTrustedClientIP()
                : requestSourceIP.ToStringSafe();

            if (string.IsNullOrWhiteSpace(candidateIP) == true)
            {
                return false;
            }

            foreach (var ip in ModuleConfiguration.BypassAuthorizeIP)
            {
                if (string.IsNullOrWhiteSpace(ip) == false && candidateIP.IndexOf(ip) > -1)
                {
                    return true;
                }
            }

            return false;
        }

        // #7 유량 제어: IP 및 토큰(없으면 OperatorID)별 분당 요청 수 상한.
        // RateLimit.Enabled=false(레거시)면 카운팅조차 하지 않아 오버헤드 0.
        // 반환값 true = 한도 초과. Mode(AuditOnly/Enforce) 해석은 호출부에서 수행한다.
        public static bool IsRateLimited(this HttpContext httpContext, string? operatorID, string? token, out string exceededReason)
        {
            exceededReason = "";
            var rateLimit = ModuleConfiguration.SecurityHardening.RateLimit;
            if (rateLimit == null || rateLimit.Enabled == false)
            {
                return false;
            }

            var clientIP = httpContext.GetTrustedClientIP();
            if (rateLimit.PerIpPerMinute > 0 && string.IsNullOrWhiteSpace(clientIP) == false)
            {
                if (TransactRateLimiter.TryAcquire($"ip:{clientIP}", rateLimit.PerIpPerMinute, out var ipCount) == false)
                {
                    exceededReason = $"IP '{clientIP}' 분당 요청 한도 초과({ipCount}/{rateLimit.PerIpPerMinute})";
                    return true;
                }
            }

            var tokenKey = string.IsNullOrWhiteSpace(token) == false ? token : operatorID;
            if (rateLimit.PerTokenPerMinute > 0 && string.IsNullOrWhiteSpace(tokenKey) == false)
            {
                if (TransactRateLimiter.TryAcquire($"token:{tokenKey}", rateLimit.PerTokenPerMinute, out var tokenCount) == false)
                {
                    exceededReason = $"토큰 분당 요청 한도 초과({tokenCount}/{rateLimit.PerTokenPerMinute})";
                    return true;
                }
            }

            return false;
        }

        // #8 입력 크기 상한. 각 값 0 = 무제한(레거시).
        public static bool TryValidateInputLimits(TransactionRequest request, out string exceptionText)
        {
            exceptionText = "";
            var hardening = ModuleConfiguration.SecurityHardening;

            if (hardening.MaxRoutes > 0 && request.System?.Routes != null && request.System.Routes.Count > hardening.MaxRoutes)
            {
                exceptionText = $"요청 경로 수 한도 초과({request.System.Routes.Count} > {hardening.MaxRoutes})";
                return false;
            }

            if (hardening.MaxDataMapSetCount > 0 && request.PayLoad != null)
            {
                var rawCount = request.PayLoad.DataMapSetRaw?.Count ?? 0;
                var setCount = request.PayLoad.DataMapSet?.Count ?? 0;
                var mapSetCount = Math.Max(rawCount, setCount);
                if (mapSetCount > hardening.MaxDataMapSetCount)
                {
                    exceptionText = $"입력 데이터맵 수 한도 초과({mapSetCount} > {hardening.MaxDataMapSetCount})";
                    return false;
                }
            }

            return true;
        }

        // #12 권한 검사 정규식 생성. RegexTimeoutMilliseconds=0 이면 무제한(레거시)이며 그렇지 않으면 매칭 타임아웃 적용(ReDoS 방어).
        public static Regex CreatePermissionRegex(string pattern)
        {
            var timeoutMilliseconds = ModuleConfiguration.SecurityHardening.RegexTimeoutMilliseconds;
            var matchTimeout = timeoutMilliseconds > 0 ? TimeSpan.FromMilliseconds(timeoutMilliseconds) : Regex.InfiniteMatchTimeout;
            return new Regex(pattern, RegexOptions.None, matchTimeout);
        }

        public static void Append(this List<DynamicParameter> parameters, string parameterName, DbType dbType, object? value)
        {
            parameters.Add(new DynamicParameter() { ParameterName = parameterName, DbType = dbType.ToString(), Value = value });
        }

        public static object? Value(this List<TransactField> parameters, string prop)
        {
            object? val = null;
            foreach (var item in parameters)
            {
                if (item.FieldID == prop)
                {
                    val = item.Value;
                    break;
                }
            }

            return val;
        }

        public static Model? GetBusinessModel(this List<Model> models, string modelID)
        {
            Model? result = null;
            lock (models)
            {
                var findModels = from item in models
                                 where item.Name == modelID
                                 select item;

                result = findModels.FirstOrDefault();
            }

            return result;
        }

        public static bool IsContain(this List<DatabaseColumn> dbColumns, string columnName)
        {
            var cols = from item in dbColumns
                       where item.Name == columnName
                       select item;

            return cols.Count() > 0 ? true : false;
        }
    }

    // 분당 고정 윈도우 카운터. 만료(2분)로 자동 정리되어 별도 스윕이 필요 없다.
    internal static class TransactRateLimiter
    {
        private static readonly MemoryCache cache = new MemoryCache(new MemoryCacheOptions());

        private sealed class Counter
        {
            public int Count;
        }

        // 반환값 true = 허용, false = 한도 초과. limitPerMinute<=0 이면 무제한.
        public static bool TryAcquire(string key, int limitPerMinute, out int currentCount)
        {
            currentCount = 0;
            if (limitPerMinute <= 0)
            {
                return true;
            }

            var minuteBucket = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 60;
            var cacheKey = $"{key}|{minuteBucket}";
            var counter = cache.GetOrCreate(cacheKey, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2);
                return new Counter();
            })!;

            lock (counter)
            {
                counter.Count++;
                currentCount = counter.Count;
                return counter.Count <= limitPerMinute;
            }
        }
    }

    public enum CommonDbType
    {
        // 요약:
        //     System.Int64.64비트 부호 있는 정수입니다.
        BigInt = 0,
        //
        // 요약:
        //     System.Byte 형식의 System.Array입니다.범위가 1바이트에서 8,000바이트까지인 이진 데이터의 고정 길이 스트림입니다.
        Binary = 1,
        //
        // 요약:
        //     System.Boolean.0, 1 또는 null일 수 있는 부호 없는 숫자 값입니다.
        Bit = 2,
        //
        // 요약:
        //     System.String.범위가 1자에서 8,000자까지이고 유니코드가 아닌 문자의 고정 길이 스트림입니다.
        Char = 3,
        //
        // 요약:
        //     System.DateTime.3.33밀리초의 정확성으로 값의 범위가 1753년 1월 1일에서 9999년 12월 31일까지인 날짜 및
        //     시간 데이터입니다.
        DateTime = 4,
        //
        // 요약:
        //     System.Decimal.-10 38 -1과 10 38 -1 사이의 고정 전체 자릿수 및 소수 자릿수 값입니다.
        Decimal = 5,
        //
        // 요약:
        //     System.Double.범위가 -1.79E +308에서 1.79E +308까지인 부동 소수점 숫자입니다.
        Float = 6,
        //
        // 요약:
        //     System.Byte 형식의 System.Array입니다.범위가 0바이트에서 2 31 -1(또는 2,147,483,647)바이트까지인
        //     이진 데이터의 가변 길이 스트림입니다.
        Image = 7,
        //
        // 요약:
        //     System.Int32.32비트 부호 있는 정수입니다.
        Int = 8,
        //
        // 요약:
        //     System.Decimal.정확성이 통화 단위의 10000분의 1이고 범위가 -2 63(또는 -922,337,203,685,477.5808)에서
        //     2 63 -1(또는 +922,337,203,685,477.5807)까지인 통화 값입니다.
        Money = 9,
        //
        // 요약:
        //     System.String.범위가 1자에서 4,000자까지인 유니코드 문자의 고정 길이 스트림입니다.
        NChar = 10,
        //
        // 요약:
        //     System.String.최대 길이가 2 30 - 1(또는 1,073,741,823)자인 유니코드 데이터의 가변 길이 스트림입니다.
        NText = 11,
        //
        // 요약:
        //     System.String.범위가 1자에서 4,000자까지인 유니코드 문자의 가변 길이 스트림입니다.문자열이 4,000자보다 더 큰
        //     경우 암시적 변환이 실패합니다.4,000자보다 더 긴 문자열로 작업할 경우 개체를 명시적으로 설정합니다.
        NVarChar = 12,
        //
        // 요약:
        //     System.Single.범위가 -3.40E +38에서 3.40E +38까지인 부동 소수점 숫자입니다.
        Real = 13,
        //
        // 요약:
        //     System.Guid.GUID(Globally Unique IDentifier)입니다.
        UniqueIdentifier = 14,
        //
        // 요약:
        //     System.DateTime.1분의 정확성으로 값의 범위가 1900년 1월 1일에서 2079년 6월 6일까지인 날짜 및 시간 데이터입니다.
        SmallDateTime = 15,
        //
        // 요약:
        //     System.Int16.16비트 부호 있는 정수입니다.
        SmallInt = 16,
        //
        // 요약:
        //     System.Decimal.통화 단위의 10000분의 1 정확성으로 범위가 -214,748.3648에서 +214,748.3647까지인
        //     통화 값입니다.
        SmallMoney = 17,
        //
        // 요약:
        //     System.String.최대 길이가 2 31 -1(또는 2,147,483,647)자이고 유니코드가 아닌 데이터의 가변 길이 스트림입니다.
        Text = 18,
        //
        // 요약:
        //     System.Byte 형식의 System.Array입니다.데이터베이스 내에서 고유한 자동 생성되는 이진 숫자입니다.timestamp는
        //     일반적으로 버전이 표시되는 테이블 행에 대한 메커니즘으로 사용됩니다.저장소 크기는 8바이트입니다.
        Timestamp = 19,
        //
        // 요약:
        //     System.Byte.8비트 부호 없는 정수입니다.
        TinyInt = 20,
        //
        // 요약:
        //     System.Byte 형식의 System.Array입니다.범위가 1바이트에서 8,000바이트까지인 이진 데이터의 가변 길이 스트림입니다.바이트
        //     배열이 8.000바이트보다 더 큰 경우 암시적 변환이 실패합니다.8.000바이트보다 더 큰 바이트 배열로 작업할 경우 개체를 명시적으로
        //     설정합니다.
        VarBinary = 21,
        //
        // 요약:
        //     System.String.범위가 1문자에서 8,000문자까지인 비유니코드 문자의 가변 길이 스트림입니다.
        VarChar = 22,
        //
        // 요약:
        //     System.Object.SQL Server 값 Empty 및 Null뿐만 아니라 숫자, 문자열, 이진 데이터 또는 날짜 데이터를
        //     포함할 수 있는 특수 데이터 형식으로 다른 데이터 형식이 선언되지 않으면 이 형식이 사용됩니다.
        Variant = 23,
        //
        // 요약:
        //     XML 값입니다.System.Data.SqlClient.SqlDataReader.GetValue(System.Int32) 메서드나
        //     System.Data.SqlTypes.SqlXml.Value 속성을 사용하여 XML을 문자열로 가져오거나 System.Data.SqlTypes.SqlXml.CreateReader()
        //     메서드를 호출하여 XML을 System.Xml.XmlReader로 가져옵니다.
        Xml = 25,
        //
        // 요약:
        //     SQL Server 2005 UDT(사용자 정의 형식)입니다.
        Udt = 29,
        //
        // 요약:
        //     테이블 반환 매개 변수에 들어 있는 구조적 데이터를 지정하기 위한 특수 데이터 형식입니다.
        Structured = 30,
        //
        // 요약:
        //     값 범위가 서기 1년 1월 1일에서 서기 9999년 12월 31일 사이인 날짜 데이터입니다.
        Date = 31,
        //
        // 요약:
        //     24시간제 시간 데이터입니다.Time 값 범위는 00:00:00부터 23:59:59.9999999까지이며 정확도는 100나노초입니다.SQL
        //     Server time 값에 해당합니다.
        Time = 32,
        //
        // 요약:
        //     날짜 및 시간 데이터입니다.날짜 값 범위는 서기 1년 1월 1일에서 서기 9999년 12월 31일 사이입니다.Time 값 범위는 00:00:00부터
        //     23:59:59.9999999까지이며 정확도는 100나노초입니다.
        DateTime2 = 33,
        //
        // 요약:
        //     표준 시간대를 고려한 날짜 및 시간 데이터입니다.날짜 값 범위는 서기 1년 1월 1일에서 서기 9999년 12월 31일 사이입니다.Time
        //     값 범위는 00:00:00부터 23:59:59.9999999까지이며 정확도는 100나노초입니다.표준 시간대 값의 범위는 -14:00에서
        //     +14:00 사이입니다.
        DateTimeOffset = 34,
    }
}


