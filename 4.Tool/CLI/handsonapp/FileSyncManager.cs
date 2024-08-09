using System;
using System.Collections.Concurrent;
using System.IO;
using System.Threading.Tasks;

namespace handsonapp
{
    public delegate void ChangedFile(WatcherChangeTypes watcherChangeTypes, FileInfo fileInfo);

    public class FileSyncManager : IDisposable
    {
        public event ChangedFile? MonitoringFile;

        private bool isDesposed;
        private readonly FileSystemWatcher fileSystemWatcher;
        private readonly ConcurrentQueue<string> queue = new ConcurrentQueue<string>();

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
                fileSystemWatcher.Error += HandleError;

                Task.Run(ProcessQueue);
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
                    }
                }
                else
                {
                    await Task.Delay(1000);
                }
            }
        }

        private void HandleError(object sender, ErrorEventArgs e)
        {
            Console.WriteLine($"{e.GetException()}, {e.ToString()}");
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
