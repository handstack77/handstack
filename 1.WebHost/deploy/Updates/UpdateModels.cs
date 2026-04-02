using System;
using System.Collections.Generic;

namespace deploy.Updates;

public sealed class InstalledVersionInfo
{
    public string Version { get; set; } = VersionFileStore.DefaultVersion;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class UpdateManifestDocument
{
    public string Version { get; set; } = "";

    public DateTimeOffset ReleaseDate { get; set; } = DateTimeOffset.UtcNow;

    public string PackageUri { get; set; } = "";

    public string PackageSha256 { get; set; } = "";

    public long PackageSize { get; set; }

    public bool Mandatory { get; set; }

    public bool MaintenanceMode { get; set; }

    public string ReleaseNotes { get; set; } = "";

    public List<UpdatePackageDescriptor> Packages { get; set; } = [];
}

public sealed class UpdatePackageDescriptor
{
    public string Version { get; set; } = "";

    public DateTimeOffset ReleaseDate { get; set; } = DateTimeOffset.UtcNow;

    public string PackageUri { get; set; } = "";

    public string PackageSha256 { get; set; } = "";

    public long PackageSize { get; set; }

    public string ReleaseNotes { get; set; } = "";
}

public sealed class UpdateLaunchPlan
{
    public string InstallRoot { get; set; } = "";

    public string ManifestUri { get; set; } = "";

    public string AckExecutablePath { get; set; } = "";

    public string AckWorkingDirectory { get; set; } = "";

    public List<string> AckArguments { get; set; } = [];

    public string VersionFilePath { get; set; } = "";

    public string CurrentVersion { get; set; } = "";

    public string TargetVersion { get; set; } = "";

    public string? ErrorReportUri { get; set; }

    public string? HealthCheckUri { get; set; }

    public bool Mandatory { get; set; }

    public bool MaintenanceMode { get; set; }

    public int WaitForProcessId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<UpdatePackageDescriptor> Packages { get; set; } = [];
}

public sealed class UpdateCatalogDocument
{
    public bool Mandatory { get; set; }

    public bool MaintenanceMode { get; set; }

    public string ReleaseNotes { get; set; } = "";

    public List<UpdateCatalogPackage> Packages { get; set; } = [];
}

public sealed class UpdateCatalogPackage
{
    public string Version { get; set; } = "";

    public string FileName { get; set; } = "";

    public string Sha256 { get; set; } = "";

    public long Size { get; set; }

    public DateTimeOffset ReleaseDate { get; set; } = DateTimeOffset.UtcNow;

    public string ReleaseNotes { get; set; } = "";

    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
}
