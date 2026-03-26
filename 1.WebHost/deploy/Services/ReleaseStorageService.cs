using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;

using deploy.Entity;
using deploy.Options;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace deploy.Services
{
    public sealed class ReleaseStorageService : IReleaseStorageService
    {
        private static readonly JsonSerializerOptions JsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly object syncRoot = new object();
        private readonly IOptionsMonitor<DeployOptions> optionsMonitor;
        private readonly string contentRootPath;
        private readonly ILogger<ReleaseStorageService> logger;

        public ReleaseStorageService(IOptionsMonitor<DeployOptions> optionsMonitor, IHostEnvironment hostEnvironment, ILogger<ReleaseStorageService> logger)
        {
            this.optionsMonitor = optionsMonitor;
            contentRootPath = hostEnvironment.ContentRootPath;
            this.logger = logger;
        }

        private DeployOptions CurrentOptions => optionsMonitor.CurrentValue;

        public string StorageRootPath
        {
            get
            {
                var storageRoot = CurrentOptions.StorageRoot;
                if (Path.IsPathRooted(storageRoot) == false)
                {
                    storageRoot = Path.GetFullPath(Path.Combine(contentRootPath, storageRoot));
                }

                Directory.CreateDirectory(storageRoot);
                return storageRoot;
            }
        }

        public string ReleasesRootPath
        {
            get
            {
                var path = Path.Combine(StorageRootPath, "releases");
                Directory.CreateDirectory(path);
                return path;
            }
        }

        public string PublicRootPath
        {
            get
            {
                var path = Path.Combine(StorageRootPath, "public");
                Directory.CreateDirectory(path);
                return path;
            }
        }

        public string PublicRequestPath => string.IsNullOrWhiteSpace(CurrentOptions.PublicRequestPath) == true ? "updates" : CurrentOptions.PublicRequestPath.Trim();

        private string DefaultChannel => string.IsNullOrWhiteSpace(CurrentOptions.DefaultChannel) ? "stable" : CurrentOptions.DefaultChannel;

        private string DefaultPlatform => string.IsNullOrWhiteSpace(CurrentOptions.DefaultPlatform) ? "win-x64" : CurrentOptions.DefaultPlatform;

        public IReadOnlyList<ReleaseRecord> GetReleases()
        {
            lock (syncRoot)
            {
                return Directory.Exists(ReleasesRootPath) == false
                    ? []
                    : Directory.GetDirectories(ReleasesRootPath)
                        .Select(directoryPath => LoadRelease(Path.GetFileName(directoryPath)))
                        .Where(item => item != null)
                        .Cast<ReleaseRecord>()
                        .OrderByDescending(item => item.CreatedAtUtc)
                        .ToList();
            }
        }

        public ReleaseRecord? GetRelease(string releaseId)
        {
            lock (syncRoot)
            {
                return LoadRelease(releaseId);
            }
        }

        public ReleaseRecord CreateRelease(CreateReleaseRequest request)
        {
            lock (syncRoot)
            {
                var releaseId = $"rel-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}".Substring(0, 24);
                var release = new ReleaseRecord
                {
                    ReleaseId = releaseId,
                    Channel = string.IsNullOrWhiteSpace(request.Channel) ? DefaultChannel : request.Channel.Trim(),
                    Platform = string.IsNullOrWhiteSpace(request.Platform) ? DefaultPlatform : request.Platform.Trim(),
                    Notes = request.Notes?.Trim() ?? ""
                };

                logger.LogInformation(
                    "Creating release. ReleaseId={ReleaseId}, Channel={Channel}, Platform={Platform}, NotesLength={NotesLength}",
                    release.ReleaseId,
                    release.Channel,
                    release.Platform,
                    release.Notes.Length);

                SaveRelease(release);
                logger.LogInformation(
                    "Release created. ReleaseId={ReleaseId}, ReleaseFilePath={ReleaseFilePath}",
                    release.ReleaseId,
                    GetReleaseFilePath(release.ReleaseId));
                return release;
            }
        }

        public ReleasePackageRecord SavePackage(string releaseId, string packageType, string targetId, string version, IFormFile file)
        {
            lock (syncRoot)
            {
                var release = LoadRelease(releaseId) ?? throw new InvalidOperationException("release를 찾을 수 없습니다.");
                if (file.Length <= 0)
                {
                    throw new InvalidOperationException("업로드 파일 확인 필요.");
                }

                packageType = packageType?.Trim().ToLowerInvariant() ?? "";
                targetId = targetId?.Trim() ?? "";
                version = version?.Trim() ?? "";
                if (packageType != "host" && packageType != "module")
                {
                    throw new InvalidOperationException("packageType은 host 또는 module 이어야 합니다.");
                }

                if (string.IsNullOrWhiteSpace(version) == true)
                {
                    throw new InvalidOperationException("version 확인 필요.");
                }

                if (packageType == "module" && string.IsNullOrWhiteSpace(targetId) == true)
                {
                    throw new InvalidOperationException("module targetId 확인 필요.");
                }

                logger.LogInformation(
                    "Saving package. ReleaseId={ReleaseId}, PackageType={PackageType}, TargetId={TargetId}, Version={Version}, OriginalFileName={OriginalFileName}, Size={Size}",
                    releaseId,
                    packageType,
                    targetId,
                    version,
                    file.FileName,
                    file.Length);

                var releaseDirectoryPath = GetReleaseDirectoryPath(releaseId);
                var packagesDirectoryPath = Path.Combine(releaseDirectoryPath, "packages");
                Directory.CreateDirectory(packagesDirectoryPath);

                var safeFileName = SanitizeFileName(Path.GetFileName(file.FileName));
                var destinationFilePath = Path.Combine(packagesDirectoryPath, safeFileName);
                using (var stream = new FileStream(destinationFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    file.CopyTo(stream);
                }

                var packageRecord = new ReleasePackageRecord
                {
                    PackageType = packageType,
                    Target = packageType == "host" ? "app" : $"modules/{targetId}",
                    Version = version,
                    FileName = safeFileName,
                    SourceFilePath = destinationFilePath,
                    Sha256 = CalculateSha256(destinationFilePath),
                    Size = new FileInfo(destinationFilePath).Length
                };

                var replacedPackageCount = release.Packages.RemoveAll(item => string.Equals(item.Target, packageRecord.Target, StringComparison.OrdinalIgnoreCase));
                if (replacedPackageCount > 0)
                {
                    logger.LogWarning(
                        "Existing package entry replaced. ReleaseId={ReleaseId}, Target={Target}, ReplacedCount={ReplacedCount}",
                        releaseId,
                        packageRecord.Target,
                        replacedPackageCount);
                }

                release.Packages.Add(packageRecord);
                SaveRelease(release);
                logger.LogInformation(
                    "Package saved. ReleaseId={ReleaseId}, Target={Target}, Version={Version}, FileName={FileName}, Sha256={Sha256}, Size={Size}",
                    releaseId,
                    packageRecord.Target,
                    packageRecord.Version,
                    packageRecord.FileName,
                    packageRecord.Sha256,
                    packageRecord.Size);
                return packageRecord;
            }
        }

        public ReleaseRecord PublishRelease(string releaseId)
        {
            lock (syncRoot)
            {
                var release = LoadRelease(releaseId) ?? throw new InvalidOperationException("release를 찾을 수 없습니다.");
                if (release.Packages.Count == 0)
                {
                    throw new InvalidOperationException("publish할 패키지가 없습니다.");
                }

                logger.LogInformation(
                    "Publishing release. ReleaseId={ReleaseId}, Channel={Channel}, Platform={Platform}, PackageCount={PackageCount}",
                    release.ReleaseId,
                    release.Channel,
                    release.Platform,
                    release.Packages.Count);

                var channelDirectoryPath = Path.Combine(PublicRootPath, release.Channel);
                if (Directory.Exists(channelDirectoryPath) == true)
                {
                    logger.LogWarning(
                        "Existing public channel content will be replaced. Channel={Channel}, ChannelDirectoryPath={ChannelDirectoryPath}",
                        release.Channel,
                        channelDirectoryPath);
                    Directory.Delete(channelDirectoryPath, true);
                }

                var packagesDirectoryPath = Path.Combine(channelDirectoryPath, "packages");
                Directory.CreateDirectory(packagesDirectoryPath);

                var manifest = new UpdateReleaseManifest
                {
                    Channel = release.Channel,
                    ReleaseId = release.ReleaseId,
                    ReleasedAtUtc = DateTimeOffset.UtcNow
                };

                var platformManifest = new UpdatePlatformManifest();
                foreach (var package in release.Packages)
                {
                    var destinationFilePath = Path.Combine(packagesDirectoryPath, package.FileName);
                    logger.LogInformation(
                        "Publishing package. ReleaseId={ReleaseId}, Target={Target}, SourceFilePath={SourceFilePath}, DestinationFilePath={DestinationFilePath}",
                        release.ReleaseId,
                        package.Target,
                        package.SourceFilePath,
                        destinationFilePath);
                    File.Copy(package.SourceFilePath, destinationFilePath, true);

                    var publicPackage = new UpdatePackageManifest
                    {
                        Version = package.Version,
                        PackageType = package.PackageType,
                        Target = package.Target,
                        FileName = package.FileName,
                        DownloadUrl = $"packages/{package.FileName}",
                        Sha256 = package.Sha256,
                        Size = package.Size
                    };

                    if (string.Equals(package.PackageType, "host", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        platformManifest.Host = publicPackage;
                    }
                    else
                    {
                        var moduleId = package.Target.Replace("modules/", "", StringComparison.OrdinalIgnoreCase)
                            .Replace("modules\\", "", StringComparison.OrdinalIgnoreCase);
                        platformManifest.Modules[moduleId] = publicPackage;
                    }
                }

                manifest.Platforms[release.Platform] = platformManifest;
                var manifestFilePath = Path.Combine(channelDirectoryPath, "version.json");
                var json = JsonSerializer.Serialize(manifest, JsonSerializerOptions);
                File.WriteAllText(manifestFilePath, json + Environment.NewLine);
                logger.LogInformation(
                    "Release manifest written. ReleaseId={ReleaseId}, ManifestFilePath={ManifestFilePath}, PublicVersionUrl={PublicVersionUrl}",
                    release.ReleaseId,
                    manifestFilePath,
                    "/" + PublicRequestPath + "/" + release.Channel + "/version.json");

                release.IsPublished = true;
                release.PublishedAtUtc = manifest.ReleasedAtUtc;
                SaveRelease(release);
                logger.LogInformation(
                    "Release published. ReleaseId={ReleaseId}, PublishedAtUtc={PublishedAtUtc}",
                    release.ReleaseId,
                    release.PublishedAtUtc);
                return release;
            }
        }

        private ReleaseRecord? LoadRelease(string releaseId)
        {
            var releaseFilePath = GetReleaseFilePath(releaseId);
            if (File.Exists(releaseFilePath) == false)
            {
                return null;
            }

            var text = File.ReadAllText(releaseFilePath);
            return JsonSerializer.Deserialize<ReleaseRecord>(text, JsonSerializerOptions);
        }

        private void SaveRelease(ReleaseRecord release)
        {
            var releaseDirectoryPath = GetReleaseDirectoryPath(release.ReleaseId);
            Directory.CreateDirectory(releaseDirectoryPath);

            var releaseFilePath = GetReleaseFilePath(release.ReleaseId);
            var json = JsonSerializer.Serialize(release, JsonSerializerOptions);
            File.WriteAllText(releaseFilePath, json + Environment.NewLine);
        }

        private string GetReleaseDirectoryPath(string releaseId)
        {
            return Path.Combine(ReleasesRootPath, releaseId);
        }

        private string GetReleaseFilePath(string releaseId)
        {
            return Path.Combine(GetReleaseDirectoryPath(releaseId), "release.json");
        }

        private static string CalculateSha256(string filePath)
        {
            using var stream = File.OpenRead(filePath);
            var hash = SHA256.HashData(stream);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static string SanitizeFileName(string value)
        {
            var invalidFileNameChars = Path.GetInvalidFileNameChars();
            var buffer = value.Select(ch => invalidFileNameChars.Contains(ch) ? '_' : ch).ToArray();
            return new string(buffer);
        }
    }
}
