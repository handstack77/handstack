using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

namespace launcher.Updates;

public readonly record struct PackageManifestEntry(char Operation, string RelativePath, long FileSize, string Md5, DateTimeOffset ModifiedAt)
{
    public bool ShouldCopy => char.ToUpperInvariant(Operation) != 'D';
}

public static class PackageManifestParser
{
    public static IReadOnlyList<PackageManifestEntry> Load(string filePath)
    {
        var entries = new Dictionary<string, PackageManifestEntry>(StringComparer.OrdinalIgnoreCase);
        foreach (var rawLine in File.ReadAllLines(filePath))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) == true || line.StartsWith("#", StringComparison.Ordinal) == true)
            {
                continue;
            }

            var entry = Parse(line);
            entries[entry.RelativePath] = entry;
        }

        return entries.Values
            .OrderBy(item => item.RelativePath, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static PackageManifestEntry Parse(string rawValue)
    {
        var columns = rawValue.Split('|');
        if (columns.Length == 1)
        {
            return new PackageManifestEntry(
                'C',
                NormalizeRelativePath(columns[0]),
                0,
                string.Empty,
                default);
        }

        if (columns.Length != 5)
        {
            throw new FormatException($"패키지 manifest 형식이 올바르지 않습니다. Entry={rawValue}");
        }

        return new PackageManifestEntry(
            NormalizeOperation(columns[0]),
            NormalizeRelativePath(columns[1]),
            ParseFileSize(columns[2]),
            NormalizeHash(columns[3]),
            ParseModifiedAt(columns[4]));
    }

    public static string NormalizeRelativePath(string value)
    {
        var normalized = value.Trim().Trim('"').Replace('\\', '/');
        while (normalized.StartsWith("./", StringComparison.Ordinal) == true)
        {
            normalized = normalized[2..];
        }

        if (string.IsNullOrWhiteSpace(normalized) == true)
        {
            throw new InvalidOperationException("상대 경로 확인이 필요합니다.");
        }

        return normalized;
    }

    private static char NormalizeOperation(string value)
    {
        if (string.IsNullOrWhiteSpace(value) == true)
        {
            throw new InvalidOperationException("작업 구분 확인이 필요합니다.");
        }

        var operation = char.ToUpperInvariant(value.Trim()[0]);
        if (operation != 'C' && operation != 'U' && operation != 'D')
        {
            throw new InvalidOperationException($"지원하지 않는 작업 구분입니다. Operation={value}");
        }

        return operation;
    }

    private static long ParseFileSize(string value)
    {
        return string.Equals(value.Trim(), "-", StringComparison.Ordinal) == true
            ? 0
            : long.Parse(value.Trim(), CultureInfo.InvariantCulture);
    }

    private static string NormalizeHash(string value)
    {
        return string.Equals(value.Trim(), "-", StringComparison.Ordinal) == true
            ? string.Empty
            : value.Trim().ToUpperInvariant();
    }

    private static DateTimeOffset ParseModifiedAt(string value)
    {
        return string.Equals(value.Trim(), "-", StringComparison.Ordinal) == true
            ? default
            : DateTimeOffset.Parse(value.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
    }
}
