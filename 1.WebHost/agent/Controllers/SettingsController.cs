using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using agent.Entity;
using agent.Options;
using agent.Security;
using agent.Services;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace agent.Controllers
{
    [Route("settings")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class SettingsController : AgentControllerBase
    {
        private const string HttpClientName = "ack-runtime";

        private static readonly Regex portRegex = new Regex(@"--port(?:=|\s+)(?<port>\d{2,5})", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly JsonSerializerOptions writeJsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = null
        };

        private static readonly JsonDocumentOptions readJsonOptions = new JsonDocumentOptions
        {
            AllowTrailingCommas = true,
            CommentHandling = JsonCommentHandling.Skip
        };

        private readonly ITargetProcessManager targetProcessManager;
        private readonly IHttpClientFactory httpClientFactory;
        private readonly ILogger logger;

        public SettingsController(
            ITargetProcessManager targetProcessManager,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory)
        {
            this.targetProcessManager = targetProcessManager;
            this.httpClientFactory = httpClientFactory;
            logger = loggerFactory.CreateLogger<SettingsController>();
        }

        [HttpGet("{id}/diagnostics")]
        public async Task<ActionResult> GetDiagnostics(string id, CancellationToken cancellationToken)
        {
            var result = await GetDiagnosticsResultAsync(id, cancellationToken);
            return ToOperationResult(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetAppSettings(string id, CancellationToken cancellationToken)
        {
            var result = await GetAppSettingsResultAsync(id, cancellationToken);
            return ToOperationResult(result);
        }

        [HttpPost("{id}")]
        public async Task<ActionResult> SaveAppSettings(string id, [FromBody] JsonObject payload, CancellationToken cancellationToken)
        {
            var result = await SaveAppSettingsResultAsync(id, payload, cancellationToken);
            return ToOperationResult(result);
        }

        private Task<SettingsStatusResponse> GetAppSettingsResultAsync(string targetId, CancellationToken cancellationToken)
        {
            var result = new SettingsStatusResponse
            {
                Id = targetId
            };

            if (TryResolveTargetContext(targetId, out var context, out var errorCode, out var message) == false || context is null)
            {
                result.Success = false;
                result.ErrorCode = errorCode;
                result.Message = message;
                result.Errors.Add(message);
                return Task.FromResult(result);
            }

            cancellationToken.ThrowIfCancellationRequested();
            result.RuntimeState = "Success";
            result.RuntimeMessage = context.AppSettingsRoot;

            return Task.FromResult(result);
        }

        private async Task<SettingsStatusResponse> GetDiagnosticsResultAsync(string targetId, CancellationToken cancellationToken)
        {
            var result = new SettingsStatusResponse
            {
                Id = targetId
            };

            if (TryResolveTargetContext(targetId, out var context, out var errorCode, out var message) == false || context is null)
            {
                result.Success = false;
                result.ErrorCode = errorCode;
                result.Message = message;
                result.Errors.Add(message);
                return result;
            }

            cancellationToken.ThrowIfCancellationRequested();

            var diagnosticsResult = await TryGetDiagnosticsAsync(context, cancellationToken);
            result.RuntimeState = diagnosticsResult.RuntimeState;
            result.RuntimeMessage = diagnosticsResult.Message;
            return result;
        }

        private async Task<SettingsSaveResponse> SaveAppSettingsResultAsync(string targetId, JsonObject payload, CancellationToken cancellationToken)
        {
            var result = new SettingsSaveResponse
            {
                Id = targetId
            };

            if (TryResolveTargetContext(targetId, out var context, out var errorCode, out var message) == false || context is null)
            {
                result.Success = false;
                result.ErrorCode = errorCode;
                result.Message = message;
                result.Errors.Add(message);
                return result;
            }

            result.AppSettingsPath = context.AppSettingsPath;

            if (payload["AppSettings"] is not JsonObject newAppSettings)
            {
                result.Success = false;
                result.ErrorCode = "invalid_payload";
                result.Message = "요청 본문에 AppSettings 객체가 있어야 합니다.";
                result.Errors.Add(result.Message);
                return result;
            }

            var oldAppSettings = context.AppSettingsRoot["AppSettings"] as JsonObject ?? new JsonObject();
            var changedValues = new Dictionary<string, JsonNode>(StringComparer.OrdinalIgnoreCase);
            var removedKeys = new List<string>();
            CollectJsonChanges(oldAppSettings, newAppSettings, "AppSettings", changedValues, removedKeys);

            result.ChangedKeys = changedValues.Keys.OrderBy(p => p, StringComparer.OrdinalIgnoreCase).ToList();
            result.RemovedKeys = removedKeys.OrderBy(p => p, StringComparer.OrdinalIgnoreCase).ToList();

            try
            {
                cancellationToken.ThrowIfCancellationRequested();
                await System.IO.File.WriteAllTextAsync(context.AppSettingsPath, payload.ToJsonString(writeJsonOptions), cancellationToken);
                result.Saved = true;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "appsettings 저장 실패. 대상ID={TargetId}, 경로={Path}", targetId, context.AppSettingsPath);
                result.Success = false;
                result.ErrorCode = "settings_save_failed";
                result.Message = "appsettings.json 저장에 실패했습니다.";
                result.Errors.Add(exception.Message);
                return result;
            }

            if (changedValues.Count > 0)
            {
                var runtimeApply = await TryApplyGlobalSettingsAsync(context, changedValues, cancellationToken);
                result.RuntimeApplied = runtimeApply.Success;
                result.RuntimeApplyResult = runtimeApply.ResultNode;

                foreach (var item in runtimeApply.Errors)
                {
                    result.Errors.Add(item);
                }

                foreach (var item in runtimeApply.RestartRequiredKeys)
                {
                    if (result.RestartRequiredKeys.Contains(item, StringComparer.OrdinalIgnoreCase) == false)
                    {
                        result.RestartRequiredKeys.Add(item);
                    }
                }

                if (runtimeApply.Success == true)
                {
                    foreach (var key in changedValues.Keys)
                    {
                        if (runtimeApply.AppliedKeys.Contains(key, StringComparer.OrdinalIgnoreCase) == false
                            && runtimeApply.RestartRequiredKeys.Contains(key, StringComparer.OrdinalIgnoreCase) == false
                            && result.RestartRequiredKeys.Contains(key, StringComparer.OrdinalIgnoreCase) == false)
                        {
                            result.RestartRequiredKeys.Add(key);
                        }
                    }
                }
                else
                {
                    foreach (var key in changedValues.Keys)
                    {
                        if (result.RestartRequiredKeys.Contains(key, StringComparer.OrdinalIgnoreCase) == false)
                        {
                            result.RestartRequiredKeys.Add(key);
                        }
                    }
                }
            }

            foreach (var key in result.RemovedKeys)
            {
                if (result.RestartRequiredKeys.Contains(key, StringComparer.OrdinalIgnoreCase) == false)
                {
                    result.RestartRequiredKeys.Add(key);
                }
            }

            result.RestartRequiredKeys = result.RestartRequiredKeys
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
                .ToList();

            result.Message = "appsettings.json을 저장했습니다.";
            return result;
        }

        private async Task<RuntimeApplyResult> TryApplyGlobalSettingsAsync(TargetContext context, Dictionary<string, JsonNode> changedValues, CancellationToken cancellationToken)
        {
            var result = new RuntimeApplyResult();
            var hostAccessId = context.Target.HostAccessID;
            if (string.IsNullOrWhiteSpace(hostAccessId) == true)
            {
                result.Errors.Add("Runtime apply skipped: AppSettings:HostAccessID가 비어 있습니다.");
                return result;
            }

            var port = GetServerPort(context.Target, context.AppSettingsRoot);
            if (port <= 0)
            {
                result.Errors.Add("런타임 적용 건너뜀: 서버 포트가 올바르지 않습니다.");
                return result;
            }

            var valuesNode = new JsonObject();
            foreach (var item in changedValues)
            {
                valuesNode[item.Key] = item.Value.DeepClone();
            }

            if (valuesNode.Count == 0)
            {
                result.Success = true;
                return result;
            }

            var requestNode = new JsonObject
            {
                ["values"] = valuesNode,
                ["persistToFile"] = false
            };

            var client = httpClientFactory.CreateClient(HttpClientName);
            var path = $"/globalconfiguration/apply?hostAccessID={Uri.EscapeDataString(hostAccessId)}";
            var requestContent = new StringContent(requestNode.ToJsonString(writeJsonOptions), Encoding.UTF8, "application/json");

            try
            {
                using var response = await client.PostAsync(BuildAckUrl(port, path), requestContent, cancellationToken);
                var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
                result.ResultNode = TryParseJson(responseText);

                if (response.IsSuccessStatusCode == false)
                {
                    result.Errors.Add($"런타임 적용 실패: HTTP {(int)response.StatusCode}");
                    return result;
                }

                result.Success = true;
                result.AppliedKeys = ReadStringArray(result.ResultNode, "appliedKeys");
                result.RestartRequiredKeys = ReadStringArray(result.ResultNode, "restartRequiredKeys");
                result.Errors.AddRange(ReadStringArray(result.ResultNode, "errors"));
                return result;
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "ack 런타임 전역 적용 API 호출 실패. 대상ID={TargetId}", context.Target.Id);
                result.Errors.Add("런타임 적용 API 호출에 실패했습니다.");
                return result;
            }
        }

        private async Task<DiagnosticsReadResult> TryGetDiagnosticsAsync(TargetContext context, CancellationToken cancellationToken)
        {
            var result = new DiagnosticsReadResult();
            var status = await targetProcessManager.GetStatusAsync(context.Target.Id, cancellationToken);
            result.RuntimeState = status?.State ?? "Unknown";

            if (status is null || string.Equals(status.State, "Running", StringComparison.OrdinalIgnoreCase) == false)
            {
                result.Message = "대상 프로세스가 실행 중이 아닙니다.";
                return result;
            }

            var hostAccessId = context.Target.HostAccessID;
            if (string.IsNullOrWhiteSpace(hostAccessId) == true)
            {
                result.Message = "AppSettings:HostAccessID가 비어 있습니다.";
                return result;
            }

            var port = GetServerPort(context.Target, context.AppSettingsRoot);
            if (port <= 0)
            {
                result.Message = "AppSettings:ServerPort가 올바르지 않습니다.";
                return result;
            }

            var client = httpClientFactory.CreateClient(HttpClientName);
            var path = $"/diagnostics?hostAccessID={Uri.EscapeDataString(hostAccessId)}";
            try
            {
                using var response = await client.GetAsync(BuildAckUrl(port, path), cancellationToken);
                if (response.IsSuccessStatusCode == false)
                {
                    result.Message = $"진단 요청 실패: HTTP {(int)response.StatusCode}";
                    return result;
                }

                var node = TryParseJson(await response.Content.ReadAsStringAsync(cancellationToken));
                result.Message = node;
                return result;
            }
            catch (Exception exception)
            {
                logger.LogDebug(exception, "진단 요청 실패. 대상ID={TargetId}", context.Target.Id);
                result.Message = "런타임 진단 요청에 실패했습니다.";
                return result;
            }
        }

        private bool TryResolveTargetContext(string targetId, out TargetContext? context, out string errorCode, out string message)
        {
            context = null;
            errorCode = "";
            message = "";

            if (targetProcessManager.TryGetTarget(targetId, out var target) == false || target is null)
            {
                errorCode = "target_not_found";
                message = $"대상 '{targetId}'을(를) 찾을 수 없습니다.";
                return false;
            }

            var appSettingsPath = ResolveAppSettingsPath(target);
            if (System.IO.File.Exists(appSettingsPath) == false)
            {
                errorCode = "appsettings_not_found";
                message = $"대상 '{targetId}'의 appsettings.json을 찾을 수 없습니다.";
                return false;
            }

            JsonObject appSettingsRoot;
            try
            {
                appSettingsRoot = ReadJsonObjectFromFile(appSettingsPath);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "appsettings 파일 파싱 실패. 대상ID={TargetId}, 경로={Path}", targetId, appSettingsPath);
                errorCode = "appsettings_parse_failed";
                message = $"대상 '{targetId}'의 appsettings.json 파싱에 실패했습니다.";
                return false;
            }

            context = new TargetContext(target, appSettingsPath, appSettingsRoot);
            return true;
        }

        private static string ResolveAppSettingsPath(TargetProcessOptions target)
        {
            var workingDirectory = TargetProcessManager.ResolveWorkingDirectory(target);
            var appSettingsPath = Path.Combine(workingDirectory, "appsettings.json");
            if (System.IO.File.Exists(appSettingsPath) == true)
            {
                return appSettingsPath;
            }

            if (string.IsNullOrWhiteSpace(target.ExecutablePath) == false && TargetProcessManager.IsPathLike(target.ExecutablePath) == true)
            {
                var executablePath = TargetProcessManager.ResolvePath(target.ExecutablePath, AppContext.BaseDirectory);
                var executableDirectory = Path.GetDirectoryName(executablePath);
                if (string.IsNullOrWhiteSpace(executableDirectory) == false)
                {
                    var fallback = Path.Combine(executableDirectory, "appsettings.json");
                    if (System.IO.File.Exists(fallback) == true)
                    {
                        return fallback;
                    }
                }
            }

            return appSettingsPath;
        }

        private static JsonObject ReadJsonObjectFromFile(string path)
        {
            var text = System.IO.File.ReadAllText(path);
            var node = JsonNode.Parse(text, documentOptions: readJsonOptions);
            if (node is not JsonObject result)
            {
                throw new InvalidDataException($"JSON root is not object. path={path}");
            }

            return result;
        }

        private static JsonNode? TryParseJson(string? text)
        {
            if (string.IsNullOrWhiteSpace(text) == true)
            {
                return null;
            }

            try
            {
                return JsonNode.Parse(text, documentOptions: readJsonOptions);
            }
            catch
            {
                return null;
            }
        }

        private static int GetServerPort(TargetProcessOptions target, JsonObject appSettingsRoot)
        {
            var portNode = appSettingsRoot["AppSettings"]?["ServerPort"];
            if (portNode is JsonValue portValue && portValue.TryGetValue<int>(out var appSettingsPort) == true)
            {
                return appSettingsPort;
            }

            if (string.IsNullOrWhiteSpace(target.Arguments) == false)
            {
                var match = portRegex.Match(target.Arguments);
                if (match.Success == true && int.TryParse(match.Groups["port"].Value, out var port) == true)
                {
                    return port;
                }
            }

            return 8421;
        }

        private static string BuildAckUrl(int port, string path)
        {
            return $"http://127.0.0.1:{port}{path}";
        }

        private static void CollectJsonChanges(
            JsonNode? oldNode,
            JsonNode? newNode,
            string path,
            Dictionary<string, JsonNode> changedValues,
            List<string> removedKeys)
        {
            if (oldNode is JsonObject oldObject && newNode is JsonObject newObject)
            {
                foreach (var key in newObject.Select(p => p.Key))
                {
                    var currentPath = string.IsNullOrWhiteSpace(path) == true ? key : $"{path}:{key}";
                    CollectJsonChanges(oldObject[key], newObject[key], currentPath, changedValues, removedKeys);
                }

                foreach (var key in oldObject.Select(p => p.Key))
                {
                    if (newObject.ContainsKey(key) == false)
                    {
                        var currentPath = string.IsNullOrWhiteSpace(path) == true ? key : $"{path}:{key}";
                        removedKeys.Add(currentPath);
                    }
                }

                return;
            }

            if (JsonNode.DeepEquals(oldNode, newNode) == false && string.IsNullOrWhiteSpace(path) == false)
            {
                if (newNode is not null)
                {
                    changedValues[path] = newNode.DeepClone();
                }
                else
                {
                    removedKeys.Add(path);
                }
            }
        }

        private static List<string> ReadStringArray(JsonNode? node, string propertyName)
        {
            var result = new List<string>();
            var array = node?[propertyName] as JsonArray;
            if (array is null)
            {
                return result;
            }

            foreach (var item in array)
            {
                var value = item?.GetValue<string>()?.Trim();
                if (string.IsNullOrWhiteSpace(value) == false)
                {
                    result.Add(value);
                }
            }

            return result;
        }

        private sealed class TargetContext
        {
            public TargetContext(TargetProcessOptions target, string appSettingsPath, JsonObject appSettingsRoot)
            {
                Target = target;
                AppSettingsPath = appSettingsPath;
                AppSettingsRoot = appSettingsRoot;
            }

            public TargetProcessOptions Target { get; }

            public string AppSettingsPath { get; }

            public JsonObject AppSettingsRoot { get; }
        }

        private sealed class DiagnosticsReadResult
        {
            public string RuntimeState { get; set; } = "Unknown";

            public JsonNode? Message { get; set; }
        }

        private sealed class RuntimeApplyResult
        {
            public bool Success { get; set; }

            public JsonNode? ResultNode { get; set; }

            public List<string> AppliedKeys { get; set; } = new List<string>();

            public List<string> RestartRequiredKeys { get; set; } = new List<string>();

            public List<string> Errors { get; set; } = new List<string>();
        }
    }
}
