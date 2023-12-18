using System;
using System.IO;
using System.Reactive.Linq;

namespace HandStack.Core.Helpers
{
    // using (var watcher = new FileSystemWatcherHelper(c => { c.Path = @".\Sources"; }))
    // {
    //     var changes = watcher.Changed.Throttle(TimeSpan.FromSeconds(.5)).Where(c => c.FullPath.EndsWith(@"DynamicProgram.cs")).Select(c => c.FullPath);
    //     changes.Subscribe(filepath => runner.Execute(compiler.Compile(filepath), new[] { "France" }));
    //     watcher.Start();
    // }
    public class FileSystemWatcherHelper : IDisposable
    {
        public readonly FileSystemWatcher Watcher;

        public IObservable<FileSystemEventArgs> Changed { get; private set; }
        public IObservable<RenamedEventArgs> Renamed { get; private set; }
        public IObservable<FileSystemEventArgs> Deleted { get; private set; }
        public IObservable<ErrorEventArgs> Errors { get; private set; }
        public IObservable<FileSystemEventArgs> Created { get; private set; }

        public FileSystemWatcherHelper(FileSystemWatcher watcher)
        {
            Watcher = watcher;

            Changed = Observable
                .FromEventPattern<FileSystemEventHandler, FileSystemEventArgs>(h => Watcher.Changed += h, h => Watcher.Changed -= h)
                .Select(x => x.EventArgs);

            Renamed = Observable
                .FromEventPattern<RenamedEventHandler, RenamedEventArgs>(h => Watcher.Renamed += h, h => Watcher.Renamed -= h)
                .Select(x => x.EventArgs);

            Deleted = Observable
                .FromEventPattern<FileSystemEventHandler, FileSystemEventArgs>(h => Watcher.Deleted += h, h => Watcher.Deleted -= h)
                .Select(x => x.EventArgs);

            Errors = Observable
                .FromEventPattern<ErrorEventHandler, ErrorEventArgs>(h => Watcher.Error += h, h => Watcher.Error -= h)
                .Select(x => x.EventArgs);

            Created = Observable
                .FromEventPattern<FileSystemEventHandler, FileSystemEventArgs>(h => Watcher.Created += h, h => Watcher.Created -= h)
                .Select(x => x.EventArgs);
        }

        public FileSystemWatcherHelper(Action<FileSystemWatcher> configure) : this(new FileSystemWatcher())
        {
            configure(Watcher);
        }

        public void Start()
        {
            Watcher.EnableRaisingEvents = true;
        }

        public void Stop()
        {
            Watcher.EnableRaisingEvents = false;
        }

        public void Dispose()
        {
            Watcher.Dispose();
        }
    }
}
