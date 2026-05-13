using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

namespace updater.Updates;

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

        if (string.IsNullOrWhiteSpace(columns[0]) == true)
        {
            throw new InvalidOperationException("작업 구분 확인이 필요합니다.");
        }

        var operation = char.ToUpperInvariant(columns[0].Trim()[0]);
        if (operation != 'C' && operation != 'U' && operation != 'D')
        {
            throw new InvalidOperationException($"지원하지 않는 작업 구분입니다. Operation={columns[0]}");
        }

        var fileSizeText = columns[2].Trim();
        var fileSize = 0L;
        if (string.Equals(fileSizeText, "-", StringComparison.Ordinal) == false &&
            long.TryParse(fileSizeText, NumberStyles.Integer, CultureInfo.InvariantCulture, out fileSize) == false)
        {
            throw new FormatException($"패키지 manifest 파일 크기 형식이 올바르지 않습니다. FileSize={fileSizeText}, Entry={rawValue}");
        }

        var hash = string.Equals(columns[3].Trim(), "-", StringComparison.Ordinal) == true
            ? string.Empty
            : columns[3].Trim().ToUpperInvariant();

        var modifiedAtText = columns[4].Trim();
        var modifiedAt = default(DateTimeOffset);
        if (string.Equals(modifiedAtText, "-", StringComparison.Ordinal) == false &&
            DateTimeOffset.TryParse(modifiedAtText, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out modifiedAt) == false)
        {
            throw new FormatException($"패키지 manifest 수정일 형식이 올바르지 않습니다. ModifiedAt={modifiedAtText}, Entry={rawValue}");
        }

        return new PackageManifestEntry(
            operation,
            NormalizeRelativePath(columns[1]),
            fileSize,
            hash,
            modifiedAt);
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

}
