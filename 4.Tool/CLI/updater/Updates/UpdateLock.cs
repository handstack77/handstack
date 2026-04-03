using System;
using System.IO;
using System.Text;

namespace updater.Updates;

public sealed class UpdateLockHandle : IDisposable
{
    private readonly FileStream stream;

    private UpdateLockHandle(string lockFilePath, FileStream stream)
    {
        LockFilePath = lockFilePath;
        this.stream = stream;
    }

    public string LockFilePath { get; }

    public static UpdateLockHandle Acquire(string installRoot)
    {
        var stagingDirectoryPath = InstallLayout.ResolveStagingDirectory(installRoot);
        Directory.CreateDirectory(stagingDirectoryPath);

        var lockFilePath = Path.Combine(stagingDirectoryPath, "update.lock");
        var stream = new FileStream(lockFilePath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
        stream.SetLength(0);

        var content = Encoding.UTF8.GetBytes($"{Environment.ProcessId}|{DateTimeOffset.UtcNow:O}");
        stream.Write(content, 0, content.Length);
        stream.Flush(true);
        stream.Position = 0;

        return new UpdateLockHandle(lockFilePath, stream);
    }

    public void Dispose()
    {
        stream.Dispose();
    }
}
