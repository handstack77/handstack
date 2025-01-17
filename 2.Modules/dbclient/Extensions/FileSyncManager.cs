using System;
using System.Collections.Concurrent;
using System.IO;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Serilog;

namespace dbclient.Extensions
{
    public delegate void ChangedFile(WatcherChangeTypes watcherChangeTypes, FileInfo fileInfo);

    public class FileSyncManager : IDisposable
    {
        public event ChangedFile? MonitoringFile;

        private bool isDesposed;
        private readonly FileSystemWatcher fileSystemWatcher;
        private readonly ConcurrentQueue<string> queue = new ConcurrentQueue<string>();
        private ConcurrentDictionary<string, DateTime> lastEventTimes = new ConcurrentDictionary<string, DateTime>();

        public FileSyncManager(string sourceRootDirectory, string filter)
        {
            fileSystemWatcher = new FileSystemWatcher(sourceRootDirectory);

            if (string.IsNullOrEmpty(filter) == false)
            {
                fileSystemWatcher.InternalBufferSize = 65536;
                if (filter.IndexOf("|") > -1)
                {
                    foreach (var item in filter.Split("|"))
                    {
                        if (string.IsNullOrEmpty(item.Trim()) == false)
                        {
                            fileSystemWatcher.Filters.Add(item.Trim());
                        }
                    }
                }
                else
                {
                    fileSystemWatcher.Filter = filter;
                }
                fileSystemWatcher.IncludeSubdirectories = true;
                fileSystemWatcher.NotifyFilter = NotifyFilters.FileName | NotifyFilters.Size;

                fileSystemWatcher.Created += (s, e) => queue.Enqueue("Created|" + e.FullPath);
                fileSystemWatcher.Deleted += (s, e) => queue.Enqueue("Deleted|" + e.FullPath);
                fileSystemWatcher.Changed += (s, e) =>
                {
                    string key = "Changed|" + e.FullPath;
                    DateTime now = DateTime.Now;

                    if (lastEventTimes.TryGetValue(key, out DateTime lastEventTime) && (now - lastEventTime).TotalMilliseconds < 100)
                    {
                        return;
                    }

                    lastEventTimes[key] = now;
                    queue.Enqueue(key);
                };

                fileSystemWatcher.Renamed += (s, e) =>
                {
                    queue.Enqueue("Deleted|" + e.OldFullPath);
                    if (File.Exists(e.FullPath) == true)
                    {
                        queue.Enqueue("Created|" + e.FullPath);
                    }
                };
                fileSystemWatcher.Error += HandleError;

                Task.Run(ProcessQueue);
            }
        }

        private async Task ProcessQueue()
        {
            while (true)
            {
                if (queue.TryDequeue(out string? watchFilePath) == true)
                {
                    if (string.IsNullOrEmpty(watchFilePath) == false)
                    {
                        WatcherChangeTypes watcherChangeTypes = Enum.Parse<WatcherChangeTypes>(watchFilePath.Split("|")[0]);
                        string filePath = watchFilePath.Split("|")[1];

                        if (watcherChangeTypes == WatcherChangeTypes.Deleted)
                        {
                            MonitoringFile?.Invoke(watcherChangeTypes, new FileInfo(filePath));
                        }
                        else if ((watcherChangeTypes == WatcherChangeTypes.Created || watcherChangeTypes == WatcherChangeTypes.Changed) && File.Exists(filePath) == true)
                        {
                            MonitoringFile?.Invoke(watcherChangeTypes, new FileInfo(filePath));
                        }

                        await Task.Delay(200);

                        lastEventTimes.TryRemove(watchFilePath, out DateTime lastEventTime);
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

        private void HandleError(object sender, ErrorEventArgs e)
        {
            Log.Error(e.GetException(), e.ToStringSafe());
        }

        ~FileSyncManager()
        {
            Dispose(false);
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(true);
        }

        public virtual void Dispose(bool disposing)
        {
            if (isDesposed == true)
            {
                return;
            }

            if (disposing)
            {
                fileSystemWatcher.Dispose();
            }

            isDesposed = true;
        }
    }
}
