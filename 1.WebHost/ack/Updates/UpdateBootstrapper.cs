using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Microsoft.Extensions.Configuration;

using Serilog;

namespace ack.Updates
{
    public static class UpdateBootstrapper
    {
        private static readonly HttpClient UpdateHttpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(20)
        };

        private static readonly JsonSerializerOptions JsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public static async Task<UpdateStartupResult> TryHandleStartupUpdateAsync(IConfigurationRoot configuration)
        {
            var result = new UpdateStartupResult();
            var options = LoadOptions(configuration);

            if (options.Enabled == false || options.CheckOnStartup == false || options.AllowAutoApply == false)
            {
                return result;
            }

            if (string.IsNullOrWhiteSpace(options.BaseUrl) == true)
            {
                return result;
            }

            if (options.StartupDelaySeconds > 0)
            {
                await Task.Delay(TimeSpan.FromSeconds(options.StartupDelaySeconds));
            }

            var entryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            var installRoot = Path.GetFullPath(Path.Combine(entryBasePath, ".."));
            var packageRoot = ResolvePath(entryBasePath, options.PackageRoot);
            var tempRoot = ResolvePath(entryBasePath, options.TempRoot);
            var stateFilePath = ResolvePath(entryBasePath, options.StateFilePath);
            var updaterPath = ResolvePath(entryBasePath, options.UpdaterPath);

            var state = UpdateStateStore.Load(stateFilePath);
            state.LastCheckedAtUtc = DateTimeOffset.UtcNow;

            try
            {
                Log.Information(
                    "[Update] 업데이트 확인을 시작합니다. BaseUrl={BaseUrl}, PackageRoot={PackageRoot}, TempRoot={TempRoot}, UpdaterPath={UpdaterPath}",
                    options.BaseUrl,
                    packageRoot,
                    tempRoot,
                    updaterPath);

                var manifestUri = BuildManifestUri(options.BaseUrl);
                var releaseManifest = await DownloadReleaseManifestAsync(manifestUri);
                Log.Information(
                    "[Update] 릴리스 manifest를 조회했습니다. ReleaseId={ReleaseId}, ManifestUri={ManifestUri}, PlatformCount={PlatformCount}",
                    releaseManifest.ReleaseId,
                    manifestUri,
                    releaseManifest.Platforms.Count);

                if (releaseManifest.Platforms.Count == 0)
                {
                    state.LastStatus = "NoUpdate";
                    state.LastErrorMessage = "";
                    Log.Information("[Update] 배포 manifest에 플랫폼 정보가 없습니다.");
                    UpdateStateStore.Save(stateFilePath, state);
                    return result;
                }

                var platformId = ResolvePlatformId();
                if (releaseManifest.Platforms.TryGetValue(platformId, out var platformManifest) == false)
                {
                    Log.Information("[Update] 플랫폼 {PlatformId}에 대한 업데이트가 없습니다.", platformId);
                    state.LastStatus = "NoUpdate";
                    state.LastErrorMessage = "";
                    UpdateStateStore.Save(stateFilePath, state);
                    return result;
                }

                if (state.LastStatus == "Failed" && string.Equals(state.LastAttemptedReleaseId, releaseManifest.ReleaseId, StringComparison.OrdinalIgnoreCase) == true)
                {
                    Log.Warning("[Update] 실패한 릴리스 {ReleaseId} 재시도는 자동으로 건너뜁니다.", releaseManifest.ReleaseId);
                    UpdateStateStore.Save(stateFilePath, state);
                    return result;
                }

                var pendingPackages = await PreparePendingPackagesAsync(configuration, manifestUri, installRoot, packageRoot, platformManifest);
                if (pendingPackages.Count == 0)
                {
                    state.LastStatus = "NoUpdate";
                    state.LastErrorMessage = "";
                    state.LastPackages = [];
                    Log.Information("[Update] 적용할 업데이트가 없습니다. ReleaseId={ReleaseId}", releaseManifest.ReleaseId);
                    UpdateStateStore.Save(stateFilePath, state);
                    return result;
                }

                if (File.Exists(updaterPath) == false)
                {
                    state.LastStatus = "Failed";
                    state.LastErrorMessage = $"updater 실행 파일을 찾을 수 없습니다: {updaterPath}";
                    state.LastAttemptedReleaseId = releaseManifest.ReleaseId;
                    state.LastAttemptedAtUtc = DateTimeOffset.UtcNow;
                    UpdateStateStore.Save(stateFilePath, state);
                    Log.Error("[Update] {Message}", state.LastErrorMessage);
                    return result;
                }

                var pendingManifestPath = await WritePendingManifestAsync(tempRoot, installRoot, entryBasePath, stateFilePath, releaseManifest.ReleaseId, pendingPackages);
                Log.Information(
                    "[Update] pending manifest를 작성했습니다. ReleaseId={ReleaseId}, PendingManifestPath={PendingManifestPath}, PackageCount={PackageCount}",
                    releaseManifest.ReleaseId,
                    pendingManifestPath,
                    pendingPackages.Count);

                state.LastStatus = "Pending";
                state.LastErrorMessage = "";
                state.LastAttemptedReleaseId = releaseManifest.ReleaseId;
                state.LastAttemptedAtUtc = DateTimeOffset.UtcNow;
                state.LastPackages = pendingPackages.Select(item => new UpdateStatePackage
                {
                    Target = item.Target,
                    Version = item.Version
                }).ToList();
                UpdateStateStore.Save(stateFilePath, state);

                if (LaunchUpdater(updaterPath, pendingManifestPath) == false)
                {
                    state.LastStatus = "Failed";
                    state.LastErrorMessage = $"updater 실행에 실패했습니다: {updaterPath}";
                    UpdateStateStore.Save(stateFilePath, state);
                    return result;
                }

                Log.Information("[Update] 릴리스 {ReleaseId} 적용을 위해 updater를 실행했습니다.", releaseManifest.ReleaseId);
                result.ShouldExit = true;
                return result;
            }
            catch (Exception exception)
            {
                state.LastStatus = "Failed";
                state.LastErrorMessage = exception.Message;
                UpdateStateStore.Save(stateFilePath, state);
                Log.Error(exception, "[Update] 시작 업데이트 확인 중 오류가 발생했습니다.");
                return result;
            }
        }

        private static async Task<List<PendingUpdatePackage>> PreparePendingPackagesAsync(
            IConfigurationRoot configuration,
            Uri manifestUri,
            string installRoot,
            string packageRoot,
            UpdatePlatformManifest platformManifest)
        {
            var pendingPackages = new List<PendingUpdatePackage>();
            var currentHostVersion = GetCurrentHostVersion();

            if (platformManifest.Host != null && IsRemoteVersionNewer(currentHostVersion, platformManifest.Host.Version) == true)
            {
                Log.Information(
                    "[Update] host 업데이트가 감지되었습니다. LocalVersion={LocalVersion}, RemoteVersion={RemoteVersion}",
                    currentHostVersion,
                    platformManifest.Host.Version);
                pendingPackages.Add(await DownloadPackageAsync(manifestUri, packageRoot, installRoot, platformManifest.Host));
            }

            var loadModules = GetLoadModules(configuration);
            foreach (var moduleName in loadModules)
            {
                if (platformManifest.Modules.TryGetValue(moduleName, out var modulePackage) == false)
                {
                    continue;
                }

                var localVersion = GetCurrentModuleVersion(configuration, moduleName);
                if (IsRemoteVersionNewer(localVersion, modulePackage.Version) == false)
                {
                    continue;
                }

                Log.Information(
                    "[Update] 모듈 업데이트가 감지되었습니다. Module={Module}, LocalVersion={LocalVersion}, RemoteVersion={RemoteVersion}",
                    moduleName,
                    localVersion,
                    modulePackage.Version);
                pendingPackages.Add(await DownloadPackageAsync(manifestUri, packageRoot, installRoot, modulePackage));
            }

            return pendingPackages;
        }

        private static async Task<PendingUpdatePackage> DownloadPackageAsync(Uri manifestUri, string packageRoot, string installRoot, UpdatePackageManifest package)
        {
            if (string.IsNullOrWhiteSpace(package.DownloadUrl) == true && string.IsNullOrWhiteSpace(package.FileName) == true)
            {
                throw new InvalidOperationException($"패키지 다운로드 정보가 없습니다. target: {package.Target}");
            }

            var releaseDirectoryPath = Path.Combine(packageRoot, package.Version.Replace('/', '_').Replace('\\', '_'));
            Directory.CreateDirectory(releaseDirectoryPath);

            var packageFileName = string.IsNullOrWhiteSpace(package.FileName) == false
                ? package.FileName
                : Path.GetFileName(new Uri(manifestUri, package.DownloadUrl).LocalPath);
            var packageFilePath = Path.Combine(releaseDirectoryPath, packageFileName);
            var packageUri = ResolvePackageUri(manifestUri, package);

            Log.Information(
                "[Update] 패키지 다운로드를 시작합니다. Target={Target}, Version={Version}, PackageUri={PackageUri}",
                package.Target,
                package.Version,
                packageUri);

            using (var response = await UpdateHttpClient.GetAsync(packageUri))
            {
                response.EnsureSuccessStatusCode();

                await using var responseStream = await response.Content.ReadAsStreamAsync();
                await using var fileStream = new FileStream(packageFilePath, FileMode.Create, FileAccess.Write, FileShare.None);
                await responseStream.CopyToAsync(fileStream);
            }

            var actualHash = CalculateSha256(packageFilePath);
            if (string.IsNullOrWhiteSpace(package.Sha256) == false
                && string.Equals(actualHash, package.Sha256, StringComparison.OrdinalIgnoreCase) == false)
            {
                throw new InvalidOperationException($"SHA256 검증 실패. file: {packageFileName}");
            }

            var targetPath = ResolveTargetPath(installRoot, package.Target);
            Log.Information(
                "[Update] 패키지 다운로드가 완료되었습니다. Target={Target}, Version={Version}, FilePath={FilePath}, Size={Size}, Sha256={Sha256}",
                package.Target,
                package.Version,
                packageFilePath,
                new FileInfo(packageFilePath).Length,
                actualHash);
            return new PendingUpdatePackage
            {
                PackageType = package.PackageType,
                Target = package.Target,
                TargetPath = targetPath,
                Version = package.Version,
                PackageFilePath = packageFilePath,
                Sha256 = actualHash,
                Size = new FileInfo(packageFilePath).Length
            };
        }

        private static async Task<string> WritePendingManifestAsync(
            string tempRoot,
            string installRoot,
            string entryBasePath,
            string stateFilePath,
            string releaseId,
            List<PendingUpdatePackage> packages)
        {
            var manifestDirectoryPath = Path.Combine(tempRoot, "manifests");
            Directory.CreateDirectory(manifestDirectoryPath);

            var currentProcess = Process.GetCurrentProcess();
            var commandLineArguments = Environment.GetCommandLineArgs().Skip(1).ToList();
            var pendingManifest = new PendingUpdateManifest
            {
                ReleaseId = releaseId,
                InstallRoot = installRoot,
                EntryBasePath = entryBasePath,
                StateFilePath = stateFilePath,
                BackupRoot = Path.Combine(installRoot, "update", "backups"),
                WaitForProcessId = currentProcess.Id,
                RestartExecutablePath = currentProcess.MainModule?.FileName ?? "",
                RestartWorkingDirectory = entryBasePath,
                RestartArguments = commandLineArguments,
                Packages = packages
            };

            var manifestFilePath = Path.Combine(manifestDirectoryPath, $"update-{SanitizeFileName(releaseId)}-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}.json");
            var json = JsonSerializer.Serialize(pendingManifest, JsonSerializerOptions);
            await File.WriteAllTextAsync(manifestFilePath, json);
            return manifestFilePath;
        }

        private static bool LaunchUpdater(string updaterPath, string manifestPath)
        {
            try
            {
                var processStartInfo = new ProcessStartInfo
                {
                    WorkingDirectory = Path.GetDirectoryName(updaterPath) ?? Environment.CurrentDirectory,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                if (updaterPath.EndsWith(".dll", StringComparison.OrdinalIgnoreCase) == true)
                {
                    processStartInfo.FileName = "dotnet";
                    processStartInfo.ArgumentList.Add(updaterPath);
                }
                else
                {
                    processStartInfo.FileName = updaterPath;
                }

                processStartInfo.ArgumentList.Add("--manifest");
                processStartInfo.ArgumentList.Add(manifestPath);

                using var process = Process.Start(processStartInfo);
                return process != null;
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[Update] updater 실행 오류");
                return false;
            }
        }

        private static UpdateOptions LoadOptions(IConfiguration configuration)
        {
            var section = configuration.GetSection("Update");
            return new UpdateOptions
            {
                Enabled = bool.Parse(section["Enabled"] ?? "false"),
                CheckOnStartup = bool.Parse(section["CheckOnStartup"] ?? "true"),
                AllowAutoApply = bool.Parse(section["AllowAutoApply"] ?? "true"),
                StartupDelaySeconds = int.Parse(section["StartupDelaySeconds"] ?? "0"),
                Channel = section["Channel"] ?? "stable",
                BaseUrl = section["BaseUrl"] ?? "",
                PackageRoot = section["PackageRoot"] ?? "../update/packages",
                TempRoot = section["TempRoot"] ?? "../update/temp",
                StateFilePath = section["StateFilePath"] ?? "../update/state.json",
                UpdaterPath = section["UpdaterPath"] ?? "../updater/updater.exe"
            };
        }

        private static List<string> GetLoadModules(IConfiguration configuration)
        {
            var moduleNames = configuration.GetSection("AppSettings").GetSection("LoadModules")
                .AsEnumerable()
                .Where(item => string.IsNullOrWhiteSpace(item.Value) == false)
                .Select(item => NormalizeModuleName(item.Value!))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            return moduleNames;
        }

        private static string GetCurrentHostVersion()
        {
            return typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.0.0";
        }

        private static string GetCurrentModuleVersion(IConfiguration configuration, string moduleName)
        {
            var loadModuleBasePath = configuration["AppSettings:LoadModuleBasePath"] ?? "../modules";
            var moduleBasePath = ResolvePath(AppDomain.CurrentDomain.BaseDirectory, Path.Combine(loadModuleBasePath, moduleName, "module.json"));
            if (File.Exists(moduleBasePath) == false)
            {
                return "0.0.0";
            }

            try
            {
                using var document = JsonDocument.Parse(File.ReadAllText(moduleBasePath));
                if (document.RootElement.TryGetProperty("Version", out var versionElement) == true)
                {
                    return versionElement.GetString() ?? "0.0.0";
                }
            }
            catch
            {
            }

            return "0.0.0";
        }

        private static string ResolvePlatformId()
        {
            var os = OperatingSystem.IsWindows() ? "win"
                : OperatingSystem.IsLinux() ? "linux"
                : OperatingSystem.IsMacOS() ? "osx"
                : "unknown";

            var arch = RuntimeInformation.OSArchitecture switch
            {
                Architecture.X64 => "x64",
                Architecture.X86 => "x86",
                Architecture.Arm64 => "arm64",
                _ => RuntimeInformation.OSArchitecture.ToString().ToLowerInvariant()
            };

            return $"{os}-{arch}";
        }

        private static Uri BuildManifestUri(string baseUrl)
        {
            if (baseUrl.EndsWith(".json", StringComparison.OrdinalIgnoreCase) == true)
            {
                return new Uri(baseUrl, UriKind.Absolute);
            }

            var normalizedBaseUrl = baseUrl.EndsWith("/") == true ? baseUrl : baseUrl + "/";
            return new Uri(normalizedBaseUrl + "version.json", UriKind.Absolute);
        }

        private static async Task<UpdateReleaseManifest> DownloadReleaseManifestAsync(Uri manifestUri)
        {
            var json = await UpdateHttpClient.GetStringAsync(manifestUri);
            return JsonSerializer.Deserialize<UpdateReleaseManifest>(json, JsonSerializerOptions) ?? new UpdateReleaseManifest();
        }

        private static Uri ResolvePackageUri(Uri manifestUri, UpdatePackageManifest package)
        {
            if (string.IsNullOrWhiteSpace(package.DownloadUrl) == false)
            {
                return new Uri(manifestUri, package.DownloadUrl);
            }

            return new Uri(manifestUri, package.FileName);
        }

        private static string ResolveTargetPath(string installRoot, string target)
        {
            if (string.Equals(target, "app", StringComparison.OrdinalIgnoreCase) == true)
            {
                return Path.Combine(installRoot, "app");
            }

            if (target.StartsWith("modules/", StringComparison.OrdinalIgnoreCase) == true || target.StartsWith("modules\\", StringComparison.OrdinalIgnoreCase) == true)
            {
                var relativeTarget = target.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
                return Path.Combine(installRoot, relativeTarget);
            }

            throw new InvalidOperationException($"지원하지 않는 업데이트 target: {target}");
        }

        private static string ResolvePath(string basePath, string configuredPath)
        {
            if (string.IsNullOrWhiteSpace(configuredPath) == true)
            {
                return basePath;
            }

            return Path.GetFullPath(Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.Combine(basePath, configuredPath));
        }

        private static string CalculateSha256(string filePath)
        {
            using var stream = File.OpenRead(filePath);
            var hash = SHA256.HashData(stream);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static string NormalizeModuleName(string moduleName)
        {
            if (string.IsNullOrWhiteSpace(moduleName) == true)
            {
                return string.Empty;
            }

            var separatorIndex = moduleName.IndexOf('|');
            return separatorIndex > -1
                ? moduleName.Substring(0, separatorIndex).Trim()
                : moduleName.Trim();
        }

        private static bool IsRemoteVersionNewer(string localVersionText, string remoteVersionText)
        {
            if (string.IsNullOrWhiteSpace(remoteVersionText) == true)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(localVersionText) == true)
            {
                return true;
            }

            if (Version.TryParse(localVersionText, out var localVersion) == true
                && Version.TryParse(remoteVersionText, out var remoteVersion) == true)
            {
                return remoteVersion > localVersion;
            }

            return string.Equals(localVersionText, remoteVersionText, StringComparison.OrdinalIgnoreCase) == false;
        }

        private static string SanitizeFileName(string value)
        {
            var invalidFileNameChars = Path.GetInvalidFileNameChars();
            var buffer = value.Select(ch => invalidFileNameChars.Contains(ch) ? '_' : ch).ToArray();
            return new string(buffer);
        }
    }
}
