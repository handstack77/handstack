using System.Text;
using System.Text.Json;

using agent.Options;

using Microsoft.Extensions.Options;

namespace agent.Services
{
    public sealed class TargetAuditLogger : ITargetAuditLogger
    {
        public const string HttpClientName = "logger-module";

        private static readonly JsonSerializerOptions jsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = null
        };

        private readonly IHttpClientFactory httpClientFactory;
        private readonly IOptionsMonitor<AgentOptions> optionsMonitor;
        private readonly ILogger<TargetAuditLogger> logger;

        public TargetAuditLogger(
            IHttpClientFactory httpClientFactory,
            IOptionsMonitor<AgentOptions> optionsMonitor,
            ILogger<TargetAuditLogger> logger)
        {
            this.httpClientFactory = httpClientFactory;
            this.optionsMonitor = optionsMonitor;
            this.logger = logger;
        }

        public Task WriteTargetsAuditAsync(
            HttpContext httpContext,
            string actionName,
            string? targetId,
            bool success,
            int statusCode,
            string? message,
            CancellationToken cancellationToken)
        {
            // /targets 계열 호출의 핵심 감사 정보를 logger 모듈 포맷으로 전달합니다.
            var properties = new
            {
                RequestPath = httpContext.Request.Path.Value ?? "",
                RequestMethod = httpContext.Request.Method,
                QueryString = httpContext.Request.QueryString.Value ?? "",
                TargetID = targetId ?? "",
                Action = actionName,
                Result = success == true ? "success" : "failure",
                StatusCode = statusCode,
                Message = message ?? ""
            };

            return SendAsync(
                httpContext,
                actionName,
                targetId,
                success,
                statusCode,
                message ?? "",
                JsonSerializer.Serialize(properties, jsonSerializerOptions),
                cancellationToken);
        }

        public Task WriteTargetsUnauthorizedAsync(HttpContext httpContext, string reason, CancellationToken cancellationToken)
        {
            var actionName = "targets.unauthorized";
            var statusCode = StatusCodes.Status401Unauthorized;
            var properties = new
            {
                RequestPath = httpContext.Request.Path.Value ?? "",
                RequestMethod = httpContext.Request.Method,
                QueryString = httpContext.Request.QueryString.Value ?? "",
                Reason = reason
            };

            return SendAsync(
                httpContext,
                actionName,
                null,
                false,
                statusCode,
                reason,
                JsonSerializer.Serialize(properties, jsonSerializerOptions),
                cancellationToken);
        }

        private async Task SendAsync(
            HttpContext httpContext,
            string actionName,
            string? targetId,
            bool success,
            int statusCode,
            string message,
            string properties,
            CancellationToken cancellationToken)
        {
            var auditOptions = optionsMonitor.CurrentValue.AuditLog;
            if (auditOptions.Enabled == false || string.IsNullOrWhiteSpace(auditOptions.LogServerUrl) == true)
            {
                return;
            }

            try
            {
                var logMessage = BuildLogMessage(
                    httpContext,
                    auditOptions,
                    actionName,
                    targetId,
                    success,
                    statusCode,
                    message,
                    properties);

                var content = new StringContent(JsonSerializer.Serialize(logMessage, jsonSerializerOptions), Encoding.UTF8, "application/json");
                var client = httpClientFactory.CreateClient(HttpClientName);
                using var request = new HttpRequestMessage(HttpMethod.Post, auditOptions.LogServerUrl)
                {
                    Content = content
                };

                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                var timeoutSeconds = auditOptions.TimeoutSeconds <= 0 ? 3 : auditOptions.TimeoutSeconds;
                linkedCts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

                using var response = await client.SendAsync(request, linkedCts.Token);
                if (response.IsSuccessStatusCode == false)
                {
                    logger.LogWarning(
                        "Audit log send failed. Url={Url}, StatusCode={StatusCode}, Action={Action}, TargetID={TargetID}",
                        auditOptions.LogServerUrl,
                        (int)response.StatusCode,
                        actionName,
                        targetId ?? "");
                }
            }
            catch (OperationCanceledException)
            {
                logger.LogWarning(
                    "Audit log send timeout. Action={Action}, TargetID={TargetID}",
                    actionName,
                    targetId ?? "");
            }
            catch (Exception exception)
            {
                logger.LogWarning(
                    exception,
                    "Audit log send exception. Action={Action}, TargetID={TargetID}",
                    actionName,
                    targetId ?? "");
            }
        }

        private static LoggerLogMessage BuildLogMessage(
            HttpContext httpContext,
            AuditLogOptions auditOptions,
            string actionName,
            string? targetId,
            bool success,
            int statusCode,
            string message,
            string properties)
        {
            // logger/api/log/insert 입력 스키마에 맞춰 메시지를 구성합니다.
            var now = DateTime.Now;
            var remoteIp = httpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "";
            var userIdHeaderName = string.IsNullOrWhiteSpace(auditOptions.UserIdHeaderName) == true ? "X-User-Id" : auditOptions.UserIdHeaderName.Trim();
            var deviceIdHeaderName = string.IsNullOrWhiteSpace(auditOptions.DeviceIdHeaderName) == true ? "X-Device-Id" : auditOptions.DeviceIdHeaderName.Trim();

            var userID = httpContext.Request.Headers.TryGetValue(userIdHeaderName, out var userValues) == true
                ? (userValues.FirstOrDefault() ?? "")
                : "";

            if (string.IsNullOrWhiteSpace(userID) == true)
            {
                userID = httpContext.User?.Identity?.Name ?? "";
            }

            if (string.IsNullOrWhiteSpace(userID) == true)
            {
                userID = "anonymous";
            }

            var deviceID = httpContext.Request.Headers.TryGetValue(deviceIdHeaderName, out var deviceValues) == true
                ? (deviceValues.FirstOrDefault() ?? "")
                : "";

            return new LoggerLogMessage
            {
                ServerID = Environment.MachineName,
                RunningEnvironment = string.IsNullOrWhiteSpace(auditOptions.RunningEnvironment) == true ? "D" : auditOptions.RunningEnvironment,
                ProgramName = string.IsNullOrWhiteSpace(auditOptions.ProgramName) == true ? "agent" : auditOptions.ProgramName,
                GlobalID = BuildGlobalID(actionName),
                Acknowledge = success == true ? "Y" : "N",
                ApplicationID = string.IsNullOrWhiteSpace(auditOptions.ApplicationID) == true ? "HDS" : auditOptions.ApplicationID,
                ProjectID = string.IsNullOrWhiteSpace(auditOptions.ProjectID) == true ? "agent" : auditOptions.ProjectID,
                TransactionID = string.IsNullOrWhiteSpace(auditOptions.TransactionID) == true ? "targets" : auditOptions.TransactionID,
                ServiceID = string.IsNullOrWhiteSpace(targetId) == true ? actionName : $"{actionName}:{targetId}",
                Type = "A",
                Flow = "N",
                Level = success == true ? "V" : "E",
                Format = "P",
                Message = $"[{statusCode}] {message}",
                Properties = properties,
                UserID = userID,
                CreatedAt = now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                IpAddress = remoteIp,
                DeviceID = deviceID,
                ProgramID = string.IsNullOrWhiteSpace(auditOptions.ProgramID) == true ? "agent" : auditOptions.ProgramID
            };
        }

        private static string BuildGlobalID(string actionName)
        {
            var suffix = Guid.NewGuid().ToString("N")[..12];
            return $"AGT{DateTime.Now:yyyyMMddHHmmssfff}{actionName.Replace(".", "", StringComparison.Ordinal)}{suffix}";
        }

        private sealed class LoggerLogMessage
        {
            public string ServerID { get; set; } = "";

            public string RunningEnvironment { get; set; } = "";

            public string ProgramName { get; set; } = "";

            public string GlobalID { get; set; } = "";

            public string Acknowledge { get; set; } = "";

            public string ApplicationID { get; set; } = "";

            public string ProjectID { get; set; } = "";

            public string TransactionID { get; set; } = "";

            public string ServiceID { get; set; } = "";

            public string Type { get; set; } = "";

            public string Flow { get; set; } = "";

            public string Level { get; set; } = "";

            public string Format { get; set; } = "";

            public string Message { get; set; } = "";

            public string Properties { get; set; } = "";

            public string UserID { get; set; } = "";

            public string CreatedAt { get; set; } = "";

            public string IpAddress { get; set; } = "";

            public string DeviceID { get; set; } = "";

            public string ProgramID { get; set; } = "";
        }
    }
}
