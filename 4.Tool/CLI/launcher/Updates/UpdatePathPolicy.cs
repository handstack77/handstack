using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace launcher.Updates;

public static class UpdatePathPolicy
{
    public static readonly IReadOnlyList<string> AllowedTopLevelDirectories =
    [
        "app",
        "assemblies",
        "hosts",
        "tools",
        "modules",
        "data"
    ];

    public static bool IsAllowedRelativePath(string relativePath)
    {
        var normalizedPath = PackageManifestParser.NormalizeRelativePath(relativePath);
        var topLevelDirectory = normalizedPath.Split('/', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return string.IsNullOrWhiteSpace(topLevelDirectory) == false
            && AllowedTopLevelDirectories.Any(item => string.Equals(item, topLevelDirectory, StringComparison.OrdinalIgnoreCase) == true);
    }

    public static bool TryResolveInstallPath(string installRoot, string relativePath, out string resolvedPath)
    {
        resolvedPath = string.Empty;
        if (IsAllowedRelativePath(relativePath) == false)
        {
            return false;
        }

        var normalizedPath = PackageManifestParser.NormalizeRelativePath(relativePath);
        var installRootPath = Path.GetFullPath(installRoot);
        var targetPath = Path.GetFullPath(Path.Combine(installRootPath, normalizedPath.Replace('/', Path.DirectorySeparatorChar)));
        var rootWithSeparator = installRootPath.EndsWith(Path.DirectorySeparatorChar) == true
            ? installRootPath
            : installRootPath + Path.DirectorySeparatorChar;
        if (targetPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase) == false)
        {
            return false;
        }

        resolvedPath = targetPath;
        return true;
    }

    public static long MeasureInstallFootprint(string installRoot)
    {
        long totalSize = 0;
        foreach (var directoryName in AllowedTopLevelDirectories)
        {
            var directoryPath = Path.Combine(installRoot, directoryName);
            if (Directory.Exists(directoryPath) == false)
            {
                continue;
            }

            totalSize += Directory.EnumerateFiles(directoryPath, "*", SearchOption.AllDirectories)
                .Select(filePath => new FileInfo(filePath).Length)
                .Sum();
        }

        return totalSize;
    }
}
