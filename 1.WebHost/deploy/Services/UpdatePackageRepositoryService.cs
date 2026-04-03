using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;

using deploy.Entity;
using deploy.Options;

using deploy.Updates;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace deploy.Services
{
    public sealed class UpdatePackageRepositoryService : IUpdatePackageRepositoryService
    {
        private readonly object syncRoot = new object();
        private readonly IOptionsMonitor<DeployOptions> optionsMonitor;
        private readonly string executableBasePath;
        private readonly ILogger<UpdatePackageRepositoryService> logger;

        public UpdatePackageRepositoryService(
            IOptionsMonitor<DeployOptions> optionsMonitor,
            ILogger<UpdatePackageRepositoryService> logger)
        {
            this.optionsMonitor = optionsMonitor;
            executableBasePath = Path.GetFullPath(AppContext.BaseDirectory);
            this.logger = logger;
        }

        private DeployOptions CurrentOptions => optionsMonitor.CurrentValue;

        private string StorageRootPath
        {
            get
            {
                var storageRoot = ResolvePath(CurrentOptions.StorageRoot, executableBasePath);
                Directory.CreateDirectory(storageRoot);
                return storageRoot;
            }
        }

        public string PublicRootPath
        {
            get
            {
                var configuredPath = CurrentOptions.PublicRootPath;
                var path = string.IsNullOrWhiteSpace(configuredPath) == true
                    ? Path.Combine(StorageRootPath, "public")
                    : ResolvePath(configuredPath, executableBasePath);

                Directory.CreateDirectory(path);
                return path;
            }
        }

        private string PackagesRootPath
        {
            get
            {
                var path = Path.Combine(PublicRootPath, "packages");
                Directory.CreateDirectory(path);
                return path;
            }
        }

        private string ErrorsRootPath
        {
            get
            {
                var path = Path.Combine(StorageRootPath, "errors");
                Directory.CreateDirectory(path);
                return path;
            }
        }

        private string CatalogFilePath => Path.Combine(StorageRootPath, "update-catalog.json");

        public string PublicRequestPath => string.IsNullOrWhiteSpace(CurrentOptions.PublicRequestPath) == true
            ? "release"
            : CurrentOptions.PublicRequestPath.Trim('/');

        public IReadOnlyList<UpdateCatalogPackage> GetPackages()
        {
            lock (syncRoot)
            {
                return LoadCatalog()
                    .Packages
                    .Where(item => File.Exists(Path.Combine(PackagesRootPath, item.FileName)) == true)
                    .OrderByDescending(item => item.Version, Comparer<string>.Create(UpdateVersionComparer.Compare))
                    .ToList();
            }
        }

        public UpdateCatalogPackage SavePackage(IFormFile file, string? releaseNotes, DateTimeOffset? releaseDate)
        {
            lock (syncRoot)
            {
                if (file == null || file.Length <= 0)
                {
                    throw new InvalidOperationException("업로드 파일 확인 필요.");
                }

                var safeFileName = SanitizeFileName(Path.GetFileName(file.FileName));
                if (UpdateVersionComparer.TryExtractVersionFromPackageFileName(safeFileName, out var version) == false)
                {
                    throw new InvalidOperationException("배포 패키지 파일명에서 버전을 확인할 수 없습니다. 예: deploy-2026.04.001.zip");
                }

                var destinationFilePath = Path.Combine(PackagesRootPath, safeFileName);
                using (var stream = new FileStream(destinationFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    file.CopyTo(stream);
                }

                using var hashStream = File.OpenRead(destinationFilePath);
                var package = new UpdateCatalogPackage
                {
                    Version = version,
                    FileName = safeFileName,
                    Sha256 = Convert.ToHexString(SHA256.HashData(hashStream)).ToLowerInvariant(),
                    Size = new FileInfo(destinationFilePath).Length,
                    ReleaseDate = releaseDate ?? DateTimeOffset.UtcNow,
                    ReleaseNotes = releaseNotes?.Trim() ?? "",
                    UploadedAt = DateTimeOffset.UtcNow
                };

                var catalog = LoadCatalog();
                catalog.Packages.RemoveAll(item => string.Equals(item.Version, version, StringComparison.OrdinalIgnoreCase) == true);
                catalog.Packages.Add(package);
                catalog.Packages = catalog.Packages
                    .OrderBy(item => item.Version, Comparer<string>.Create(UpdateVersionComparer.Compare))
                    .ToList();

                var json = JsonSerializer.Serialize(catalog, UpdateJson.DefaultSerializerOptions);
                File.WriteAllText(CatalogFilePath, json + Environment.NewLine);

                logger.LogInformation(
                    "Update package saved. Version={Version}, FileName={FileName}, Size={Size}, Sha256={Sha256}",
                    package.Version,
                    package.FileName,
                    package.Size,
                    package.Sha256);

                return package;
            }
        }

        public UpdateManifestDocument BuildManifest(string publicBaseUri)
        {
            lock (syncRoot)
            {
                var packages = LoadCatalog()
                    .Packages
                    .Where(item => File.Exists(Path.Combine(PackagesRootPath, item.FileName)) == true)
                    .OrderBy(item => item.Version, Comparer<string>.Create(UpdateVersionComparer.Compare))
                    .ToList();
                if (packages.Count == 0)
                {
                    throw new FileNotFoundException("공개된 배포 패키지가 없습니다.", PackagesRootPath);
                }

                var latestPackage = packages[^1];
                return new UpdateManifestDocument
                {
                    Version = latestPackage.Version,
                    ReleaseDate = latestPackage.ReleaseDate,
                    PackageUri = BuildPackageUri(publicBaseUri, latestPackage.FileName),
                    PackageSha256 = latestPackage.Sha256,
                    PackageSize = latestPackage.Size,
                    Mandatory = CurrentOptions.Mandatory,
                    MaintenanceMode = CurrentOptions.MaintenanceMode,
                    ReleaseNotes = string.IsNullOrWhiteSpace(CurrentOptions.ReleaseNotes) == false
                        ? CurrentOptions.ReleaseNotes.Trim()
                        : latestPackage.ReleaseNotes,
                    Packages = packages.Select(item => new UpdatePackageDescriptor
                    {
                        Version = item.Version,
                        ReleaseDate = item.ReleaseDate,
                        PackageUri = BuildPackageUri(publicBaseUri, item.FileName),
                        PackageSha256 = item.Sha256,
                        PackageSize = item.Size,
                        ReleaseNotes = item.ReleaseNotes
                    }).ToList()
                };
            }
        }

        public OperationResult SaveDeployError(string message, string? source, string? version, IFormFile? file)
        {
            lock (syncRoot)
            {
                if (string.IsNullOrWhiteSpace(message) == true)
                {
                    return new OperationResult
                    {
                        Success = false,
                        ErrorCode = "invalid_payload",
                        Message = "message 확인 필요."
                    };
                }

                var bucketDirectoryPath = Path.Combine(ErrorsRootPath, DateTimeOffset.UtcNow.ToString("yyyyMMdd"));
                Directory.CreateDirectory(bucketDirectoryPath);

                var safeVersion = string.IsNullOrWhiteSpace(version) == true ? "unknown" : SanitizeFileName(version);
                var safeSource = string.IsNullOrWhiteSpace(source) == true ? "unknown" : SanitizeFileName(source);
                var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss");
                var baseFileName = $"{timestamp}-{safeSource}-{safeVersion}";

                var textFilePath = Path.Combine(bucketDirectoryPath, $"{baseFileName}.txt");
                File.WriteAllText(
                    textFilePath,
                    string.Join(
                        Environment.NewLine,
                        new[]
                        {
                            $"reportedAt={DateTimeOffset.UtcNow:O}",
                            $"source={source}",
                            $"version={version}",
                            "",
                            message.Trim()
                        }));

                if (file != null && file.Length > 0)
                {
                    var attachmentPath = Path.Combine(bucketDirectoryPath, $"{baseFileName}-{SanitizeFileName(Path.GetFileName(file.FileName))}");
                    using var stream = new FileStream(attachmentPath, FileMode.Create, FileAccess.Write, FileShare.None);
                    file.CopyTo(stream);
                }

                logger.LogWarning(
                    "Deploy error reported. Source={Source}, Version={Version}, MessageLength={MessageLength}",
                    source,
                    version,
                    message.Length);

                return new OperationResult
                {
                    Success = true,
                    Message = "오류 로그가 저장되었습니다."
                };
            }
        }

        private UpdateCatalogDocument LoadCatalog()
        {
            if (File.Exists(CatalogFilePath) == false)
            {
                return new UpdateCatalogDocument();
            }

            var json = File.ReadAllText(CatalogFilePath);
            return JsonSerializer.Deserialize<UpdateCatalogDocument>(json, UpdateJson.DefaultSerializerOptions)
                ?? new UpdateCatalogDocument();
        }

        private static string BuildPackageUri(string publicBaseUri, string fileName)
        {
            return $"{publicBaseUri.TrimEnd('/')}/packages/{Uri.EscapeDataString(fileName)}";
        }

        private static string ResolvePath(string path, string basePath)
        {
            return Path.IsPathRooted(path) == true
                ? path
                : Path.GetFullPath(Path.Combine(basePath, path));
        }

        private static string SanitizeFileName(string value)
        {
            var invalidFileNameChars = Path.GetInvalidFileNameChars();
            var buffer = value.Select(ch => invalidFileNameChars.Contains(ch) ? '_' : ch).ToArray();
            return new string(buffer);
        }
    }
}
