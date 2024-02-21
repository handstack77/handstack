using System;
using System.Collections.Concurrent;
using System.IO;
using System.Linq;
using System.Runtime.Caching;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Serilog;

namespace function.Extensions
{
    public delegate void ChangedFile(WatcherChangeTypes watcherChangeTypes, FileInfo fileInfo);

    public class FileSyncManager : IDisposable
    {
        public event ChangedFile? MonitoringFile;

        private readonly MemoryCache memoryCache;
        private const int expireMilliSeconds = 100;
        private bool isDesposed;
        private readonly FileSystemWatcher fileSystemWatcher;
        private readonly ConcurrentQueue<string> queue = new ConcurrentQueue<string>();
        private readonly Thread? workerThread;
        private string sourceRootDirectory;

        internal class CacheItemValue
        {
            public string? FileCacheType { get; set; }

            public string? FilePath { get; set; }

            public int RetryCount { get; set; }
        }

        public FileSyncManager(string sourceRootDirectory, string filter)
        {
            this.sourceRootDirectory = sourceRootDirectory;

            memoryCache = MemoryCache.Default;

            fileSystemWatcher = new FileSystemWatcher(sourceRootDirectory);

            if (string.IsNullOrEmpty(filter) == false)
            {
                fileSystemWatcher.InternalBufferSize = 65536;
                if (filter.IndexOf("|") > -1)
                {
                    foreach (var item in filter.Split("|"))
                    {
                        fileSystemWatcher.Filters.Add(item.Trim());
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
                fileSystemWatcher.Changed += (s, e) => queue.Enqueue("Changed|" + e.FullPath);
                fileSystemWatcher.Renamed += (s, e) =>
                {
                    if (File.Exists(e.FullPath) == true)
                    {
                        queue.Enqueue("Changed|" + e.FullPath);
                    }
                    else
                    {
                        queue.Enqueue("Created|" + e.FullPath);
                    }
                };
                // fileSystemWatcher.Created += HandleCreated;
                // fileSystemWatcher.Deleted += HandleDeleted;
                // fileSystemWatcher.Changed += HandleChanged;
                fileSystemWatcher.Error += HandleError;

                workerThread = new Thread(ProcessQueue) { IsBackground = true };
                workerThread.Start();
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

        private void ProcessQueue()
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
                    }
                }
                else
                {
                    Thread.Sleep(1000);
                }
            }
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
