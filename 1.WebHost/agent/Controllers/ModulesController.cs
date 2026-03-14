using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Logging;

namespace agent.Controllers
{
    [Route("modules")]
    [ServiceFilter(typeof(ManagementKeyActionFilter))]
    public sealed class ModulesController : AgentControllerBase
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

        public ModulesController(
            ITargetProcessManager targetProcessManager,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory)
        {
            this.targetProcessManager = targetProcessManager;
            this.httpClientFactory = httpClientFactory;
            logger = loggerFactory.CreateLogger<ModulesController>();
        }

        [HttpGet("{targetAckId}/{moduleId}")]
        public async Task<ActionResult> GetModule(
            string targetAckId,
            string moduleId,
            CancellationToken cancellationToken)
        {
            var result = await GetModuleResultAsync(moduleId, targetAckId, cancellationToken);
            return ToOperationResult(result);
        }

        [HttpPost("{targetAckId}/{moduleId}")]
        public async Task<ActionResult> SaveModule(
            string targetAckId,
            string moduleId,
            [FromBody] JsonObject payload,
            CancellationToken cancellationToken)
        {
            var result = await SaveModuleResultAsync(moduleId, targetAckId, payload, cancellationToken);
            return ToOperationResult(result);
        }

        private Task<ModuleConfigResponse> GetModuleResultAsync(string moduleId, string targetAckId, CancellationToken cancellationToken)
        {
            var result = new ModuleConfigResponse
            {
                ModuleId = moduleId
            };

            if (TryResolveModuleContext(moduleId, targetAckId, out var context, out var errorCode, out var message) == false || context is null)
            {
                result.Success = false;
                result.ErrorCode = errorCode;
                result.Message = message;
                result.Errors.Add(message);
                return Task.FromResult(result);
            }

            cancellationToken.ThrowIfCancellationRequested();
            result.TargetId = context.Target.TargetAckId;
            result.ModulePath = context.ModuleFilePath;
            result.Module = context.ModuleRoot.DeepClone();
            result.Message = "module.json을 불러왔습니다.";

            return Task.FromResult(result);
        }

        private async Task<ModuleSaveResponse> SaveModuleResultAsync(string moduleId, string targetAckId, JsonObject payload, CancellationToken cancellationToken)
        {
            var result = new ModuleSaveResponse
            {
                ModuleId = moduleId
            };

            if (TryResolveModuleContext(moduleId, targetAckId, out var context, out var errorCode, out var message) == false || context is null)
            {
                result.Success = false;
                result.ErrorCode = errorCode;
                result.Message = message;
                result.Errors.Add(message);
                return result;
            }

            result.TargetId = context.Target.TargetAckId;
            result.ModulePath = context.ModuleFilePath;

            var changedValues = new Dictionary<string, JsonNode>(StringComparer.OrdinalIgnoreCase);
            var removedKeys = new List<string>();
            CollectJsonChanges(context.ModuleRoot, payload, "", changedValues, removedKeys);
            result.ChangedPaths = changedValues.Keys.OrderBy(p => p, StringComparer.OrdinalIgnoreCase).ToList();
            result.RemovedPaths = removedKeys.OrderBy(p => p, StringComparer.OrdinalIgnoreCase).ToList();

            try
            {
                cancellationToken.ThrowIfCancellationRequested();
                await System.IO.File.WriteAllTextAsync(context.ModuleFilePath, payload.ToJsonString(writeJsonOptions), cancellationToken);
                result.Saved = true;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "모듈 설정 저장 실패. 대상ID={TargetId}, 모듈ID={ModuleId}, 경로={Path}", context.Target.TargetAckId, moduleId, context.ModuleFilePath);
                result.Success = false;
                result.ErrorCode = "module_save_failed";
                result.Message = "module.json 저장에 실패했습니다.";
                result.Errors.Add(exception.Message);
                return result;
            }

            var moduleConfig = payload["ModuleConfig"] as JsonObject;
            var eventAction = moduleConfig?["EventAction"];
            var subscribeAction = moduleConfig?["SubscribeAction"];

            if (eventAction is not null || subscribeAction is not null)
            {
                var runtimeApply = await TryApplyModuleMediatorSettingsAsync(context.TargetContext, moduleId, eventAction, subscribeAction, cancellationToken);
                result.RuntimeApplied = runtimeApply.Success;
                result.RuntimeApplyResult = runtimeApply.ResultNode;

                foreach (var item in runtimeApply.Errors)
                {
                    result.Errors.Add(item);
                }

                foreach (var item in runtimeApply.RestartRequiredKeys)
                {
                    if (result.RestartRequiredPaths.Contains(item, StringComparer.OrdinalIgnoreCase) == false)
                    {
                        result.RestartRequiredPaths.Add(item);
                    }
                }
            }

            foreach (var path in result.ChangedPaths)
            {
                if (IsRealtimeModulePath(path) == false && result.RestartRequiredPaths.Contains(path, StringComparer.OrdinalIgnoreCase) == false)
                {
                    result.RestartRequiredPaths.Add(path);
                }
            }

            foreach (var path in result.RemovedPaths)
            {
                if (result.RestartRequiredPaths.Contains(path, StringComparer.OrdinalIgnoreCase) == false)
                {
                    result.RestartRequiredPaths.Add(path);
                }
            }

            result.RestartRequiredPaths = result.RestartRequiredPaths
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
                .ToList();

            result.Message = "module.json을 저장했습니다.";
            return result;
        }

        private async Task<RuntimeApplyResult> TryApplyModuleMediatorSettingsAsync(
            TargetContext context,
            string moduleId,
            JsonNode? eventAction,
            JsonNode? subscribeAction,
            CancellationToken cancellationToken)
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

            var requestNode = new JsonObject
            {
                ["persistToFile"] = false
            };

            if (eventAction is not null)
            {
                requestNode["eventAction"] = eventAction.DeepClone();
            }

            if (subscribeAction is not null)
            {
                requestNode["subscribeAction"] = subscribeAction.DeepClone();
            }

            if (requestNode.Count == 1)
            {
                result.Success = true;
                return result;
            }

            var client = httpClientFactory.CreateClient(HttpClientName);
            var path = $"/moduleconfiguration/mediatr/{Uri.EscapeDataString(moduleId)}/apply?hostAccessID={Uri.EscapeDataString(hostAccessId)}";
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
                logger.LogWarning(exception, "ack 런타임 모듈 적용 API 호출 실패. 대상ID={TargetId}, 모듈ID={ModuleId}", context.Target.TargetAckId, moduleId);
                result.Errors.Add("런타임 적용 API 호출에 실패했습니다.");
                return result;
            }
        }

        private bool TryResolveTargetContext(string targetAckId, out TargetContext? context, out string errorCode, out string message)
        {
            context = null;
            errorCode = "";
            message = "";

            if (targetProcessManager.TryGetTarget(targetAckId, out var target) == false || target is null)
            {
                errorCode = "target_not_found";
                message = $"대상 '{targetAckId}'을(를) 찾을 수 없습니다.";
                return false;
            }

            var appSettingsPath = ResolveAppSettingsPath(target);
            if (System.IO.File.Exists(appSettingsPath) == false)
            {
                errorCode = "appsettings_not_found";
                message = $"대상 '{targetAckId}'의 appsettings.json을 찾을 수 없습니다.";
                return false;
            }

            JsonObject appSettingsRoot;
            try
            {
                appSettingsRoot = ReadJsonObjectFromFile(appSettingsPath);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "appsettings 파일 파싱 실패. 대상ID={TargetId}, 경로={Path}", targetAckId, appSettingsPath);
                errorCode = "appsettings_parse_failed";
                message = $"대상 '{targetAckId}'의 appsettings.json 파싱에 실패했습니다.";
                return false;
            }

            context = new TargetContext(target, appSettingsPath, appSettingsRoot);
            return true;
        }

        private bool TryResolveModuleContext(string moduleId, string targetAckId, out ModuleContext? moduleContext, out string errorCode, out string message)
        {
            moduleContext = null;
            errorCode = "";
            message = "";

            if (string.IsNullOrWhiteSpace(moduleId) == true)
            {
                errorCode = "invalid_module_id";
                message = "module-id가 필요합니다.";
                return false;
            }

            if (TryResolveTargetContext(targetAckId, out var targetContext, out errorCode, out message) == false || targetContext is null)
            {
                return false;
            }

            var modulePath = ResolveModulePath(targetContext, moduleId);
            if (System.IO.File.Exists(modulePath) == false)
            {
                errorCode = "module_file_not_found";
                message = $"모듈 '{moduleId}'의 module.json을 찾을 수 없습니다.";
                return false;
            }

            JsonObject moduleRoot;
            try
            {
                moduleRoot = ReadJsonObjectFromFile(modulePath);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "모듈 파일 파싱 실패. 대상ID={TargetId}, 모듈ID={ModuleId}, 경로={Path}", targetContext.Target.TargetAckId, moduleId, modulePath);
                errorCode = "module_parse_failed";
                message = $"모듈 '{moduleId}'의 module.json 파싱에 실패했습니다.";
                return false;
            }

            moduleContext = new ModuleContext(targetContext, moduleId, modulePath, moduleRoot);
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

        private static string ResolveModulePath(TargetContext context, string moduleId)
        {
            var appSettingsDirectory = Path.GetDirectoryName(context.AppSettingsPath) ?? AppContext.BaseDirectory;
            var loadModuleBasePath = GetAppSettingsString(context.AppSettingsRoot, "LoadModuleBasePath");
            if (string.IsNullOrWhiteSpace(loadModuleBasePath) == true)
            {
                loadModuleBasePath = "../modules";
            }

            var moduleBasePath = TargetProcessManager.ResolvePath(loadModuleBasePath, appSettingsDirectory);
            return Path.Combine(moduleBasePath, moduleId, "module.json");
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

        private static string GetAppSettingsString(JsonObject appSettingsRoot, string key)
        {
            return appSettingsRoot["AppSettings"]?[key]?.GetValue<string>()?.Trim() ?? "";
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

        private static bool IsRealtimeModulePath(string path)
        {
            return string.Equals(path, "ModuleConfig:EventAction", StringComparison.OrdinalIgnoreCase)
                || string.Equals(path, "ModuleConfig:SubscribeAction", StringComparison.OrdinalIgnoreCase);
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

        private sealed class ModuleContext
        {
            public ModuleContext(TargetContext targetContext, string moduleId, string moduleFilePath, JsonObject moduleRoot)
            {
                TargetContext = targetContext;
                Target = targetContext.Target;
                ModuleId = moduleId;
                ModuleFilePath = moduleFilePath;
                ModuleRoot = moduleRoot;
            }

            public TargetContext TargetContext { get; }

            public TargetProcessOptions Target { get; }

            public string ModuleId { get; }

            public string ModuleFilePath { get; }

            public JsonObject ModuleRoot { get; }
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
