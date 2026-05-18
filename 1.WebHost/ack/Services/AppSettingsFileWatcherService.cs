using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Web;

using Microsoft.Extensions.Hosting;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

namespace ack.Services
{
    internal sealed class AppSettingsFileWatcherService : IHostedService, IDisposable
    {
        private static readonly TimeSpan debounceDelay = TimeSpan.FromMilliseconds(500);
        private static readonly TimeSpan retryDelay = TimeSpan.FromMilliseconds(200);

        private readonly ILogger logger;
        private readonly RuntimeConfigurationService runtimeConfigurationService;
        private readonly SemaphoreSlim reloadLock = new SemaphoreSlim(1, 1);
        private readonly object debounceSync = new object();

        private FileSystemWatcher? watcher;
        private Timer? debounceTimer;
        private string appSettingsFilePath = "";
        private Dictionary<string, JToken> lastSnapshot = new Dictionary<string, JToken>(StringComparer.OrdinalIgnoreCase);

        public AppSettingsFileWatcherService(ILogger logger, RuntimeConfigurationService runtimeConfigurationService)
        {
            this.logger = logger;
            this.runtimeConfigurationService = runtimeConfigurationService;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            if (GlobalConfiguration.IsConfigurationWatching == false)
            {
                return;
            }

            appSettingsFilePath = RuntimeConfigurationService.GetAppSettingsFilePath();
            if (File.Exists(appSettingsFilePath) == false)
            {
                logger.Warning("[{LogCategory}] appsettings 파일을 찾을 수 없습니다. 경로: {AppSettingsFilePath}", "AppSettingsFileWatcherService/StartAsync", appSettingsFilePath);
                return;
            }

            var directoryPath = Path.GetDirectoryName(appSettingsFilePath);
            var fileName = Path.GetFileName(appSettingsFilePath);
            if (string.IsNullOrWhiteSpace(directoryPath) == true || string.IsNullOrWhiteSpace(fileName) == true)
            {
                logger.Warning("[{LogCategory}] appsettings 감시 경로가 올바르지 않습니다. 경로: {AppSettingsFilePath}", "AppSettingsFileWatcherService/StartAsync", appSettingsFilePath);
                return;
            }

            var snapshot = await ReadAppSettingsSnapshotAsync(appSettingsFilePath, cancellationToken);
            if (snapshot == null)
            {
                return;
            }

            lastSnapshot = snapshot;
            watcher = new FileSystemWatcher(directoryPath, fileName)
            {
                NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite | NotifyFilters.Size
            };

            watcher.Changed += OnAppSettingsChanged;
            watcher.Created += OnAppSettingsChanged;
            watcher.Renamed += OnAppSettingsRenamed;
            watcher.EnableRaisingEvents = true;

            logger.Information("[{LogCategory}] appsettings 파일 변경 감지 시작. {AppSettingsFilePath}", "AppSettingsFileWatcherService/StartAsync", appSettingsFilePath);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            if (watcher != null)
            {
                watcher.EnableRaisingEvents = false;
            }

            lock (debounceSync)
            {
                debounceTimer?.Change(Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
            }

            return Task.CompletedTask;
        }

        private void OnAppSettingsChanged(object sender, FileSystemEventArgs args)
        {
            ScheduleReload();
        }

        private void OnAppSettingsRenamed(object sender, RenamedEventArgs args)
        {
            ScheduleReload();
        }

        private void ScheduleReload()
        {
            lock (debounceSync)
            {
                debounceTimer ??= new Timer(_ => _ = ReloadAppSettingsAsync(), null, Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
                debounceTimer.Change(debounceDelay, Timeout.InfiniteTimeSpan);
            }
        }

        private async Task ReloadAppSettingsAsync()
        {
            await reloadLock.WaitAsync();
            try
            {
                var currentSnapshot = await ReadAppSettingsSnapshotAsync(appSettingsFilePath, CancellationToken.None);
                if (currentSnapshot == null)
                {
                    return;
                }

                var changedValues = new Dictionary<string, JToken>(StringComparer.OrdinalIgnoreCase);
                foreach (var pair in currentSnapshot)
                {
                    if (lastSnapshot.TryGetValue(pair.Key, out var previousValue) == false || JToken.DeepEquals(previousValue, pair.Value) == false)
                    {
                        changedValues[pair.Key] = pair.Value.DeepClone();
                    }
                }

                var removedKeys = lastSnapshot.Keys
                    .Where(p => currentSnapshot.ContainsKey(p) == false)
                    .OrderBy(p => p)
                    .ToList();

                lastSnapshot = currentSnapshot;

                if (removedKeys.Count > 0)
                {
                    logger.Warning("[{LogCategory}] appsettings 키가 삭제되었습니다. 삭제된 키를 반영하려면 프로세스를 재시작해야 합니다. 키: {RemovedKeys}", "AppSettingsFileWatcherService/ReloadAppSettingsAsync", string.Join(", ", removedKeys));
                }

                if (changedValues.Count == 0)
                {
                    return;
                }

                var result = runtimeConfigurationService.ApplyGlobalConfiguration(new GlobalConfigurationApplyRequest()
                {
                    Values = changedValues,
                    PersistToFile = false
                });

                if (result.AppliedKeys.Count > 0)
                {
                    logger.Information("[{LogCategory}] appsettings 변경 사항을 적용했습니다. 키: {AppliedKeys}", "AppSettingsFileWatcherService/ReloadAppSettingsAsync", string.Join(", ", result.AppliedKeys.OrderBy(p => p)));
                }

                if (result.RestartRequiredKeys.Count > 0)
                {
                    logger.Warning("[{LogCategory}] appsettings 변경 사항을 반영하려면 프로세스를 재시작해야 합니다. 키: {RestartRequiredKeys}", "AppSettingsFileWatcherService/ReloadAppSettingsAsync", string.Join(", ", result.RestartRequiredKeys.OrderBy(p => p)));
                }

                if (result.IgnoredKeys.Count > 0)
                {
                    logger.Information("[{LogCategory}] appsettings 변경 사항을 무시했습니다. 키: {IgnoredKeys}", "AppSettingsFileWatcherService/ReloadAppSettingsAsync", string.Join(", ", result.IgnoredKeys.OrderBy(p => p)));
                }

                if (result.Errors.Count > 0)
                {
                    logger.Warning("[{LogCategory}] appsettings 변경 처리 중 오류가 발생했습니다. 오류: {Errors}", "AppSettingsFileWatcherService/ReloadAppSettingsAsync", string.Join(", ", result.Errors));
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] appsettings 다시 로드에 실패했습니다.", "AppSettingsFileWatcherService/ReloadAppSettingsAsync");
            }
            finally
            {
                reloadLock.Release();
            }
        }

        private async Task<Dictionary<string, JToken>?> ReadAppSettingsSnapshotAsync(string filePath, CancellationToken cancellationToken)
        {
            for (var retry = 1; retry <= 5; retry++)
            {
                try
                {
                    using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
                    using var reader = new StreamReader(stream);
                    var json = await reader.ReadToEndAsync(cancellationToken);
                    var root = JObject.Parse(json);
                    var appSettings = root["AppSettings"] as JObject;

                    var snapshot = new Dictionary<string, JToken>(StringComparer.OrdinalIgnoreCase);
                    if (appSettings != null)
                    {
                        FlattenAppSettings(appSettings, "AppSettings", snapshot);
                    }

                    return snapshot;
                }
                catch (Exception exception) when (exception is IOException || exception is JsonException)
                {
                    if (retry == 5)
                    {
                        logger.Warning(exception, "[{LogCategory}] appsettings 파일을 읽지 못했습니다. 경로: {AppSettingsFilePath}", "AppSettingsFileWatcherService/ReadAppSettingsSnapshotAsync", filePath);
                        return null;
                    }

                    await Task.Delay(retryDelay, cancellationToken);
                }
            }

            return null;
        }

        private static void FlattenAppSettings(JObject source, string prefix, Dictionary<string, JToken> destination)
        {
            foreach (var property in source.Properties())
            {
                var key = $"{prefix}:{property.Name}";
                if (property.Value is JObject child)
                {
                    FlattenAppSettings(child, key, destination);
                }
                else
                {
                    destination[key] = property.Value.DeepClone();
                }
            }
        }

        public void Dispose()
        {
            if (watcher != null)
            {
                watcher.Changed -= OnAppSettingsChanged;
                watcher.Created -= OnAppSettingsChanged;
                watcher.Renamed -= OnAppSettingsRenamed;
                watcher.Dispose();
            }

            debounceTimer?.Dispose();
            reloadLock.Dispose();
        }
    }
}
