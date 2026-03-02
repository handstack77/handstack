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

using Microsoft.Extensions.Logging;

namespace agent.Services
{
    public sealed class SettingsModuleService : ISettingsModuleService
    {
        public const string HttpClientName = "ack-runtime";

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
        private readonly ILogger<SettingsModuleService> logger;

        public SettingsModuleService(
            ITargetProcessManager targetProcessManager,
            IHttpClientFactory httpClientFactory,
            ILogger<SettingsModuleService> logger)
        {
            this.targetProcessManager = targetProcessManager;
            this.httpClientFactory = httpClientFactory;
            this.logger = logger;
        }

        public async Task<SettingsStatusResponse> GetSettingsStatusAsync(string targetId, CancellationToken cancellationToken)
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

            result.AppSettingsPath = context.AppSettingsPath;
            result.AppSettings = context.AppSettingsRoot.DeepClone();
            result.ConfiguredModules = GetConfiguredModules(context.AppSettingsRoot);

            var diagnosticsResult = await TryGetDiagnosticsAsync(context, cancellationToken);
            result.RuntimeState = diagnosticsResult.RuntimeState;
            result.RuntimeMessage = diagnosticsResult.Message;
            result.LoadedModules = diagnosticsResult.Modules;

            return result;
        }

        public async Task<SettingsSaveResponse> SaveSettingsAsync(string targetId, JsonObject payload, CancellationToken cancellationToken)
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
                result.Message = "Request body must contain AppSettings object.";
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
                await File.WriteAllTextAsync(context.AppSettingsPath, payload.ToJsonString(writeJsonOptions), cancellationToken);
                result.Saved = true;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to save appsettings. TargetId={TargetId}, Path={Path}", targetId, context.AppSettingsPath);
                result.Success = false;
                result.ErrorCode = "settings_save_failed";
                result.Message = "Failed to save appsettings.json.";
                result.Errors.Add(exception.Message);
                return result;
            }

            if (changedValues.Count > 0)
            {
                // 즉시 반영 가능한 AppSettings 키는 ACK 런타임 API로 적용합니다.
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

            result.Message = "appsettings.json saved.";
            return result;
        }

        public async Task<ModuleConfigResponse> GetModuleAsync(string moduleId, string? targetId, CancellationToken cancellationToken)
        {
            var result = new ModuleConfigResponse
            {
                ModuleId = moduleId
            };

            if (TryResolveModuleContext(moduleId, targetId, out var context, out var errorCode, out var message) == false || context is null)
            {
                result.Success = false;
                result.ErrorCode = errorCode;
                result.Message = message;
                result.Errors.Add(message);
                return result;
            }

            result.TargetId = context.Target.Id;
            result.ModulePath = context.ModuleFilePath;
            result.Module = context.ModuleRoot.DeepClone();

            var diagnosticsResult = await TryGetDiagnosticsAsync(context.TargetContext, cancellationToken);
            result.IsLoaded = diagnosticsResult.Modules.Any(p => string.Equals(p.ModuleID, moduleId, StringComparison.OrdinalIgnoreCase));
            result.Message = "module.json loaded.";
            return result;
        }

        public async Task<ModuleSaveResponse> SaveModuleAsync(string moduleId, string? targetId, JsonObject payload, CancellationToken cancellationToken)
        {
            var result = new ModuleSaveResponse
            {
                ModuleId = moduleId
            };

            if (TryResolveModuleContext(moduleId, targetId, out var context, out var errorCode, out var message) == false || context is null)
            {
                result.Success = false;
                result.ErrorCode = errorCode;
                result.Message = message;
                result.Errors.Add(message);
                return result;
            }

            result.TargetId = context.Target.Id;
            result.ModulePath = context.ModuleFilePath;

            var changedValues = new Dictionary<string, JsonNode>(StringComparer.OrdinalIgnoreCase);
            var removedKeys = new List<string>();
            CollectJsonChanges(context.ModuleRoot, payload, "", changedValues, removedKeys);
            result.ChangedPaths = changedValues.Keys.OrderBy(p => p, StringComparer.OrdinalIgnoreCase).ToList();
            result.RemovedPaths = removedKeys.OrderBy(p => p, StringComparer.OrdinalIgnoreCase).ToList();

            try
            {
                cancellationToken.ThrowIfCancellationRequested();
                await File.WriteAllTextAsync(context.ModuleFilePath, payload.ToJsonString(writeJsonOptions), cancellationToken);
                result.Saved = true;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to save module setting. TargetId={TargetId}, ModuleId={ModuleId}, Path={Path}", context.Target.Id, moduleId, context.ModuleFilePath);
                result.Success = false;
                result.ErrorCode = "module_save_failed";
                result.Message = "Failed to save module.json.";
                result.Errors.Add(exception.Message);
                return result;
            }

            var moduleConfig = payload["ModuleConfig"] as JsonObject;
            var eventAction = moduleConfig?["EventAction"];
            var subscribeAction = moduleConfig?["SubscribeAction"];

            if (eventAction is not null || subscribeAction is not null)
            {
                // MediatR 관련(EventAction/SubscribeAction) 설정은 런타임 반영을 시도합니다.
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

            result.Message = "module.json saved.";
            return result;
        }

        private async Task<RuntimeApplyResult> TryApplyGlobalSettingsAsync(TargetContext context, Dictionary<string, JsonNode> changedValues, CancellationToken cancellationToken)
        {
            var result = new RuntimeApplyResult();
            var hostAccessId = GetAppSettingsString(context.AppSettingsRoot, "HostAccessID");
            if (string.IsNullOrWhiteSpace(hostAccessId) == true)
            {
                result.Errors.Add("Runtime apply skipped: AppSettings:HostAccessID is empty.");
                return result;
            }

            var port = GetServerPort(context.Target, context.AppSettingsRoot);
            if (port <= 0)
            {
                result.Errors.Add("Runtime apply skipped: server port is invalid.");
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
                    result.Errors.Add($"Runtime apply failed: HTTP {(int)response.StatusCode}");
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
                logger.LogWarning(exception, "Failed to call ack runtime global apply API. TargetId={TargetId}", context.Target.Id);
                result.Errors.Add("Runtime apply call failed.");
                return result;
            }
        }

        private async Task<RuntimeApplyResult> TryApplyModuleMediatorSettingsAsync(
            TargetContext context,
            string moduleId,
            JsonNode? eventAction,
            JsonNode? subscribeAction,
            CancellationToken cancellationToken)
        {
            var result = new RuntimeApplyResult();
            var hostAccessId = GetAppSettingsString(context.AppSettingsRoot, "HostAccessID");
            if (string.IsNullOrWhiteSpace(hostAccessId) == true)
            {
                result.Errors.Add("Runtime apply skipped: AppSettings:HostAccessID is empty.");
                return result;
            }

            var port = GetServerPort(context.Target, context.AppSettingsRoot);
            if (port <= 0)
            {
                result.Errors.Add("Runtime apply skipped: server port is invalid.");
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
                    result.Errors.Add($"Runtime apply failed: HTTP {(int)response.StatusCode}");
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
                logger.LogWarning(exception, "Failed to call ack runtime module apply API. TargetId={TargetId}, ModuleId={ModuleId}", context.Target.Id, moduleId);
                result.Errors.Add("Runtime apply call failed.");
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
                result.Message = "Target process is not running.";
                return result;
            }

            var hostAccessId = GetAppSettingsString(context.AppSettingsRoot, "HostAccessID");
            if (string.IsNullOrWhiteSpace(hostAccessId) == true)
            {
                result.Message = "AppSettings:HostAccessID is empty.";
                return result;
            }

            var port = GetServerPort(context.Target, context.AppSettingsRoot);
            if (port <= 0)
            {
                result.Message = "AppSettings:ServerPort is invalid.";
                return result;
            }

            var client = httpClientFactory.CreateClient(HttpClientName);
            var path = $"/diagnostics?hostAccessID={Uri.EscapeDataString(hostAccessId)}";
            try
            {
                using var response = await client.GetAsync(BuildAckUrl(port, path), cancellationToken);
                if (response.IsSuccessStatusCode == false)
                {
                    result.Message = $"Diagnostics request failed: HTTP {(int)response.StatusCode}";
                    return result;
                }

                var node = TryParseJson(await response.Content.ReadAsStringAsync(cancellationToken));
                if (node?["modules"] is not JsonArray modulesNode)
                {
                    result.Message = "Diagnostics response has no modules field.";
                    return result;
                }

                foreach (var item in modulesNode.OfType<JsonObject>())
                {
                    var loaded = new LoadedModuleItem
                    {
                        ModuleID = item["moduleID"]?.GetValue<string>() ?? "",
                        Name = item["name"]?.GetValue<string>() ?? "",
                        Version = item["version"]?.GetValue<string>() ?? ""
                    };

                    loaded.EventAction = ReadStringArray(item, "eventAction");
                    loaded.SubscribeAction = ReadStringArray(item, "subscribeAction");
                    result.Modules.Add(loaded);
                }

                result.Message = "Runtime diagnostics loaded.";
                return result;
            }
            catch (Exception exception)
            {
                logger.LogDebug(exception, "Diagnostics request failed. TargetId={TargetId}", context.Target.Id);
                result.Message = "Runtime diagnostics request failed.";
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
                message = $"Target '{targetId}' was not found.";
                return false;
            }

            var appSettingsPath = ResolveAppSettingsPath(target);
            if (File.Exists(appSettingsPath) == false)
            {
                errorCode = "appsettings_not_found";
                message = $"appsettings.json not found for target '{targetId}'.";
                return false;
            }

            JsonObject appSettingsRoot;
            try
            {
                appSettingsRoot = ReadJsonObjectFromFile(appSettingsPath);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to parse appsettings file. TargetId={TargetId}, Path={Path}", targetId, appSettingsPath);
                errorCode = "appsettings_parse_failed";
                message = $"Failed to parse appsettings.json for target '{targetId}'.";
                return false;
            }

            context = new TargetContext(target, appSettingsPath, appSettingsRoot);
            return true;
        }

        private bool TryResolveModuleContext(string moduleId, string? targetId, out ModuleContext? moduleContext, out string errorCode, out string message)
        {
            moduleContext = null;
            errorCode = "";
            message = "";

            if (string.IsNullOrWhiteSpace(moduleId) == true)
            {
                errorCode = "invalid_module_id";
                message = "module-id is required.";
                return false;
            }

            TargetContext? targetContext = null;

            if (string.IsNullOrWhiteSpace(targetId) == false)
            {
                if (TryResolveTargetContext(targetId, out targetContext, out errorCode, out message) == false || targetContext is null)
                {
                    return false;
                }
            }
            else
            {
                var candidates = new List<TargetContext>();
                foreach (var targetInfo in targetProcessManager.GetTargets())
                {
                    if (TryResolveTargetContext(targetInfo.Id, out var context, out _, out _) == false || context is null)
                    {
                        continue;
                    }

                    var configuredModules = GetConfiguredModules(context.AppSettingsRoot);
                    if (configuredModules.Contains(moduleId, StringComparer.OrdinalIgnoreCase) == true)
                    {
                        candidates.Add(context);
                    }
                }

                if (candidates.Count == 0)
                {
                    errorCode = "module_target_not_found";
                    message = $"No target includes module '{moduleId}'.";
                    return false;
                }

                if (candidates.Count > 1)
                {
                    errorCode = "module_target_ambiguous";
                    message = $"Multiple targets include module '{moduleId}'. Specify query parameter id.";
                    return false;
                }

                targetContext = candidates[0];
            }

            var modulePath = ResolveModulePath(targetContext, moduleId);
            if (File.Exists(modulePath) == false)
            {
                errorCode = "module_file_not_found";
                message = $"module.json not found for module '{moduleId}'.";
                return false;
            }

            JsonObject moduleRoot;
            try
            {
                moduleRoot = ReadJsonObjectFromFile(modulePath);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to parse module file. TargetId={TargetId}, ModuleId={ModuleId}, Path={Path}", targetContext.Target.Id, moduleId, modulePath);
                errorCode = "module_parse_failed";
                message = $"Failed to parse module.json for module '{moduleId}'.";
                return false;
            }

            moduleContext = new ModuleContext(targetContext, moduleId, modulePath, moduleRoot);
            return true;
        }

        private static List<string> GetConfiguredModules(JsonObject appSettingsRoot)
        {
            var result = new List<string>();
            var loadModulesNode = appSettingsRoot["AppSettings"]?["LoadModules"] as JsonArray;
            if (loadModulesNode is null)
            {
                return result;
            }

            foreach (var item in loadModulesNode)
            {
                var module = item?.GetValue<string>()?.Trim();
                if (string.IsNullOrWhiteSpace(module) == false && result.Contains(module, StringComparer.OrdinalIgnoreCase) == false)
                {
                    result.Add(module);
                }
            }

            return result;
        }

        private static string ResolveAppSettingsPath(TargetProcessOptions target)
        {
            var workingDirectory = ResolveWorkingDirectory(target);
            var appSettingsPath = Path.Combine(workingDirectory, "appsettings.json");
            if (File.Exists(appSettingsPath) == true)
            {
                return appSettingsPath;
            }

            if (string.IsNullOrWhiteSpace(target.ExecutablePath) == false && IsPathLike(target.ExecutablePath) == true)
            {
                var executablePath = ResolvePath(target.ExecutablePath, AppContext.BaseDirectory);
                var executableDirectory = Path.GetDirectoryName(executablePath);
                if (string.IsNullOrWhiteSpace(executableDirectory) == false)
                {
                    var fallback = Path.Combine(executableDirectory, "appsettings.json");
                    if (File.Exists(fallback) == true)
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

            var moduleBasePath = ResolvePath(loadModuleBasePath, appSettingsDirectory);
            return Path.Combine(moduleBasePath, moduleId, "module.json");
        }

        private static string ResolveWorkingDirectory(TargetProcessOptions target)
        {
            var workingDirectory = target.WorkingDirectory?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(workingDirectory) == false)
            {
                return ResolvePath(workingDirectory, AppContext.BaseDirectory);
            }

            if (string.IsNullOrWhiteSpace(target.ExecutablePath) == false && IsPathLike(target.ExecutablePath) == true)
            {
                var executablePath = ResolvePath(target.ExecutablePath, AppContext.BaseDirectory);
                var executableDirectory = Path.GetDirectoryName(executablePath);
                if (string.IsNullOrWhiteSpace(executableDirectory) == false)
                {
                    return executableDirectory;
                }
            }

            return AppContext.BaseDirectory;
        }

        private static string ResolvePath(string path, string basePath)
        {
            var value = Environment.ExpandEnvironmentVariables(path ?? "");
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return basePath;
            }

            if (Path.IsPathRooted(value) == true)
            {
                return Path.GetFullPath(value);
            }

            return Path.GetFullPath(value, basePath);
        }

        private static bool IsPathLike(string path)
        {
            return path.Contains(Path.DirectorySeparatorChar)
                || path.Contains(Path.AltDirectorySeparatorChar)
                || path.Contains(':')
                || path.StartsWith(".", StringComparison.Ordinal);
        }

        private static JsonObject ReadJsonObjectFromFile(string path)
        {
            var text = File.ReadAllText(path);
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

            if (JsonNode.DeepEquals(oldNode, newNode) == false)
            {
                if (string.IsNullOrWhiteSpace(path) == false)
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

        private sealed class DiagnosticsReadResult
        {
            public string RuntimeState { get; set; } = "Unknown";

            public string Message { get; set; } = "";

            public List<LoadedModuleItem> Modules { get; set; } = new List<LoadedModuleItem>();
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
