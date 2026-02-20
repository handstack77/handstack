using System;
using System.Collections.Concurrent;
using System.IO;
using System.Threading.Tasks;

namespace forbes.Extensions
{
    public delegate void ChangedFile(WatcherChangeTypes watcherChangeTypes, FileInfo fileInfo);

    public class FileSyncManager : IDisposable
    {
        public event ChangedFile? MonitoringFile;

        private const char QueueDelimiter = '|';

        private bool isDisposed;
        private readonly FileSystemWatcher fileSystemWatcher;
        private readonly ConcurrentQueue<string> queue = new ConcurrentQueue<string>();
        private readonly ConcurrentDictionary<string, DateTime> lastEventTimes = new ConcurrentDictionary<string, DateTime>();

        public FileSyncManager(string sourceRootDirectory, string filter)
        {
            fileSystemWatcher = new FileSystemWatcher(sourceRootDirectory);

            if (!string.IsNullOrEmpty(filter))
            {
                fileSystemWatcher.InternalBufferSize = 65536;
                ConfigureFilters(filter);

                fileSystemWatcher.IncludeSubdirectories = true;
                fileSystemWatcher.NotifyFilter = NotifyFilters.FileName | NotifyFilters.Size;

                fileSystemWatcher.Created += (s, e) => EnqueueChange(WatcherChangeTypes.Created, e.FullPath);
                fileSystemWatcher.Deleted += (s, e) => EnqueueChange(WatcherChangeTypes.Deleted, e.FullPath);
                fileSystemWatcher.Changed += (s, e) =>
                {
                    var key = $"{WatcherChangeTypes.Changed}{QueueDelimiter}{e.FullPath}";
                    var now = DateTime.Now;

                    if (lastEventTimes.TryGetValue(key, out var lastEventTime) && (now - lastEventTime).TotalMilliseconds < 100)
                    {
                        return;
                    }

                    lastEventTimes[key] = now;
                    queue.Enqueue(key);
                };

                fileSystemWatcher.Renamed += (s, e) =>
                {
                    EnqueueChange(WatcherChangeTypes.Deleted, e.OldFullPath);
                    if (File.Exists(e.FullPath))
                    {
                        EnqueueChange(WatcherChangeTypes.Created, e.FullPath);
                    }
                };
                fileSystemWatcher.Error += (s, e) => Console.Error.WriteLine(e.GetException().ToString());

                Task.Run(ProcessQueue);
            }
        }

        private void ConfigureFilters(string filter)
        {
            if (filter.IndexOf(QueueDelimiter) > -1)
            {
                var filters = filter.Split(QueueDelimiter);
                foreach (var item in filters)
                {
                    var trimItem = item.Trim();
                    if (!string.IsNullOrEmpty(trimItem))
                    {
                        fileSystemWatcher.Filters.Add(trimItem);
                    }
                }

                return;
            }

            fileSystemWatcher.Filter = filter;
        }

        private void EnqueueChange(WatcherChangeTypes watcherChangeTypes, string fullPath)
        {
            queue.Enqueue($"{watcherChangeTypes}{QueueDelimiter}{fullPath}");
        }

        private static bool TryParseQueueItem(string watchFilePath, out WatcherChangeTypes watcherChangeTypes, out string filePath)
        {
            watcherChangeTypes = default;
            filePath = string.Empty;

            var delimiterIndex = watchFilePath.IndexOf(QueueDelimiter);
            if (delimiterIndex <= 0 || delimiterIndex >= watchFilePath.Length - 1)
            {
                return false;
            }

            var watcherText = watchFilePath.Substring(0, delimiterIndex);
            if (!Enum.TryParse(watcherText, out watcherChangeTypes))
            {
                return false;
            }

            filePath = watchFilePath.Substring(delimiterIndex + 1);
            return !string.IsNullOrEmpty(filePath);
        }

        private async Task ProcessQueue()
        {
            while (true)
            {
                if (queue.TryDequeue(out var watchFilePath))
                {
                    if (!string.IsNullOrEmpty(watchFilePath) && TryParseQueueItem(watchFilePath, out var watcherChangeTypes, out var filePath))
                    {
                        if (watcherChangeTypes == WatcherChangeTypes.Deleted)
                        {
                            MonitoringFile?.Invoke(watcherChangeTypes, new FileInfo(filePath));
                        }
                        else if ((watcherChangeTypes == WatcherChangeTypes.Created || watcherChangeTypes == WatcherChangeTypes.Changed) && File.Exists(filePath))
                        {
                            MonitoringFile?.Invoke(watcherChangeTypes, new FileInfo(filePath));
                        }

                        await Task.Delay(200);
                        lastEventTimes.TryRemove(watchFilePath, out _);
                    }
                }
                else
                {
                    await Task.Delay(1000);
                }
            }
        }

        public void Start()
        {
            fileSystemWatcher.EnableRaisingEvents = true;
        }

        public void Stop()
        {
            fileSystemWatcher.EnableRaisingEvents = false;
        }

        ~FileSyncManager()
        {
            Dispose(false);
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        public virtual void Dispose(bool disposing)
        {
            if (isDisposed)
            {
                return;
            }

            if (disposing)
            {
                fileSystemWatcher.Dispose();
            }

            isDisposed = true;
        }
    }
}
