using System;
using System.Collections.Generic;

namespace ack.Updates
{
    public sealed class UpdateOptions
    {
        public bool Enabled { get; set; }

        public bool CheckOnStartup { get; set; } = true;

        public bool AllowAutoApply { get; set; } = true;

        public int StartupDelaySeconds { get; set; }

        public string Channel { get; set; } = "stable";

        public string BaseUrl { get; set; } = "";

        public string PackageRoot { get; set; } = "../update/packages";

        public string TempRoot { get; set; } = "../update/temp";

        public string StateFilePath { get; set; } = "../update/state.json";

        public string UpdaterPath { get; set; } = "../updater/updater.exe";
    }

    public sealed class UpdateState
    {
        public DateTimeOffset? LastCheckedAtUtc { get; set; }

        public string LastStatus { get; set; } = "None";

        public string LastErrorMessage { get; set; } = "";

        public string LastAttemptedReleaseId { get; set; } = "";

        public DateTimeOffset? LastAttemptedAtUtc { get; set; }

        public string LastAppliedReleaseId { get; set; } = "";

        public DateTimeOffset? LastAppliedAtUtc { get; set; }

        public List<UpdateStatePackage> LastPackages { get; set; } = [];
    }

    public sealed class UpdateStatePackage
    {
        public string Target { get; set; } = "";

        public string Version { get; set; } = "";
    }

    public sealed class UpdateReleaseManifest
    {
        public string Channel { get; set; } = "stable";

        public string ReleaseId { get; set; } = "";

        public DateTimeOffset? ReleasedAtUtc { get; set; }

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

    public sealed class PendingUpdateManifest
    {
        public string ReleaseId { get; set; } = "";

        public string InstallRoot { get; set; } = "";

        public string EntryBasePath { get; set; } = "";

        public string StateFilePath { get; set; } = "";

        public string BackupRoot { get; set; } = "";

        public int WaitForProcessId { get; set; }

        public string RestartExecutablePath { get; set; } = "";

        public string RestartWorkingDirectory { get; set; } = "";

        public List<string> RestartArguments { get; set; } = [];

        public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

        public List<PendingUpdatePackage> Packages { get; set; } = [];
    }

    public sealed class PendingUpdatePackage
    {
        public string PackageType { get; set; } = "";

        public string Target { get; set; } = "";

        public string TargetPath { get; set; } = "";

        public string Version { get; set; } = "";

        public string PackageFilePath { get; set; } = "";

        public string Sha256 { get; set; } = "";

        public long Size { get; set; }
    }

    public sealed class UpdateStartupResult
    {
        public bool ShouldExit { get; set; }
    }
}
