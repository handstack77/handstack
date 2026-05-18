using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Modules;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

namespace ack.Services
{
    internal sealed class ModuleSettingsFileWatcherService : IHostedService, IDisposable
    {
        private static readonly TimeSpan debounceDelay = TimeSpan.FromMilliseconds(500);
        private static readonly TimeSpan retryDelay = TimeSpan.FromMilliseconds(200);

        private readonly ILogger logger;
        private readonly IServiceProvider serviceProvider;
        private readonly SemaphoreSlim reloadLock = new SemaphoreSlim(1, 1);
        private readonly object debounceSync = new object();
        private readonly Dictionary<string, WatchedModuleSettings> watchedModules = new Dictionary<string, WatchedModuleSettings>(StringComparer.OrdinalIgnoreCase);
        private readonly HashSet<string> pendingFilePaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        private Timer? debounceTimer;

        public ModuleSettingsFileWatcherService(ILogger logger, IServiceProvider serviceProvider)
        {
            this.logger = logger;
            this.serviceProvider = serviceProvider;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            if (GlobalConfiguration.IsConfigurationWatching == false)
            {
                return;
            }

            foreach (var module in GlobalConfiguration.Modules)
            {
                var moduleSettingFilePath = module.ModuleSettingFilePath;
                if (string.IsNullOrWhiteSpace(moduleSettingFilePath) == true || File.Exists(moduleSettingFilePath) == false)
                {
                    logger.Warning("[{LogCategory}] 모듈 설정 파일을 찾을 수 없습니다. moduleID: {ModuleID}, 경로: {ModuleSettingFilePath}", "ModuleSettingsFileWatcherService/StartAsync", module.ModuleID, moduleSettingFilePath);
                    continue;
                }

                var fullPath = Path.GetFullPath(moduleSettingFilePath);
                var directoryPath = Path.GetDirectoryName(fullPath);
                var fileName = Path.GetFileName(fullPath);
                if (string.IsNullOrWhiteSpace(directoryPath) == true || string.IsNullOrWhiteSpace(fileName) == true)
                {
                    logger.Warning("[{LogCategory}] 모듈 설정 감시 경로가 올바르지 않습니다. moduleID: {ModuleID}, 경로: {ModuleSettingFilePath}", "ModuleSettingsFileWatcherService/StartAsync", module.ModuleID, fullPath);
                    continue;
                }

                var snapshot = await ReadModuleSettingsSnapshotAsync(fullPath, cancellationToken);
                if (snapshot == null)
                {
                    continue;
                }

                var watcher = new FileSystemWatcher(directoryPath, fileName)
                {
                    NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite | NotifyFilters.Size
                };

                var watchedModule = new WatchedModuleSettings(module, fullPath, watcher, snapshot);
                watcher.Changed += OnModuleSettingsChanged;
                watcher.Created += OnModuleSettingsChanged;
                watcher.Renamed += OnModuleSettingsRenamed;
                watcher.EnableRaisingEvents = true;

                watchedModules[fullPath] = watchedModule;
            }

            logger.Information("[{LogCategory}] 모듈 설정 파일 변경 감지 시작. moduleID: {ModuleID}", "ModuleSettingsFileWatcherService/StartAsync", GlobalConfiguration.Modules.Select(x => x.ModuleID).ToJoin(","));
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            foreach (var item in watchedModules.Values)
            {
                item.Watcher.EnableRaisingEvents = false;
            }

            lock (debounceSync)
            {
                debounceTimer?.Change(Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
            }

            return Task.CompletedTask;
        }

        private void OnModuleSettingsChanged(object sender, FileSystemEventArgs args)
        {
            ScheduleReload(args.FullPath);
        }

        private void OnModuleSettingsRenamed(object sender, RenamedEventArgs args)
        {
            ScheduleReload(args.FullPath);
        }

        private void ScheduleReload(string filePath)
        {
            lock (debounceSync)
            {
                pendingFilePaths.Add(Path.GetFullPath(filePath));
                debounceTimer ??= new Timer(_ => _ = ReloadPendingModuleSettingsAsync(), null, Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
                debounceTimer.Change(debounceDelay, Timeout.InfiniteTimeSpan);
            }
        }

        private async Task ReloadPendingModuleSettingsAsync()
        {
            List<string> filePaths;
            lock (debounceSync)
            {
                filePaths = pendingFilePaths.ToList();
                pendingFilePaths.Clear();
            }

            if (filePaths.Count == 0)
            {
                return;
            }

            await reloadLock.WaitAsync();
            try
            {
                foreach (var filePath in filePaths)
                {
                    if (watchedModules.TryGetValue(filePath, out var watchedModule) == true)
                    {
                        await ReloadModuleSettingsAsync(watchedModule);
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 모듈 설정 다시 로드에 실패했습니다.", "ModuleSettingsFileWatcherService/ReloadPendingModuleSettingsAsync");
            }
            finally
            {
                reloadLock.Release();
            }
        }

        private async Task ReloadModuleSettingsAsync(WatchedModuleSettings watchedModule)
        {
            var currentSnapshot = await ReadModuleSettingsSnapshotAsync(watchedModule.FilePath, CancellationToken.None);
            if (currentSnapshot == null)
            {
                return;
            }

            var hasChanges = currentSnapshot.Count != watchedModule.LastSnapshot.Count;
            if (hasChanges == false)
            {
                foreach (var pair in currentSnapshot)
                {
                    if (watchedModule.LastSnapshot.TryGetValue(pair.Key, out var previousValue) == false || JToken.DeepEquals(previousValue, pair.Value) == false)
                    {
                        hasChanges = true;
                        break;
                    }
                }
            }

            if (hasChanges == false)
            {
                return;
            }

            var configurationText = await ReadAllTextWithRetryAsync(watchedModule.FilePath, CancellationToken.None);
            if (configurationText == null)
            {
                return;
            }

            var result = ReloadRuntimeConfiguration(watchedModule.Module, configurationText);
            watchedModule.LastSnapshot = currentSnapshot;

            if (result.AppliedKeys.Count > 0)
            {
                logger.Information("[{LogCategory}] 모듈 설정 변경 사항을 적용했습니다. moduleID: {ModuleID}, 키: {AppliedKeys}", "ModuleSettingsFileWatcherService/ReloadModuleSettingsAsync", result.ModuleID, string.Join(", ", result.AppliedKeys.OrderBy(p => p)));
            }

            if (result.RestartRequiredKeys.Count > 0)
            {
                logger.Warning("[{LogCategory}] 모듈 설정 변경 사항을 완전히 반영하려면 프로세스를 재시작해야 합니다. moduleID: {ModuleID}, 키: {RestartRequiredKeys}", "ModuleSettingsFileWatcherService/ReloadModuleSettingsAsync", result.ModuleID, string.Join(", ", result.RestartRequiredKeys.OrderBy(p => p)));
            }

            if (result.Errors.Count > 0)
            {
                logger.Warning("[{LogCategory}] 모듈 설정 변경 처리 중 오류가 발생했습니다. moduleID: {ModuleID}, 오류: {Errors}", "ModuleSettingsFileWatcherService/ReloadModuleSettingsAsync", result.ModuleID, string.Join(", ", result.Errors));
            }
        }

        private ModuleConfigurationReloadResult ReloadRuntimeConfiguration(ModuleInfo module, string configurationText)
        {
            var runtimeConfiguration = serviceProvider.GetServices<IModuleRuntimeConfiguration>().FirstOrDefault(p => p.GetType().Assembly == module.Assembly);
            if (runtimeConfiguration != null)
            {
                return runtimeConfiguration.ReloadModuleConfiguration(module, configurationText);
            }

            return ReloadRuntimeConfigurationByReflection(module, configurationText);
        }

        private ModuleConfigurationReloadResult ReloadRuntimeConfigurationByReflection(ModuleInfo module, string configurationText)
        {
            var result = new ModuleConfigurationReloadResult()
            {
                ModuleID = module.ModuleID
            };

            if (module.Assembly == null)
            {
                result.Errors.Add("모듈 Assembly가 로드되지 않았습니다.");
                return result;
            }

            var moduleConfigJsonType = module.Assembly.GetTypes().FirstOrDefault(p => p.Name == "ModuleConfigJson");
            var moduleConfigurationType = module.Assembly.GetTypes().FirstOrDefault(p => p.Name == "ModuleConfiguration");
            if (moduleConfigJsonType == null || moduleConfigurationType == null)
            {
                result.Errors.Add("ModuleConfigJson 또는 ModuleConfiguration 타입을 찾을 수 없습니다.");
                return result;
            }

            object? moduleConfigJson;
            try
            {
                moduleConfigJson = JsonConvert.DeserializeObject(configurationText, moduleConfigJsonType);
            }
            catch (Exception exception)
            {
                result.Errors.Add($"module.json 역직렬화 실패: {exception.Message}");
                return result;
            }

            if (moduleConfigJson == null)
            {
                result.Errors.Add("module.json 역직렬화 결과가 비어 있습니다.");
                return result;
            }

            var moduleConfig = moduleConfigJsonType.GetProperty("ModuleConfig")?.GetValue(moduleConfigJson);
            if (moduleConfig == null)
            {
                result.Errors.Add("ModuleConfig 항목을 찾을 수 없습니다.");
                return result;
            }

            ApplyTopLevelModuleInfo(module, moduleConfigJson, moduleConfigJsonType, moduleConfigurationType, result);
            ApplyModuleConfigProperties(module, moduleConfig, moduleConfig.GetType(), moduleConfigurationType, result);

            module.Configuration = null;
            return result;
        }

        private static void ApplyTopLevelModuleInfo(ModuleInfo module, object moduleConfigJson, Type moduleConfigJsonType, Type moduleConfigurationType, ModuleConfigurationReloadResult result)
        {
            ApplyStaticField(moduleConfigurationType, "ModuleID", moduleConfigJsonType.GetProperty("ModuleID")?.GetValue(moduleConfigJson), result);
            ApplyStaticField(moduleConfigurationType, "Version", moduleConfigJsonType.GetProperty("Version")?.GetValue(moduleConfigJson), result);
            ApplyStaticField(moduleConfigurationType, "IsBundledWithHost", moduleConfigJsonType.GetProperty("IsBundledWithHost")?.GetValue(moduleConfigJson), result);

            var eventAction = GetModuleConfigPropertyValue(moduleConfigJsonType, moduleConfigJson, "EventAction");
            if (eventAction is IEnumerable<string> eventActions)
            {
                module.EventAction = NormalizeActions(eventActions);
                result.AppliedKeys.Add("ModuleConfig:EventAction");
            }

            var subscribeAction = GetModuleConfigPropertyValue(moduleConfigJsonType, moduleConfigJson, "SubscribeAction");
            if (subscribeAction is IEnumerable<string> subscribeActions)
            {
                module.SubscribeAction = NormalizeActions(subscribeActions);
                result.AppliedKeys.Add("ModuleConfig:SubscribeAction");
            }
        }

        private static object? GetModuleConfigPropertyValue(Type moduleConfigJsonType, object moduleConfigJson, string propertyName)
        {
            var moduleConfig = moduleConfigJsonType.GetProperty("ModuleConfig")?.GetValue(moduleConfigJson);
            return moduleConfig?.GetType().GetProperty(propertyName)?.GetValue(moduleConfig);
        }

        private static void ApplyModuleConfigProperties(ModuleInfo module, object moduleConfig, Type moduleConfigType, Type moduleConfigurationType, ModuleConfigurationReloadResult result)
        {
            foreach (var property in moduleConfigType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                var value = property.GetValue(moduleConfig);
                var field = moduleConfigurationType.GetField(property.Name, BindingFlags.Public | BindingFlags.Static);
                if (field == null)
                {
                    result.RestartRequiredKeys.Add($"ModuleConfig:{property.Name}");
                    continue;
                }

                if (property.Name.Equals("EventAction", StringComparison.OrdinalIgnoreCase) == true && value is IEnumerable<string> eventActions)
                {
                    module.EventAction = NormalizeActions(eventActions);
                }
                else if (property.Name.Equals("SubscribeAction", StringComparison.OrdinalIgnoreCase) == true && value is IEnumerable<string> subscribeActions)
                {
                    module.SubscribeAction = NormalizeActions(subscribeActions);
                }

                ApplyStaticField(moduleConfigurationType, field, $"ModuleConfig:{property.Name}", value, result);
            }
        }

        private static void ApplyStaticField(Type moduleConfigurationType, string fieldName, object? value, ModuleConfigurationReloadResult result)
        {
            var field = moduleConfigurationType.GetField(fieldName, BindingFlags.Public | BindingFlags.Static);
            if (field == null)
            {
                return;
            }

            ApplyStaticField(moduleConfigurationType, field, fieldName, value, result);
        }

        private static void ApplyStaticField(Type moduleConfigurationType, FieldInfo field, string key, object? value, ModuleConfigurationReloadResult result)
        {
            try
            {
                if (value == null)
                {
                    if (field.FieldType.IsValueType == false)
                    {
                        field.SetValue(null, null);
                        result.AppliedKeys.Add(key);
                    }
                    return;
                }

                var valueType = value.GetType();
                if (field.FieldType.IsAssignableFrom(valueType) == true)
                {
                    field.SetValue(null, value);
                    result.AppliedKeys.Add(key);
                    return;
                }

                if (field.FieldType == typeof(string))
                {
                    field.SetValue(null, value.ToString());
                    result.AppliedKeys.Add(key);
                    return;
                }

                if (field.FieldType.IsEnum == true)
                {
                    field.SetValue(null, Enum.Parse(field.FieldType, value.ToString() ?? "", true));
                    result.AppliedKeys.Add(key);
                    return;
                }

                var converted = Convert.ChangeType(value, field.FieldType);
                field.SetValue(null, converted);
                result.AppliedKeys.Add(key);
            }
            catch
            {
                result.RestartRequiredKeys.Add(key);
            }
        }

        private async Task<Dictionary<string, JToken>?> ReadModuleSettingsSnapshotAsync(string filePath, CancellationToken cancellationToken)
        {
            var json = await ReadAllTextWithRetryAsync(filePath, cancellationToken);
            if (json == null)
            {
                return null;
            }

            try
            {
                var root = JObject.Parse(json);
                var snapshot = new Dictionary<string, JToken>(StringComparer.OrdinalIgnoreCase);
                FlattenModuleSettings(root, "", snapshot);
                return snapshot;
            }
            catch (JsonException exception)
            {
                logger.Warning(exception, "[{LogCategory}] 모듈 설정 JSON을 해석하지 못했습니다. 경로: {ModuleSettingFilePath}", "ModuleSettingsFileWatcherService/ReadModuleSettingsSnapshotAsync", filePath);
                return null;
            }
        }

        private async Task<string?> ReadAllTextWithRetryAsync(string filePath, CancellationToken cancellationToken)
        {
            for (var retry = 1; retry <= 5; retry++)
            {
                try
                {
                    using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
                    using var reader = new StreamReader(stream);
                    return await reader.ReadToEndAsync(cancellationToken);
                }
                catch (IOException exception)
                {
                    if (retry == 5)
                    {
                        logger.Warning(exception, "[{LogCategory}] 모듈 설정 파일을 읽지 못했습니다. 경로: {ModuleSettingFilePath}", "ModuleSettingsFileWatcherService/ReadAllTextWithRetryAsync", filePath);
                        return null;
                    }

                    await Task.Delay(retryDelay, cancellationToken);
                }
            }

            return null;
        }

        private static void FlattenModuleSettings(JObject source, string prefix, Dictionary<string, JToken> destination)
        {
            foreach (var property in source.Properties())
            {
                var key = string.IsNullOrWhiteSpace(prefix) == true ? property.Name : $"{prefix}:{property.Name}";
                if (property.Value is JObject child)
                {
                    FlattenModuleSettings(child, key, destination);
                }
                else
                {
                    destination[key] = property.Value.DeepClone();
                }
            }
        }

        private static List<string> NormalizeActions(IEnumerable<string> actions)
        {
            return actions
                .Where(p => string.IsNullOrWhiteSpace(p) == false)
                .Select(p => p.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToList();
        }

        public void Dispose()
        {
            foreach (var item in watchedModules.Values)
            {
                item.Watcher.Changed -= OnModuleSettingsChanged;
                item.Watcher.Created -= OnModuleSettingsChanged;
                item.Watcher.Renamed -= OnModuleSettingsRenamed;
                item.Watcher.Dispose();
            }

            debounceTimer?.Dispose();
            reloadLock.Dispose();
        }

        private sealed class WatchedModuleSettings
        {
            public WatchedModuleSettings(ModuleInfo module, string filePath, FileSystemWatcher watcher, Dictionary<string, JToken> lastSnapshot)
            {
                Module = module;
                FilePath = filePath;
                Watcher = watcher;
                LastSnapshot = lastSnapshot;
            }

            public ModuleInfo Module { get; }

            public string FilePath { get; }

            public FileSystemWatcher Watcher { get; }

            public Dictionary<string, JToken> LastSnapshot { get; set; }
        }
    }
}
