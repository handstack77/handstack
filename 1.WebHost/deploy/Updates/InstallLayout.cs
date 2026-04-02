using System;
using System.IO;

namespace deploy.Updates;

public static class InstallLayout
{
    public static string ResolveInstallRootFromToolDirectory(string toolBaseDirectory)
    {
        return Path.GetFullPath(Path.Combine(toolBaseDirectory, "..", ".."));
    }

    public static string ResolveDefaultAckExecutablePath(string installRoot)
    {
        return Path.Combine(installRoot, "app", OperatingSystem.IsWindows() == true ? "ack.exe" : "ack");
    }

    public static string ResolveDefaultLauncherExecutablePath(string installRoot)
    {
        return Path.Combine(installRoot, "tools", "launcher", OperatingSystem.IsWindows() == true ? "launcher.exe" : "launcher");
    }

    public static string ResolveVersionFilePath(string ackExecutablePath)
    {
        var executableDirectoryPath = Path.GetDirectoryName(ackExecutablePath)
            ?? throw new InvalidOperationException("ack 실행 파일 경로를 확인할 수 없습니다.");
        return Path.Combine(executableDirectoryPath, "version.json");
    }

    public static string ResolveStagingDirectory(string installRoot)
    {
        return Path.Combine(installRoot, "staging");
    }

    public static string ResolveBackupDirectory(string installRoot)
    {
        return Path.Combine(installRoot, "backup");
    }

    public static string ResolveUpdateLogDirectory(string installRoot)
    {
        return Path.Combine(installRoot, "log", "update");
    }
}
