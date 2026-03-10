using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using agent.Options;
using agent.Security;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace agent.Controllers
{
    [Route("targets")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class TargetsController : TargetProcessControllerBase
    {
        private const string AuditHttpClientName = "logger-module";

        private static readonly JsonSerializerOptions jsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = null
        };

        private readonly IHttpClientFactory httpClientFactory;
        private readonly IOptionsMonitor<AgentOptions> optionsMonitor;
        private readonly ILogger logger;

        public TargetsController(
            IOptionsMonitor<AgentOptions> optionsMonitor,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory)
            : base(optionsMonitor, httpClientFactory, loggerFactory)
        {
            this.httpClientFactory = httpClientFactory;
            this.optionsMonitor = optionsMonitor;
            logger = loggerFactory.CreateLogger<TargetsController>();
        }

        [HttpGet("")]
        public async Task<ActionResult> GetTargets(CancellationToken cancellationToken)
        {
            var targets = base.GetTargets();
            await WriteTargetsAuditAsync(HttpContext, "targets.list", null, true, StatusCodes.Status200OK, $"count={targets.Count}", cancellationToken);
            return Ok(targets);
        }

        [HttpGet("{id}/status")]
        public async Task<ActionResult> GetStatus(string id, CancellationToken cancellationToken)
        {
            var status = await base.GetStatusAsync(id, cancellationToken);
            if (status is null)
            {
                await WriteTargetsAuditAsync(HttpContext, "targets.status", id, false, StatusCodes.Status404NotFound, "대상을 찾을 수 없습니다.", cancellationToken);
                return NotFound(new
                {
                    id,
                    message = "대상을 찾을 수 없습니다."
                });
            }

            await WriteTargetsAuditAsync(HttpContext, "targets.status", id, true, StatusCodes.Status200OK, status.State, cancellationToken);
            return Ok(status);
        }

        [HttpPost("{id}/start")]
        public async Task<ActionResult> Start(string id, CancellationToken cancellationToken)
        {
            var result = await base.StartAsync(id, cancellationToken);
            await WriteTargetsAuditAsync(HttpContext, "targets.start", id, result.Success, ToCommandStatusCode(result), result.Message, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{id}/stop")]
        public async Task<ActionResult> Stop(string id, CancellationToken cancellationToken)
        {
            var result = await base.StopAsync(id, cancellationToken);
            await WriteTargetsAuditAsync(HttpContext, "targets.stop", id, result.Success, ToCommandStatusCode(result), result.Message, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{id}/restart")]
        public async Task<ActionResult> Restart(string id, CancellationToken cancellationToken)
        {
            var result = await base.RestartAsync(id, cancellationToken);
            await WriteTargetsAuditAsync(HttpContext, "targets.restart", id, result.Success, ToCommandStatusCode(result), result.Message, cancellationToken);
            return ToCommandResult(result);
        }

        private Task WriteTargetsAuditAsync(
            HttpContext httpContext,
            string actionName,
            string? targetId,
            bool success,
            int statusCode,
            string? message,
            CancellationToken cancellationToken)
        {
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

            return SendAuditAsync(
                httpContext,
                actionName,
                targetId,
                success,
                statusCode,
                message ?? "",
                JsonSerializer.Serialize(properties, jsonSerializerOptions),
                cancellationToken);
        }

        private async Task SendAuditAsync(
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
                var logMessage = BuildLogMessage(httpContext, auditOptions, actionName, targetId, success, statusCode, message, properties);
                var content = new StringContent(JsonSerializer.Serialize(logMessage, jsonSerializerOptions), Encoding.UTF8, "application/json");
                var client = httpClientFactory.CreateClient(AuditHttpClientName);
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
                        "감사 로그 전송 실패. URL={Url}, 상태코드={StatusCode}, 작업={Action}, 대상ID={TargetID}",
                        auditOptions.LogServerUrl,
                        (int)response.StatusCode,
                        actionName,
                        targetId ?? "");
                }
            }
            catch (OperationCanceledException)
            {
                logger.LogWarning("감사 로그 전송 시간 초과. 작업={Action}, 대상ID={TargetID}", actionName, targetId ?? "");
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "감사 로그 전송 예외 발생. 작업={Action}, 대상ID={TargetID}", actionName, targetId ?? "");
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
