using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using agent.Options;
using agent.Security;
using agent.Services;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Serilog;

namespace agent.Controllers
{
    [Route("targets")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class TargetsController : AgentControllerBase
    {
        private const string AuditHttpClientName = "logger-module";

        private static readonly JsonSerializerOptions jsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = null
        };

        private readonly IHttpClientFactory httpClientFactory;
        private readonly ITargetProcessManager targetProcessManager;
        private readonly IOptionsMonitor<AgentOptions> optionsMonitor;

        public TargetsController(
            ITargetProcessManager targetProcessManager,
            IOptionsMonitor<AgentOptions> optionsMonitor,
            IHttpClientFactory httpClientFactory)
        {
            this.targetProcessManager = targetProcessManager;
            this.httpClientFactory = httpClientFactory;
            this.optionsMonitor = optionsMonitor;
        }

        [HttpGet("")]
        public async Task<ActionResult> GetTargets(CancellationToken cancellationToken)
        {
            var targets = targetProcessManager.GetTargets();
            await WriteTargetsAuditAsync(HttpContext, "targets.list", null, true, StatusCodes.Status200OK, $"count={targets.Count}", cancellationToken);
            return Ok(targets);
        }

        [HttpGet("{targetAckId}/status")]
        public async Task<ActionResult> GetStatus(string targetAckId, CancellationToken cancellationToken)
        {
            var status = await targetProcessManager.GetStatusAsync(targetAckId, cancellationToken);
            if (status is null)
            {
                await WriteTargetsAuditAsync(HttpContext, "targets.status", targetAckId, false, StatusCodes.Status404NotFound, "대상을 찾을 수 없습니다.", cancellationToken);
                return NotFound(new
                {
                    targetAckId,
                    message = "대상을 찾을 수 없습니다."
                });
            }

            await WriteTargetsAuditAsync(HttpContext, "targets.status", targetAckId, true, StatusCodes.Status200OK, status.State, cancellationToken);
            return Ok(status);
        }

        [HttpGet("{targetAckId}/manifest")]
        public async Task<ActionResult> DownloadManifest(string targetAckId, CancellationToken cancellationToken)
        {
            if (targetProcessManager.TryGetTarget(targetAckId, out var target) == false || target is null)
            {
                await WriteTargetsAuditAsync(HttpContext, "targets.manifest", targetAckId, false, StatusCodes.Status404NotFound, "대상을 찾을 수 없습니다.", cancellationToken);
                return NotFound(new
                {
                    targetAckId,
                    message = "대상을 찾을 수 없습니다."
                });
            }

            if (string.IsNullOrWhiteSpace(target.PackageMakeCommand) == true)
            {
                await WriteTargetsAuditAsync(HttpContext, "targets.manifest", targetAckId, false, StatusCodes.Status400BadRequest, "PackageMakeCommand 값 확인이 필요합니다.", cancellationToken);
                return BadRequest(new
                {
                    targetAckId,
                    message = "PackageMakeCommand 값 확인이 필요합니다."
                });
            }

            var workingDirectory = TargetProcessManager.ResolveWorkingDirectory(target);
            var expandedCommand = TargetProcessManager.ExpandPathVariables(target.PackageMakeCommand.Trim());
            var commandResult = await ExecuteShellCommandAsync(expandedCommand, workingDirectory, cancellationToken);
            if (commandResult.ExitCode != 0)
            {
                var errorMessage = string.IsNullOrWhiteSpace(commandResult.StandardError) == true
                    ? $"manifest 생성 명령이 실패했습니다. ExitCode={commandResult.ExitCode}"
                    : commandResult.StandardError.Trim();
                Log.Warning("manifest 생성 명령 실패. 대상ID={TargetId}, ExitCode={ExitCode}, Command={Command}, WorkingDirectory={WorkingDirectory}", targetAckId, commandResult.ExitCode, expandedCommand, workingDirectory);
                await WriteTargetsAuditAsync(HttpContext, "targets.manifest", targetAckId, false, StatusCodes.Status500InternalServerError, errorMessage, cancellationToken);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    targetAckId,
                    message = errorMessage
                });
            }

            var manifestPath = ResolveManifestFilePath(expandedCommand, workingDirectory);
            if (System.IO.File.Exists(manifestPath) == false)
            {
                var message = $"manifest 파일을 찾을 수 없습니다. Path={manifestPath}";
                await WriteTargetsAuditAsync(HttpContext, "targets.manifest", targetAckId, false, StatusCodes.Status500InternalServerError, message, cancellationToken);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    targetAckId,
                    message
                });
            }

            var bytes = await System.IO.File.ReadAllBytesAsync(manifestPath, cancellationToken);
            var downloadFileName = $"{targetAckId}-manifest-{DateTime.Now:yyyyMMddHHss}.txt";
            await WriteTargetsAuditAsync(HttpContext, "targets.manifest", targetAckId, true, StatusCodes.Status200OK, $"manifest={downloadFileName}", cancellationToken);
            return File(bytes, "text/plain; charset=utf-8", downloadFileName);
        }
        
        [HttpPost("{targetAckId}/start")]
        public async Task<ActionResult> Start(string targetAckId, CancellationToken cancellationToken)
        {
            var result = await targetProcessManager.StartAsync(targetAckId, cancellationToken);
            await WriteTargetsAuditAsync(HttpContext, "targets.start", targetAckId, result.Success, ToCommandStatusCode(result), result.Message, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{targetAckId}/stop")]
        public async Task<ActionResult> Stop(string targetAckId, CancellationToken cancellationToken)
        {
            var result = await targetProcessManager.StopAsync(targetAckId, cancellationToken);
            await WriteTargetsAuditAsync(HttpContext, "targets.stop", targetAckId, result.Success, ToCommandStatusCode(result), result.Message, cancellationToken);
            return ToCommandResult(result);
        }

        [HttpPost("{targetAckId}/restart")]
        public async Task<ActionResult> Restart(string targetAckId, CancellationToken cancellationToken)
        {
            var result = await targetProcessManager.RestartAsync(targetAckId, cancellationToken);
            await WriteTargetsAuditAsync(HttpContext, "targets.restart", targetAckId, result.Success, ToCommandStatusCode(result), result.Message, cancellationToken);
            return ToCommandResult(result);
        }

        private Task WriteTargetsAuditAsync(
            HttpContext httpContext,
            string actionName,
            string? targetAckId,
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
                TargetID = targetAckId ?? "",
                Action = actionName,
                Result = success == true ? "success" : "failure",
                StatusCode = statusCode,
                Message = message ?? ""
            };

            return SendAuditAsync(
                httpContext,
                actionName,
                targetAckId,
                success,
                statusCode,
                message ?? "",
                JsonSerializer.Serialize(properties, jsonSerializerOptions),
                cancellationToken);
        }

        private async Task SendAuditAsync(
            HttpContext httpContext,
            string actionName,
            string? targetAckId,
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
                var logMessage = BuildLogMessage(httpContext, auditOptions, actionName, targetAckId, success, statusCode, message, properties);
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
                    Log.Warning(
                        "감사 로그 전송 실패. URL={Url}, 상태코드={StatusCode}, 작업={Action}, 대상ID={TargetID}",
                        auditOptions.LogServerUrl,
                        (int)response.StatusCode,
                        actionName,
                        targetAckId ?? "");
                }
            }
            catch (OperationCanceledException)
            {
                Log.Warning("감사 로그 전송 시간 초과. 작업={Action}, 대상ID={TargetID}", actionName, targetAckId ?? "");
            }
            catch (Exception exception)
            {
                Log.Warning(exception, "감사 로그 전송 예외 발생. 작업={Action}, 대상ID={TargetID}", actionName, targetAckId ?? "");
            }
        }

        private static LoggerLogMessage BuildLogMessage(
            HttpContext httpContext,
            AuditLogOptions auditOptions,
            string actionName,
            string? targetAckId,
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
                ServiceID = string.IsNullOrWhiteSpace(targetAckId) == true ? actionName : $"{actionName}:{targetAckId}",
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

        private static async Task<(int ExitCode, string StandardOutput, string StandardError)> ExecuteShellCommandAsync(string command, string workingDirectory, CancellationToken cancellationToken)
        {
            var startInfo = BuildShellStartInfo(command, workingDirectory);
            using var process = new Process
            {
                StartInfo = startInfo
            };

            process.Start();
            var standardOutputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
            var standardErrorTask = process.StandardError.ReadToEndAsync(cancellationToken);
            await process.WaitForExitAsync(cancellationToken);

            return (process.ExitCode, await standardOutputTask, await standardErrorTask);
        }

        private static ProcessStartInfo BuildShellStartInfo(string command, string workingDirectory)
        {
            var resolvedWorkingDirectory = Path.GetFullPath(workingDirectory);
            if (OperatingSystem.IsWindows() == true)
            {
                return new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c {command}",
                    WorkingDirectory = resolvedWorkingDirectory,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };
            }

            return new ProcessStartInfo
            {
                FileName = "/bin/bash",
                Arguments = $"-lc \"{command.Replace("\"", "\\\"", StringComparison.Ordinal)}\"",
                WorkingDirectory = resolvedWorkingDirectory,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };
        }

        private static string ResolveManifestFilePath(string command, string workingDirectory)
        {
            var outputPath = TryResolveOutputOptionPath(command, workingDirectory);
            var outputDirectoryPath = string.IsNullOrWhiteSpace(outputPath) == true ? workingDirectory : outputPath;
            return Path.Combine(Path.GetFullPath(outputDirectoryPath), "deploy-filelist.txt");
        }

        private static string? TryResolveOutputOptionPath(string command, string workingDirectory)
        {
            var match = Regex.Match(command, @"--output(?::|=|\s+)(?:""(?<value>[^""]+)""|(?<value>[^\s]+))", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
            if (match.Success == false)
            {
                return null;
            }

            var rawValue = match.Groups["value"].Value.Trim();
            if (string.IsNullOrWhiteSpace(rawValue) == true)
            {
                return null;
            }

            var expandedValue = TargetProcessManager.ExpandPathVariables(rawValue);
            return Path.IsPathRooted(expandedValue) == true
                ? Path.GetFullPath(expandedValue)
                : Path.GetFullPath(Path.Combine(workingDirectory, expandedValue));
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




