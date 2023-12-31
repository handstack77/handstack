﻿using System;
using System.IO;
using System.Linq;
using System.Runtime.Caching;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Serilog;

namespace dbclient.Extensions
{
    public delegate void ChangedFile(WatcherChangeTypes watcherChangeTypes, FileInfo fileInfo);

    public class FileSyncManager : IDisposable
    {
        public event ChangedFile? MonitoringFile;

        private readonly MemoryCache memoryCache;
        private const int expireMilliSeconds = 100;
        private bool isDesposed;
        private readonly FileSystemWatcher fileSystemWatcher;
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
                fileSystemWatcher.NotifyFilter = NotifyFilters.DirectoryName
                                            | NotifyFilters.FileName
                                            | NotifyFilters.LastWrite;

                fileSystemWatcher.Created += HandleCreated;
                fileSystemWatcher.Deleted += HandleDeleted;
                fileSystemWatcher.Renamed += HandleRenamed;
                fileSystemWatcher.Changed += HandleChanged;
                fileSystemWatcher.Error += HandleError;
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

        private async void HandleChanged(object sender, FileSystemEventArgs e)
        {
            var fileData = new CacheItemValue()
            {
                FileCacheType = Enum.GetName(e.ChangeType),
                FilePath = e.FullPath,
                RetryCount = 0
            };

            var value = memoryCache.AddOrGetExisting($"{fileData.FileCacheType}_{fileData.FilePath}", fileData, new CacheItemPolicy
            {
                AbsoluteExpiration = DateTimeOffset.Now.AddMilliseconds(expireMilliSeconds)
            });

            if (value == null)
            {
                Log.Information($"[FileSyncManager/HandleChanged] Change: {Enum.GetName(e.ChangeType)} {e.FullPath}");

                if (File.Exists(e.FullPath) == true)
                {
                    await Task.Delay(1);
                    if (File.Exists(e.FullPath) == true)
                    {
                        MonitoringFile?.Invoke(WatcherChangeTypes.Changed, new FileInfo(e.FullPath));
                    }
                }
            }
        }

        private void HandleError(object sender, ErrorEventArgs e)
        {
            Log.Error(e.GetException(), e.ToStringSafe());
        }

        private async void HandleRenamed(object sender, RenamedEventArgs e)
        {
            var fileData = new CacheItemValue()
            {
                FileCacheType = Enum.GetName(e.ChangeType),
                FilePath = e.FullPath,
                RetryCount = 0
            };

            var value = memoryCache.AddOrGetExisting($"{fileData.FileCacheType}_{fileData.FilePath}", fileData, new CacheItemPolicy
            {
                AbsoluteExpiration = DateTimeOffset.Now.AddMilliseconds(expireMilliSeconds)
            });

            if (value == null)
            {
                Log.Information($"[FileSyncManager/HandleRenamed] Rename: {e.OldFullPath} => {e.FullPath}");

                if (File.Exists(e.OldFullPath) == true)
                {
                    MonitoringFile?.Invoke(WatcherChangeTypes.Deleted, new FileInfo(e.OldFullPath));
                }

                if (File.Exists(e.FullPath) == true)
                {
                    await Task.Delay(1);
                    if (File.Exists(e.FullPath) == true)
                    {
                        MonitoringFile?.Invoke(WatcherChangeTypes.Created, new FileInfo(e.FullPath));
                    }
                }
            }
        }

        private void HandleDeleted(object sender, FileSystemEventArgs e)
        {
            var fileData = new CacheItemValue()
            {
                FileCacheType = Enum.GetName(e.ChangeType),
                FilePath = e.FullPath,
                RetryCount = 0
            };

            var value = memoryCache.AddOrGetExisting($"{fileData.FileCacheType}_{fileData.FilePath}", fileData, new CacheItemPolicy
            {
                AbsoluteExpiration = DateTimeOffset.Now.AddMilliseconds(expireMilliSeconds)
            });

            if (value == null)
            {
                Log.Information($"[FileSyncManager/HandleDeleted] Delete: {e.FullPath}");

                if (Directory.Exists(e.FullPath) == true)
                {
                    // 디렉토리 삭제 이벤트는 무시
                }
                else
                {
                    MonitoringFile?.Invoke(WatcherChangeTypes.Deleted, new FileInfo(e.FullPath));
                }
            }
        }

        private async void HandleCreated(object sender, FileSystemEventArgs e)
        {
            var fileData = new CacheItemValue()
            {
                FileCacheType = Enum.GetName(e.ChangeType),
                FilePath = e.FullPath,
                RetryCount = 0
            };

            var value = memoryCache.AddOrGetExisting($"{fileData.FileCacheType}_{fileData.FilePath}", fileData, new CacheItemPolicy
            {
                AbsoluteExpiration = DateTimeOffset.Now.AddMilliseconds(expireMilliSeconds)
            });

            if (value == null)
            {
                Log.Information($"[FileSyncManager/HandleCreated] Create: {e.FullPath}");
                if (Directory.Exists(e.FullPath) == true)
                {
                    Stop();

                    DirectoryInfo info = new DirectoryInfo(e.FullPath);
                    int checkCount = 0;
                    long firstCheckFileCount = 0;
                    long secondCheckFileCount = info.EnumerateFiles().Sum(file => file.Length);
                    do
                    {
                        if (checkCount == 0)
                        {
                            firstCheckFileCount = info.EnumerateFiles().Sum(file => file.Length);
                        }
                        else
                        {
                            secondCheckFileCount = info.EnumerateFiles().Sum(file => file.Length);
                        }

                        if (firstCheckFileCount == secondCheckFileCount)
                        {
                            checkCount++;
                        }
                        else
                        {
                            checkCount = 0;
                        }

                        await Task.Delay(25);
                    } while (checkCount < 2);

                    var files = Directory.GetFiles(e.FullPath, fileSystemWatcher.Filter, SearchOption.AllDirectories);
                    foreach (var item in files)
                    {
                        MonitoringFile?.Invoke(WatcherChangeTypes.Created, new FileInfo(item));
                    }

                    Start();
                }
                else if (File.Exists(e.FullPath) == true)
                {
                    await Task.Delay(1);
                    if (File.Exists(e.FullPath) == true)
                    {
                        MonitoringFile?.Invoke(WatcherChangeTypes.Created, new FileInfo(e.FullPath));
                    }
                }
            }
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
