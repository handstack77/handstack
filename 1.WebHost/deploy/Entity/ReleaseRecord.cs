using System;
using System.Collections.Generic;

namespace deploy.Entity
{
    public sealed class ReleaseRecord
    {
        public string ReleaseId { get; set; } = "";

        public string Channel { get; set; } = "stable";

        public string Platform { get; set; } = "win-x64";

        public string Notes { get; set; } = "";

        public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset? PublishedAtUtc { get; set; }

        public bool IsPublished { get; set; }

        public List<ReleasePackageRecord> Packages { get; set; } = [];
    }

    public sealed class ReleasePackageRecord
    {
        public string PackageType { get; set; } = "";

        public string Target { get; set; } = "";

        public string Version { get; set; } = "";

        public string FileName { get; set; } = "";

        public string SourceFilePath { get; set; } = "";

        public string Sha256 { get; set; } = "";

        public long Size { get; set; }
    }
}
