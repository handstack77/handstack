using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

using Microsoft.Extensions.Configuration;

using Serilog;

using updater.Updates;

namespace updater;

internal static class Program
{
    private static readonly HttpClient HttpClient = new HttpClient
    {
        Timeout = TimeSpan.FromMinutes(60)
    };

    private static readonly IConfiguration Configuration = new ConfigurationBuilder()
        .AddJsonFile(Path.Combine(AppContext.BaseDirectory, "appsettings.json"), optional: true, reloadOnChange: false)
        .Build();
    private static readonly object LogSyncRoot = new object();
    private static string? logFilePath;
    private static bool logFileConfigured;

    public static async Task<int> Main(string[] args)
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .WriteTo.Console()
            .CreateLogger();

        try
        {
            var manifestUrlOption = new Option<string?>("--manifest-url")
            {
                Description = "업데이트 manifest 주소입니다."
            };

            var errorUrlOption = new Option<string?>("--error-url")
            {
                Description = "업데이트 실패 보고 주소입니다."
            };

            var installRootOption = new Option<string?>("--install-root")
            {
                Description = "HandStack 설치 루트 경로입니다. 미지정 시 updater 위치 기준으로 계산합니다."
            };

            var ackPathOption = new Option<string?>("--ack-path")
            {
                Description = "ack 실행 파일 경로입니다. 미지정 시 installRoot/app/ack(.exe)를 사용합니다."
            };

            var healthUrlOption = new Option<string?>("--health-url")
            {
                Description = "업데이트 후 ack 헬스체크 주소입니다. 미지정 시 /checkip를 사용합니다."
            };

            var initialVersionOption = new Option<string?>("--initial-version")
            {
                Description = "version.json이 없을 때 기록할 초기 버전입니다.",
                DefaultValueFactory = _ => VersionFileStore.DefaultVersion
            };

            var waitForProcessIdOption = new Option<int?>("--wait-for-process-id")
            {
                Description = "업데이트 적용 전에 종료를 기다릴 프로세스 ID입니다."
            };

            var rootCommand = new RootCommand("HandStack updater")
            {
                manifestUrlOption,
                errorUrlOption,
                installRootOption,
                ackPathOption,
                healthUrlOption,
                initialVersionOption,
                waitForProcessIdOption
            };

            rootCommand.TreatUnmatchedTokensAsErrors = false;
            rootCommand.SetAction(async parseResult =>
            {
                int exitCode;
                try
                {
                    exitCode = await RunAsync(
                        parseResult.GetValue(manifestUrlOption),
                        parseResult.GetValue(errorUrlOption),
                        parseResult.GetValue(installRootOption),
                        parseResult.GetValue(ackPathOption),
                        parseResult.GetValue(healthUrlOption),
                        parseResult.GetValue(initialVersionOption),
                        parseResult.GetValue(waitForProcessIdOption),
                        parseResult.UnmatchedTokens);
                }
                catch (Exception exception)
                {
                    Log.Error(exception, "[CLI/updater]" + $"updater 처리 실패: {exception.Message}");
                    exitCode = 1;
                }

                Environment.ExitCode = exitCode;
            });

            var parse = rootCommand.Parse(args);
            if (parse.Errors.Count > 0)
            {
                foreach (var error in parse.Errors)
                {
                    Log.Error("[CLI/updater]" + error.Message);
                }

                return 1;
            }

            return await parse.InvokeAsync();
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }

    private static async Task<int> RunAsync(string? manifestUrlOption, string? errorUrlOption, string? installRootOption, string? ackPathOption, string? healthUrlOption, string? initialVersionOption, int? waitForProcessIdOption, IReadOnlyList<string> ackArguments)
    {
        var installRoot = string.IsNullOrWhiteSpace(installRootOption) == false
            ? Path.GetFullPath(installRootOption)
            : InstallLayout.ResolveInstallRootFromToolDirectory(AppContext.BaseDirectory);
        InitializeLogFile(installRoot);

        var manifestUrl = FirstNonEmpty(manifestUrlOption, Configuration["HandstackUpdateManifestUrl"]);
        var errorUrl = FirstNonEmpty(errorUrlOption, Configuration["HandstackUpdateErrorUrl"]);
        var ackExecutablePath = string.IsNullOrWhiteSpace(ackPathOption) == true
            ? InstallLayout.ResolveDefaultAckExecutablePath(installRoot)
            : (Path.IsPathRooted(ackPathOption) == true
                ? Path.GetFullPath(ackPathOption)
                : Path.GetFullPath(Path.Combine(installRoot, ackPathOption)));
        var versionFilePath = InstallLayout.ResolveVersionFilePath(ackExecutablePath);
        var currentVersion = VersionFileStore.Ensure(versionFilePath, initialVersionOption);
        const int defaultPort = 8421;
        var detectedPort = defaultPort;
        for (int index = 0; index < ackArguments.Count; index++)
        {
            var argument = ackArguments[index];
            if (string.Equals(argument, "--port", StringComparison.OrdinalIgnoreCase) == true && index + 1 < ackArguments.Count)
            {
                if (int.TryParse(ackArguments[index + 1], out var parsedPort) == true)
                {
                    detectedPort = parsedPort;
                }

                break;
            }

            if (argument.StartsWith("--port=", StringComparison.OrdinalIgnoreCase) == true
                || argument.StartsWith("--port:", StringComparison.OrdinalIgnoreCase) == true)
            {
                var tokens = argument.Split(['=', ':'], 2, StringSplitOptions.RemoveEmptyEntries);
                if (tokens.Length == 2 && int.TryParse(tokens[1], out var parsedPort) == true)
                {
                    detectedPort = parsedPort;
                }

                break;
            }
        }

        var healthUrl = FirstNonEmpty(healthUrlOption, $"http://localhost:{detectedPort}/checkip");
        var waitForProcessId = waitForProcessIdOption ?? 0;

        Log.Information("[CLI/updater]" + "updater 시작. InstallRoot={0}, AckExecutablePath={1}, CurrentVersion={2}, AckArgumentCount={3}, WaitForProcessId={4}", installRoot, ackExecutablePath, currentVersion.Version, ackArguments.Count, waitForProcessId);

        if (File.Exists(ackExecutablePath) == false)
        {
            Log.Error("[CLI/updater]" + "ack 실행 파일을 찾을 수 없습니다. AckExecutablePath={0}", ackExecutablePath);
            return 1;
        }

        if (string.IsNullOrWhiteSpace(manifestUrl) == true)
        {
            Log.Warning("[CLI/updater]" + "업데이트 manifest 주소가 없어 업데이트 확인을 건너뜁니다.");
            return await StartAckAfterOptionalWaitAsync(ackExecutablePath, installRoot, ackArguments, waitForProcessId);
        }

        UpdateManifestDocument manifest;
        try
        {
            manifest = await FetchManifestAsync(manifestUrl);
        }
        catch (Exception exception)
        {
            Log.Error(exception, "[CLI/updater]" + $"manifest 조회 실패: {exception.Message}");
            return await StartAckAfterOptionalWaitAsync(ackExecutablePath, installRoot, ackArguments, waitForProcessId);
        }

        var availablePackages = NormalizePackages(manifest)
            .OrderBy(item => item.Version, Comparer<string>.Create(UpdateVersionComparer.Compare))
            .ToList();

        if (availablePackages.Count == 0)
        {
            Log.Warning("[CLI/updater]" + "manifest에 적용 가능한 패키지 목록이 없습니다. ManifestUrl={0}", manifestUrl);
            return await StartAckAfterOptionalWaitAsync(ackExecutablePath, installRoot, ackArguments, waitForProcessId);
        }

        if (UpdateVersionComparer.Compare(manifest.Version, currentVersion.Version) < 0)
        {
            Log.Warning("[CLI/updater]" + "서버 최신 버전이 현재 버전보다 낮아 업데이트를 건너뜁니다. CurrentVersion={0}, ServerVersion={1}", currentVersion.Version, manifest.Version);
            return await StartAckAfterOptionalWaitAsync(ackExecutablePath, installRoot, ackArguments, waitForProcessId);
        }

        var packagesToApply = availablePackages
            .Where(item => UpdateVersionComparer.Compare(item.Version, currentVersion.Version) > 0)
            .OrderBy(item => item.Version, Comparer<string>.Create(UpdateVersionComparer.Compare))
            .ToList();

        if (packagesToApply.Count == 0)
        {
            Log.Information("[CLI/updater]" + "최신 버전이 이미 적용되어 있습니다. CurrentVersion={0}", currentVersion.Version);
            return await StartAckAfterOptionalWaitAsync(ackExecutablePath, installRoot, ackArguments, waitForProcessId);
        }

        var plan = new UpdateLaunchPlan
        {
            InstallRoot = installRoot,
            ManifestUri = manifestUrl,
            AckExecutablePath = ackExecutablePath,
            AckWorkingDirectory = Path.GetDirectoryName(ackExecutablePath) ?? installRoot,
            AckArguments = ackArguments.ToList(),
            VersionFilePath = versionFilePath,
            CurrentVersion = currentVersion.Version,
            TargetVersion = manifest.Version,
            ErrorReportUri = errorUrl,
            HealthCheckUri = healthUrl,
            Mandatory = manifest.Mandatory,
            MaintenanceMode = manifest.MaintenanceMode,
            WaitForProcessId = waitForProcessId,
            Packages = packagesToApply
        };

        var updateExitCode = await ApplyUpdateAsync(plan);
        if (updateExitCode != 0)
        {
            Log.Error("[CLI/updater]" + "업데이트 적용 실패로 ack 기동을 중단합니다. CurrentVersion={0}, TargetVersion={1}", plan.CurrentVersion, plan.TargetVersion);
            return 1;
        }

        return StartProcess(ResolveLaunchCommand(ackExecutablePath), Path.GetDirectoryName(ackExecutablePath) ?? installRoot, ackArguments);
    }

    private static async Task<int> ApplyUpdateAsync(UpdateLaunchPlan plan)
    {
        InitializeLogFile(plan.InstallRoot);
        Log.Information("[CLI/updater]" + "업데이트 계획을 준비했습니다. CurrentVersion={0}, TargetVersion={1}, PackageCount={2}", plan.CurrentVersion, plan.TargetVersion, plan.Packages.Count);

        if (plan.Packages.Count == 0)
        {
            Log.Information("[CLI/updater]" + "적용할 패키지가 없어 업데이트 단계를 종료합니다.");
            return 0;
        }

        if (UpdateVersionComparer.Compare(plan.TargetVersion, plan.CurrentVersion) < 0)
        {
            Log.Warning("[CLI/updater]" + "downgrade 요청이 감지되어 업데이트를 중단합니다. CurrentVersion={0}, TargetVersion={1}", plan.CurrentVersion, plan.TargetVersion);
            return 1;
        }

        var stagingRoot = Path.Combine(InstallLayout.ResolveStagingDirectory(plan.InstallRoot), "apply", DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss"));
        var downloadsRoot = Path.Combine(stagingRoot, "downloads");
        var extractedRoot = Path.Combine(stagingRoot, "extracted");
        var backupRoot = Path.Combine(InstallLayout.ResolveBackupDirectory(plan.InstallRoot), DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss"));

        try
        {
            using var updateLock = UpdateLockHandle.Acquire(plan.InstallRoot);
            Log.Information("[CLI/updater]" + "업데이트 잠금을 획득했습니다. LockFilePath={0}", updateLock.LockFilePath);

            Directory.CreateDirectory(downloadsRoot);
            Directory.CreateDirectory(extractedRoot);
            Directory.CreateDirectory(backupRoot);

            await WaitForProcessExitAsync(plan.WaitForProcessId, TimeSpan.FromSeconds(60));
            var totalPackageSize = plan.Packages.Where(item => item.PackageSize > 0).Sum(item => item.PackageSize);
            var installFootprint = UpdatePathPolicy.MeasureInstallFootprint(plan.InstallRoot);
            var requiredBytes = totalPackageSize * 2 + installFootprint;

            var rootPath = Path.GetPathRoot(plan.InstallRoot) ?? plan.InstallRoot;
            var driveInfo = new DriveInfo(rootPath);
            if (driveInfo.AvailableFreeSpace < requiredBytes)
            {
                throw new InvalidOperationException(
                    $"디스크 여유 공간이 부족합니다. Available={driveInfo.AvailableFreeSpace}, Required={requiredBytes}");
            }

            Log.Information("[CLI/updater]" + "디스크 용량 검사를 통과했습니다. Available={0}, Required={1}", driveInfo.AvailableFreeSpace, requiredBytes);

            var orderedPackages = plan.Packages
                .OrderBy(item => item.Version, Comparer<string>.Create(UpdateVersionComparer.Compare))
                .ToList();

            foreach (var package in orderedPackages)
            {
                await ApplyPackageAsync(plan, package, downloadsRoot, extractedRoot, backupRoot);
            }

            VersionFileStore.Save(plan.VersionFilePath, new InstalledVersionInfo
            {
                Version = plan.TargetVersion,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            Log.Information("[CLI/updater]" + "version.json을 갱신했습니다. VersionFilePath={0}, Version={1}", plan.VersionFilePath, plan.TargetVersion);

            Log.Information("[CLI/updater]" + "업데이트가 완료되었습니다. TargetVersion={0}", plan.TargetVersion);
            return 0;
        }
        catch (Exception exception)
        {
            Log.Error(exception, "[CLI/updater]" + $"업데이트 실패: {exception.Message}");
            if (string.IsNullOrWhiteSpace(plan.ErrorReportUri) == false)
            {
                try
                {
                    using var content = new MultipartFormDataContent();
                    content.Add(new StringContent(exception.Message, Encoding.UTF8), "message");
                    content.Add(new StringContent("updater", Encoding.UTF8), "source");
                    content.Add(new StringContent(plan.TargetVersion, Encoding.UTF8), "version");

                    if (string.IsNullOrWhiteSpace(logFilePath) == false && File.Exists(logFilePath) == true)
                    {
                        var fileContent = new ByteArrayContent(await File.ReadAllBytesAsync(logFilePath));
                        fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
                        content.Add(fileContent, "file", Path.GetFileName(logFilePath));
                    }

                    using var response = await HttpClient.PostAsync(plan.ErrorReportUri, content);
                    response.EnsureSuccessStatusCode();
                    Log.Information("[CLI/updater]" + "배포 서버에 실패 로그를 보고했습니다. ErrorReportUri={0}", plan.ErrorReportUri);
                }
                catch (Exception reportException)
                {
                    Log.Warning("[CLI/updater]" + "실패 로그 보고에 실패했습니다. Message={0}", reportException.Message);
                }
            }
            return 1;
        }
        finally
        {
            try
            {
                if (Directory.Exists(stagingRoot) == true)
                {
                    Directory.Delete(stagingRoot, true);
                }
            }
            catch
            {
            }
        }
    }

    private static async Task<int> StartAckAfterOptionalWaitAsync(string ackExecutablePath, string installRoot, IReadOnlyList<string> ackArguments, int waitForProcessId)
    {
        await WaitForProcessExitAsync(waitForProcessId, TimeSpan.FromSeconds(60));
        return StartProcess(ResolveLaunchCommand(ackExecutablePath), Path.GetDirectoryName(ackExecutablePath) ?? installRoot, ackArguments);
    }

    private static async Task<UpdateManifestDocument> FetchManifestAsync(string manifestUrl)
    {
        if (Uri.TryCreate(manifestUrl, UriKind.Absolute, out var manifestUri) == true
            && (manifestUri.Scheme == Uri.UriSchemeHttp || manifestUri.Scheme == Uri.UriSchemeHttps))
        {
            using var response = await HttpClient.GetAsync(manifestUri);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<UpdateManifestDocument>(json, UpdateJson.DefaultSerializerOptions)
                ?? throw new InvalidOperationException("manifest 역직렬화에 실패했습니다.");
        }

        var resolvedPath = Path.GetFullPath(manifestUrl);
        var jsonText = await File.ReadAllTextAsync(resolvedPath);
        return JsonSerializer.Deserialize<UpdateManifestDocument>(jsonText, UpdateJson.DefaultSerializerOptions)
            ?? throw new InvalidOperationException("manifest 역직렬화에 실패했습니다.");
    }

    private static IReadOnlyList<UpdatePackageDescriptor> NormalizePackages(UpdateManifestDocument manifest)
    {
        if (manifest.Packages.Count > 0)
        {
            return manifest.Packages;
        }

        if (string.IsNullOrWhiteSpace(manifest.PackageUri) == true)
        {
            return [];
        }

        return
        [
            new UpdatePackageDescriptor
            {
                Version = manifest.Version,
                ReleaseDate = manifest.ReleaseDate,
                PackageUri = manifest.PackageUri,
                PackageSha256 = manifest.PackageSha256,
                PackageSize = manifest.PackageSize,
                ReleaseNotes = manifest.ReleaseNotes
            }
        ];
    }

    private static LaunchCommand ResolveLaunchCommand(string executablePath)
    {
        if (File.Exists(executablePath) == true)
        {
            return new LaunchCommand(executablePath, []);
        }

        var directoryPath = Path.GetDirectoryName(executablePath) ?? AppContext.BaseDirectory;
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(executablePath);
        var dllPath = Path.Combine(directoryPath, $"{fileNameWithoutExtension}.dll");
        if (File.Exists(dllPath) == true)
        {
            return new LaunchCommand("dotnet", [dllPath]);
        }

        throw new FileNotFoundException("실행 파일을 찾을 수 없습니다.", executablePath);
    }

    private static int StartProcess(LaunchCommand command, string workingDirectoryPath, IReadOnlyList<string> arguments)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = command.FileName,
                WorkingDirectory = workingDirectoryPath,
                UseShellExecute = false
            };

            foreach (var argument in command.PrefixArguments)
            {
                startInfo.ArgumentList.Add(argument);
            }

            foreach (var argument in arguments)
            {
                startInfo.ArgumentList.Add(argument);
            }

            using var process = Process.Start(startInfo);
            if (process == null)
            {
                Log.Error("[CLI/updater]" + "프로세스 시작에 실패했습니다. FileName={0}", command.FileName);
                return 1;
            }

            Log.Information("[CLI/updater]" + "프로세스를 시작했습니다. FileName={0}, WorkingDirectory={1}, ProcessId={2}, ArgumentCount={3}", command.FileName, workingDirectoryPath, process.Id, startInfo.ArgumentList.Count);

            return 0;
        }
        catch (Exception exception)
        {
            Log.Error(exception, "[CLI/updater]" + $"프로세스 시작 실패: {exception.Message}");
            return 1;
        }
    }
    private static async Task ApplyPackageAsync(UpdateLaunchPlan plan, UpdatePackageDescriptor package, string downloadsRoot, string extractedRoot, string backupRoot)
    {
        Log.Information("[CLI/updater]" + "패키지 적용을 시작합니다. Version={0}, PackageUri={1}", package.Version, package.PackageUri);

        var packageFilePath = await DownloadPackageAsync(plan, package, downloadsRoot);
        ValidatePackage(packageFilePath, package, plan.MaintenanceMode);

        var packageExtractedPath = Path.Combine(extractedRoot, SanitizeFileName(package.Version));
        if (Directory.Exists(packageExtractedPath) == true)
        {
            Directory.Delete(packageExtractedPath, true);
        }

        Directory.CreateDirectory(packageExtractedPath);
        ZipFile.ExtractToDirectory(packageFilePath, packageExtractedPath, true);
        Log.Information("[CLI/updater]" + "패키지 압축 해제가 완료되었습니다. Version={0}, ExtractedPath={1}", package.Version, packageExtractedPath);

        var expectedManifestPath = Path.Combine(packageExtractedPath, $"{Path.GetFileNameWithoutExtension(packageFilePath)}.txt");
        string manifestFilePath;
        if (File.Exists(expectedManifestPath) == true)
        {
            manifestFilePath = expectedManifestPath;
        }
        else
        {
            var candidates = Directory.GetFiles(packageExtractedPath, "*.txt", SearchOption.TopDirectoryOnly);
            if (candidates.Length != 1)
            {
                throw new FileNotFoundException("패키지 manifest 파일을 찾을 수 없습니다.", expectedManifestPath);
            }

            manifestFilePath = candidates[0];
        }

        var entries = PackageManifestParser.Load(manifestFilePath);
        ApplyPackageFiles(plan.InstallRoot, package.Version, packageExtractedPath, entries, backupRoot);
        await RunMigrationIfPresentAsync(plan.InstallRoot, package.Version);
    }

    private static async Task<string> DownloadPackageAsync(UpdateLaunchPlan plan, UpdatePackageDescriptor package, string downloadsRoot)
    {
        string resolvedPackageUri;
        if (Uri.TryCreate(package.PackageUri, UriKind.Absolute, out var absolutePackageUri) == true)
        {
            resolvedPackageUri = absolutePackageUri.ToString();
        }
        else if (Uri.TryCreate(plan.ManifestUri, UriKind.Absolute, out var manifestAbsoluteUri) == true)
        {
            resolvedPackageUri = new Uri(manifestAbsoluteUri, package.PackageUri).ToString();
        }
        else
        {
            var manifestDirectoryPath = Path.GetDirectoryName(Path.GetFullPath(plan.ManifestUri)) ?? AppContext.BaseDirectory;
            resolvedPackageUri = Path.GetFullPath(Path.Combine(manifestDirectoryPath, package.PackageUri));
        }

        string fileName;
        if (Uri.TryCreate(resolvedPackageUri, UriKind.Absolute, out var resolvedAbsoluteUri) == true)
        {
            var resolvedFileName = Path.GetFileName(resolvedAbsoluteUri.LocalPath);
            if (string.IsNullOrWhiteSpace(resolvedFileName) == false)
            {
                fileName = resolvedFileName;
            }
            else
            {
                var localFileName = Path.GetFileName(resolvedPackageUri);
                fileName = string.IsNullOrWhiteSpace(localFileName) == true
                    ? $"deploy-{package.Version}.zip"
                    : localFileName;
            }
        }
        else
        {
            var localFileName = Path.GetFileName(resolvedPackageUri);
            fileName = string.IsNullOrWhiteSpace(localFileName) == true
                ? $"deploy-{package.Version}.zip"
                : localFileName;
        }

        var versionDirectoryPath = Path.Combine(downloadsRoot, SanitizeFileName(package.Version));
        Directory.CreateDirectory(versionDirectoryPath);

        var downloadFilePath = Path.Combine(versionDirectoryPath, fileName);
        if (Uri.TryCreate(resolvedPackageUri, UriKind.Absolute, out var packageUri) == true)
        {
            if (packageUri.Scheme == Uri.UriSchemeHttp || packageUri.Scheme == Uri.UriSchemeHttps)
            {
                using var response = await HttpClient.GetAsync(packageUri, HttpCompletionOption.ResponseHeadersRead);
                response.EnsureSuccessStatusCode();

                await using var responseStream = await response.Content.ReadAsStreamAsync();
                await using var fileStream = new FileStream(downloadFilePath, FileMode.Create, FileAccess.Write, FileShare.None);
                await responseStream.CopyToAsync(fileStream);
            }
            else if (packageUri.Scheme == Uri.UriSchemeFile)
            {
                File.Copy(packageUri.LocalPath, downloadFilePath, true);
            }
            else
            {
                throw new InvalidOperationException($"지원하지 않는 패키지 URI 스킴입니다. Uri={resolvedPackageUri}");
            }
        }
        else
        {
            var sourceFilePath = Path.GetFullPath(resolvedPackageUri);
            File.Copy(sourceFilePath, downloadFilePath, true);
        }

        Log.Information("[CLI/updater]" + "패키지 다운로드가 완료되었습니다. Version={0}, DownloadFilePath={1}", package.Version, downloadFilePath);
        return downloadFilePath;
    }

    private static void ValidatePackage(string packageFilePath, UpdatePackageDescriptor package, bool maintenanceMode)
    {
        if (File.Exists(packageFilePath) == false)
        {
            throw new FileNotFoundException("다운로드된 패키지 파일을 찾을 수 없습니다.", packageFilePath);
        }

        if (package.PackageSize > 0)
        {
            var actualSize = new FileInfo(packageFilePath).Length;
            if (actualSize != package.PackageSize)
            {
                throw new InvalidOperationException($"패키지 크기 검증 실패: expected={package.PackageSize}, actual={actualSize}");
            }
        }

        if (maintenanceMode == true)
        {
            Log.Warning("[CLI/updater]" + "maintenanceMode=true 이므로 SHA-256 검증을 건너뜁니다. Version={0}", package.Version);
            return;
        }

        if (string.IsNullOrWhiteSpace(package.PackageSha256) == true)
        {
            throw new InvalidOperationException($"패키지 SHA-256 값이 없습니다. Version={package.Version}");
        }

        using var hashStream = File.OpenRead(packageFilePath);
        var actualHash = Convert.ToHexString(SHA256.HashData(hashStream)).ToLowerInvariant();
        if (string.Equals(actualHash, package.PackageSha256, StringComparison.OrdinalIgnoreCase) == false)
        {
            throw new InvalidOperationException($"패키지 SHA-256 검증 실패: Version={package.Version}");
        }

        Log.Information("[CLI/updater]" + "패키지 SHA-256 검증이 완료되었습니다. Version={0}, Sha256={1}", package.Version, actualHash);
    }

    private static void ApplyPackageFiles(string installRoot, string packageVersion, string extractedPath, IReadOnlyList<PackageManifestEntry> entries, string backupRoot)
    {
        var copyEntries = entries.Where(item => item.ShouldCopy == true).ToList();
        var deleteEntries = entries.Where(item => item.ShouldCopy == false).ToList();

        int copiedCount = 0;
        int deletedCount = 0;
        int skippedCount = 0;

        foreach (var entry in copyEntries)
        {
            if (UpdatePathPolicy.TryResolveInstallPath(installRoot, entry.RelativePath, out var targetFilePath) == false)
            {
                skippedCount++;
                Log.Warning("[CLI/updater]" + "허용되지 않은 경로를 건너뜁니다. Version={0}, Path={1}", packageVersion, entry.RelativePath);
                continue;
            }

            BackupFileIfPresent(targetFilePath, backupRoot, packageVersion, entry.RelativePath);

            var sourceFilePath = Path.Combine(extractedPath, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(sourceFilePath) == false)
            {
                throw new FileNotFoundException("패키지에 대상 파일이 없습니다.", sourceFilePath);
            }

            Directory.CreateDirectory(Path.GetDirectoryName(targetFilePath) ?? installRoot);
            File.Copy(sourceFilePath, targetFilePath, true);
            copiedCount++;
        }

        foreach (var entry in deleteEntries)
        {
            if (UpdatePathPolicy.TryResolveInstallPath(installRoot, entry.RelativePath, out var targetFilePath) == false)
            {
                skippedCount++;
                Log.Warning("[CLI/updater]" + "허용되지 않은 삭제 경로를 건너뜁니다. Version={0}, Path={1}", packageVersion, entry.RelativePath);
                continue;
            }

            BackupFileIfPresent(targetFilePath, backupRoot, packageVersion, entry.RelativePath);

            if (File.Exists(targetFilePath) == true)
            {
                File.Delete(targetFilePath);
                deletedCount++;
                TryDeleteEmptyParentDirectories(targetFilePath, installRoot);
            }
        }

        Log.Information("[CLI/updater]" + "패키지 파일 적용이 완료되었습니다. Version={0}, CopiedCount={1}, DeletedCount={2}, SkippedCount={3}", packageVersion, copiedCount, deletedCount, skippedCount);
    }

    private static void BackupFileIfPresent(string targetFilePath, string backupRoot, string packageVersion, string relativePath)
    {
        if (File.Exists(targetFilePath) == false)
        {
            return;
        }

        var backupFilePath = Path.Combine(
            backupRoot,
            SanitizeFileName(packageVersion),
            relativePath.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(backupFilePath) ?? backupRoot);
        File.Copy(targetFilePath, backupFilePath, true);
    }

    private static async Task RunMigrationIfPresentAsync(string installRoot, string packageVersion)
    {
        var relativeCandidates = new List<string>();
        if (OperatingSystem.IsWindows() == true)
        {
            relativeCandidates.Add(Path.Combine("tools", "migrations", packageVersion, "migration.cmd"));
            relativeCandidates.Add(Path.Combine("tools", "migrations", packageVersion, "migration.bat"));
            relativeCandidates.Add(Path.Combine("tools", "migrations", packageVersion, "migration.ps1"));
            relativeCandidates.Add(Path.Combine("tools", "migrations", $"{packageVersion}.cmd"));
            relativeCandidates.Add(Path.Combine("tools", "migrations", $"{packageVersion}.bat"));
            relativeCandidates.Add(Path.Combine("tools", "migrations", $"{packageVersion}.ps1"));
        }
        else
        {
            relativeCandidates.Add(Path.Combine("tools", "migrations", packageVersion, "migration.sh"));
            relativeCandidates.Add(Path.Combine("tools", "migrations", packageVersion, "migration.ps1"));
            relativeCandidates.Add(Path.Combine("tools", "migrations", $"{packageVersion}.sh"));
            relativeCandidates.Add(Path.Combine("tools", "migrations", $"{packageVersion}.ps1"));
        }

        string? scriptPath = null;
        foreach (var relativeCandidate in relativeCandidates)
        {
            var candidatePath = Path.Combine(installRoot, relativeCandidate);
            if (File.Exists(candidatePath) == true)
            {
                scriptPath = candidatePath;
                break;
            }
        }

        if (string.IsNullOrWhiteSpace(scriptPath) == true)
        {
            Log.Information("[CLI/updater]" + "실행할 마이그레이션 스크립트가 없습니다. Version={0}", packageVersion);
            return;
        }

        var extension = Path.GetExtension(scriptPath).ToLowerInvariant();
        ProcessStartInfo startInfo;
        if (extension == ".ps1")
        {
            startInfo = new ProcessStartInfo
            {
                FileName = OperatingSystem.IsWindows() == true ? "powershell" : "pwsh",
                WorkingDirectory = installRoot,
                UseShellExecute = false,
                ArgumentList =
                {
                    "-NoLogo",
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    scriptPath
                }
            };
        }
        else if (extension == ".cmd" || extension == ".bat")
        {
            startInfo = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                WorkingDirectory = installRoot,
                UseShellExecute = false,
                ArgumentList =
                {
                    "/c",
                    scriptPath
                }
            };
        }
        else
        {
            startInfo = new ProcessStartInfo
            {
                FileName = extension == ".sh" ? "/bin/bash" : scriptPath,
                WorkingDirectory = installRoot,
                UseShellExecute = false,
                ArgumentList =
                {
                    scriptPath
                }
            };
        }

        startInfo.RedirectStandardOutput = true;
        startInfo.RedirectStandardError = true;

        using var process = new Process
        {
            StartInfo = startInfo
        };

        process.Start();
        var standardOutput = await process.StandardOutput.ReadToEndAsync();
        var standardError = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        if (string.IsNullOrWhiteSpace(standardOutput) == false)
        {
            Log.Information("[CLI/updater]" + "마이그레이션 표준 출력. Version={0}{1}{2}", packageVersion, Environment.NewLine, standardOutput.Trim());
        }

        if (string.IsNullOrWhiteSpace(standardError) == false)
        {
            Log.Warning("[CLI/updater]" + "마이그레이션 표준 오류. Version={0}{1}{2}", packageVersion, Environment.NewLine, standardError.Trim());
        }

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"마이그레이션 스크립트가 실패했습니다. Version={packageVersion}, ExitCode={process.ExitCode}");
        }

        Log.Information("[CLI/updater]" + "마이그레이션 실행이 완료되었습니다. Version={0}, ScriptPath={1}", packageVersion, scriptPath);
    }

    private static async Task WaitForProcessExitAsync(int processId, TimeSpan timeout)
    {
        if (processId <= 0)
        {
            return;
        }

        try
        {
            using var process = Process.GetProcessById(processId);
            if (process.HasExited == true)
            {
                return;
            }

            Log.Information("[CLI/updater]" + "대상 프로세스 종료를 기다립니다. ProcessId={0}", processId);
            if (process.WaitForExit((int)timeout.TotalMilliseconds) == false)
            {
                throw new TimeoutException($"프로세스 종료 대기 시간 초과: pid={processId}");
            }

            await Task.CompletedTask;
        }
        catch (ArgumentException)
        {
            await Task.CompletedTask;
        }
    }

    private static void TryDeleteEmptyParentDirectories(string filePath, string installRoot)
    {
        var currentDirectory = Path.GetDirectoryName(filePath);
        var stopDirectory = Path.GetFullPath(installRoot);

        while (string.IsNullOrWhiteSpace(currentDirectory) == false
            && string.Equals(Path.GetFullPath(currentDirectory), stopDirectory, StringComparison.OrdinalIgnoreCase) == false)
        {
            if (Directory.Exists(currentDirectory) == false || Directory.EnumerateFileSystemEntries(currentDirectory).Any() == true)
            {
                break;
            }

            Directory.Delete(currentDirectory);
            currentDirectory = Path.GetDirectoryName(currentDirectory);
        }
    }

    private static string SanitizeFileName(string value)
    {
        var invalidFileNameChars = Path.GetInvalidFileNameChars();
        var buffer = value.Select(character => invalidFileNameChars.Contains(character) ? '_' : character).ToArray();
        return new string(buffer);
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        return values.FirstOrDefault(item => string.IsNullOrWhiteSpace(item) == false)?.Trim();
    }

    private static void InitializeLogFile(string installRoot)
    {
        var logDirectoryPath = InstallLayout.ResolveUpdateLogDirectory(installRoot);
        Directory.CreateDirectory(logDirectoryPath);
        logFilePath = Path.Combine(logDirectoryPath, "updater.log");

        lock (LogSyncRoot)
        {
            if (logFileConfigured == false)
            {
                Log.Logger = new LoggerConfiguration()
                    .MinimumLevel.Information()
                    .WriteTo.Console()
                    .WriteTo.File(
                        path: logFilePath,
                        rollingInterval: RollingInterval.Day,
                        shared: true)
                    .CreateLogger();
                logFileConfigured = true;
            }
        }

        Log.Information("[CLI/updater]" + "updater 로그를 초기화했습니다. LogFilePath={0}", logFilePath);
    }

    private sealed record LaunchCommand(string FileName, IReadOnlyList<string> PrefixArguments);
}


