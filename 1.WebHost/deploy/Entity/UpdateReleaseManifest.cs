using System;
using System.Collections.Generic;

namespace deploy.Entity
{
    public sealed class UpdateReleaseManifest
    {
        public string Channel { get; set; } = "stable";

        public string ReleaseId { get; set; } = "";

        public DateTimeOffset ReleasedAtUtc { get; set; } = DateTimeOffset.UtcNow;

        public Dictionary<string, UpdatePlatformManifest> Platforms { get; set; } = new Dictionary<string, UpdatePlatformManifest>(StringComparer.OrdinalIgnoreCase);
    }

    public sealed class UpdatePlatformManifest
    {
        public UpdatePackageManifest? Host { get; set; }

        public Dictionary<string, UpdatePackageManifest> Modules { get; set; } = new Dictionary<string, UpdatePackageManifest>(StringComparer.OrdinalIgnoreCase);
    }

    public sealed class UpdatePackageManifest
    {
        public string Version { get; set; } = "";

        public string PackageType { get; set; } = "";

        public string Target { get; set; } = "";

        public string FileName { get; set; } = "";

        public string DownloadUrl { get; set; } = "";

        public string Sha256 { get; set; } = "";

        public long Size { get; set; }
    }
}
