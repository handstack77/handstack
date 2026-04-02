using System;
using System.Text.RegularExpressions;

namespace deploy.Updates;

public static class UpdateVersionComparer
{
    private static readonly Regex VersionPattern = new Regex(@"^(?<major>\d+)\.(?<minor>\d+)\.(?<build>\d+)$", RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly Regex PackageVersionPattern = new Regex(@"-(?<version>\d+\.\d+\.\d+)\.zip$", RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static int Compare(string? left, string? right)
    {
        var hasLeft = TryParse(left, out var leftVersion);
        var hasRight = TryParse(right, out var rightVersion);
        if (hasLeft == true && hasRight == true)
        {
            return leftVersion.CompareTo(rightVersion);
        }

        if (hasLeft == true)
        {
            return 1;
        }

        if (hasRight == true)
        {
            return -1;
        }

        return string.Compare(left, right, StringComparison.OrdinalIgnoreCase);
    }

    public static bool TryParse(string? value, out Version version)
    {
        version = new Version(0, 0, 0);
        if (string.IsNullOrWhiteSpace(value) == true)
        {
            return false;
        }

        var match = VersionPattern.Match(value.Trim());
        if (match.Success == false)
        {
            return false;
        }

        version = new Version(
            int.Parse(match.Groups["major"].Value),
            int.Parse(match.Groups["minor"].Value),
            int.Parse(match.Groups["build"].Value));
        return true;
    }

    public static bool TryExtractVersionFromPackageFileName(string? fileName, out string version)
    {
        version = string.Empty;
        if (string.IsNullOrWhiteSpace(fileName) == true)
        {
            return false;
        }

        var match = PackageVersionPattern.Match(fileName.Trim());
        if (match.Success == false)
        {
            return false;
        }

        version = match.Groups["version"].Value;
        return true;
    }
}
