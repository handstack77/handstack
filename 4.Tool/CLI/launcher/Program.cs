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

using launcher.Updates;

namespace launcher;

internal static class Program
{
    private static readonly HttpClient HttpClient = new HttpClient
    {
        Timeout = TimeSpan.FromMinutes(5)
    };

    private static readonly object LogSyncRoot = new object();
    private static readonly IConfiguration Configuration = BuildConfiguration();
    private static string? logFilePath;

    public static async Task<int> Main(string[] args)
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
            Description = "HandStack 설치 루트 경로입니다. 미지정 시 launcher 위치 기준으로 계산합니다."
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

        var rootCommand = new RootCommand("HandStack launcher")
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
                WriteError($"launcher 처리 실패: {exception.Message}", exception);
                exitCode = 1;
            }

            Environment.ExitCode = exitCode;
        });

        var parse = rootCommand.Parse(args);
        if (parse.Errors.Count > 0)
        {
            foreach (var error in parse.Errors)
            {
                WriteError(error.Message);
            }

            return 1;
        }

        return await parse.InvokeAsync();
    }

    private static async Task<int> RunAsync(
        string? manifestUrlOption,
        string? errorUrlOption,
        string? installRootOption,
        string? ackPathOption,
        string? healthUrlOption,
        string? initialVersionOption,
        int? waitForProcessIdOption,
        IReadOnlyList<string> ackArguments)
    {
        var installRoot = ResolveInstallRoot(installRootOption);
        InitializeLogFile(installRoot);

        var manifestUrl = FirstNonEmpty(manifestUrlOption, Configuration["HandstackUpdateManifestUrl"]);
        var errorUrl = FirstNonEmpty(errorUrlOption, Configuration["HandstackUpdateErrorUrl"]);
        var ackExecutablePath = ResolveAckExecutablePath(installRoot, ackPathOption);
        var versionFilePath = InstallLayout.ResolveVersionFilePath(ackExecutablePath);
        var currentVersion = VersionFileStore.Ensure(versionFilePath, initialVersionOption);
        var healthUrl = FirstNonEmpty(healthUrlOption, BuildDefaultHealthUrl(ackArguments));
        var waitForProcessId = waitForProcessIdOption ?? 0;

        WriteInformation(
            "launcher 시작. InstallRoot={0}, AckExecutablePath={1}, CurrentVersion={2}, AckArgumentCount={3}, WaitForProcessId={4}",
            installRoot,
            ackExecutablePath,
            currentVersion.Version,
            ackArguments.Count,
            waitForProcessId);

        if (File.Exists(ackExecutablePath) == false)
        {
            WriteError("ack 실행 파일을 찾을 수 없습니다. AckExecutablePath={0}", ackExecutablePath);
            return 1;
        }

        if (string.IsNullOrWhiteSpace(manifestUrl) == true)
        {
            WriteWarning("업데이트 manifest 주소가 없어 업데이트 확인을 건너뜁니다.");
            return await StartAckAfterOptionalWaitAsync(ackExecutablePath, installRoot, ackArguments, waitForProcessId);
        }

        UpdateManifestDocument manifest;
        try
        {
            manifest = await FetchManifestAsync(manifestUrl);
        }
        catch (Exception exception)
        {
            WriteError($"manifest 조회 실패: {exception.Message}", exception);
            return await StartAckAfterOptionalWaitAsync(ackExecutablePath, installRoot, ackArguments, waitForProcessId);
        }

        var availablePackages = NormalizePackages(manifest)
            .OrderBy(item => item.Version, Comparer<string>.Create(UpdateVersionComparer.Compare))
            .ToList();

        if (availablePackages.Count == 0)
        {
            WriteWarning("manifest에 적용 가능한 패키지 목록이 없습니다. ManifestUrl={0}", manifestUrl);
            return await StartAckAfterOptionalWaitAsync(ackExecutablePath, installRoot, ackArguments, waitForProcessId);
        }

        if (UpdateVersionComparer.Compare(manifest.Version, currentVersion.Version) < 0)
        {
            WriteWarning(
                "서버 최신 버전이 현재 버전보다 낮아 업데이트를 건너뜁니다. CurrentVersion={0}, ServerVersion={1}",
                currentVersion.Version,
                manifest.Version);
            return await StartAckAfterOptionalWaitAsync(ackExecutablePath, installRoot, ackArguments, waitForProcessId);
        }

        var packagesToApply = availablePackages
            .Where(item => UpdateVersionComparer.Compare(item.Version, currentVersion.Version) > 0)
            .OrderBy(item => item.Version, Comparer<string>.Create(UpdateVersionComparer.Compare))
            .ToList();

        if (packagesToApply.Count == 0)
        {
            WriteInformation("최신 버전이 이미 적용되어 있습니다. CurrentVersion={0}", currentVersion.Version);
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
            WriteError(
                "업데이트 적용 실패로 ack 기동을 중단합니다. CurrentVersion={0}, TargetVersion={1}",
                plan.CurrentVersion,
                plan.TargetVersion);
            return 1;
        }

        return StartProcess(ResolveLaunchCommand(ackExecutablePath), Path.GetDirectoryName(ackExecutablePath) ?? installRoot, ackArguments);
    }

    private static async Task<int> ApplyUpdateAsync(UpdateLaunchPlan plan)
    {
        InitializeLogFile(plan.InstallRoot);
        WriteInformation(
            "업데이트 계획을 준비했습니다. CurrentVersion={0}, TargetVersion={1}, PackageCount={2}",
            plan.CurrentVersion,
            plan.TargetVersion,
            plan.Packages.Count);

        if (plan.Packages.Count == 0)
        {
            WriteInformation("적용할 패키지가 없어 업데이트 단계를 종료합니다.");
            return 0;
        }

        if (UpdateVersionComparer.Compare(plan.TargetVersion, plan.CurrentVersion) < 0)
        {
            WriteWarning(
                "downgrade 요청이 감지되어 업데이트를 중단합니다. CurrentVersion={0}, TargetVersion={1}",
                plan.CurrentVersion,
                plan.TargetVersion);
            return 1;
        }

        var stagingRoot = Path.Combine(InstallLayout.ResolveStagingDirectory(plan.InstallRoot), "apply", DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss"));
        var downloadsRoot = Path.Combine(stagingRoot, "downloads");
        var extractedRoot = Path.Combine(stagingRoot, "extracted");
        var backupRoot = Path.Combine(InstallLayout.ResolveBackupDirectory(plan.InstallRoot), DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss"));

        try
        {
            using var updateLock = UpdateLockHandle.Acquire(plan.InstallRoot);
            WriteInformation("업데이트 잠금을 획득했습니다. LockFilePath={0}", updateLock.LockFilePath);

            Directory.CreateDirectory(downloadsRoot);
            Directory.CreateDirectory(extractedRoot);
            Directory.CreateDirectory(backupRoot);

            await WaitForProcessExitAsync(plan.WaitForProcessId, TimeSpan.FromSeconds(60));
            EnsureDiskCapacity(plan);

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
            WriteInformation("version.json을 갱신했습니다. VersionFilePath={0}, Version={1}", plan.VersionFilePath, plan.TargetVersion);

            WriteInformation("업데이트가 완료되었습니다. TargetVersion={0}", plan.TargetVersion);
            return 0;
        }
        catch (Exception exception)
        {
            WriteError($"업데이트 실패: {exception.Message}", exception);
            await ReportFailureAsync(plan, exception);
            return 1;
        }
        finally
        {
            TryDeleteDirectory(stagingRoot);
        }
    }

    private static async Task<int> StartAckAfterOptionalWaitAsync(
        string ackExecutablePath,
        string installRoot,
        IReadOnlyList<string> ackArguments,
        int waitForProcessId)
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

    private static string ResolveInstallRoot(string? installRootOption)
    {
        if (string.IsNullOrWhiteSpace(installRootOption) == false)
        {
            return Path.GetFullPath(installRootOption);
        }

        return InstallLayout.ResolveInstallRootFromToolDirectory(AppContext.BaseDirectory);
    }

    private static string ResolveAckExecutablePath(string installRoot, string? ackPathOption)
    {
        if (string.IsNullOrWhiteSpace(ackPathOption) == true)
        {
            return InstallLayout.ResolveDefaultAckExecutablePath(installRoot);
        }

        return Path.IsPathRooted(ackPathOption) == true
            ? Path.GetFullPath(ackPathOption)
            : Path.GetFullPath(Path.Combine(installRoot, ackPathOption));
    }

    private static IConfiguration BuildConfiguration()
    {
        var appSettingsFilePath = Path.Combine(AppContext.BaseDirectory, "appsettings.json");
        return new ConfigurationBuilder()
            .AddJsonFile(appSettingsFilePath, optional: true, reloadOnChange: false)
            .Build();
    }

    private static string? BuildDefaultHealthUrl(IReadOnlyList<string> ackArguments)
    {
        const int defaultPort = 8421;
        var port = defaultPort;
        for (int index = 0; index < ackArguments.Count; index++)
        {
            var argument = ackArguments[index];
            if (string.Equals(argument, "--port", StringComparison.OrdinalIgnoreCase) == true && index + 1 < ackArguments.Count)
            {
                if (int.TryParse(ackArguments[index + 1], out var parsedPort) == true)
                {
                    port = parsedPort;
                }

                break;
            }

            if (argument.StartsWith("--port=", StringComparison.OrdinalIgnoreCase) == true
                || argument.StartsWith("--port:", StringComparison.OrdinalIgnoreCase) == true)
            {
                var tokens = argument.Split(['=', ':'], 2, StringSplitOptions.RemoveEmptyEntries);
                if (tokens.Length == 2 && int.TryParse(tokens[1], out var parsedPort) == true)
                {
                    port = parsedPort;
                }

                break;
            }
        }

        return $"http://localhost:{port}/checkip";
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
                WriteError("프로세스 시작에 실패했습니다. FileName={0}", command.FileName);
                return 1;
            }

            WriteInformation(
                "프로세스를 시작했습니다. FileName={0}, WorkingDirectory={1}, ProcessId={2}, ArgumentCount={3}",
                command.FileName,
                workingDirectoryPath,
                process.Id,
                startInfo.ArgumentList.Count);

            return 0;
        }
        catch (Exception exception)
        {
            WriteError($"프로세스 시작 실패: {exception.Message}", exception);
            return 1;
        }
    }
    private static async Task ApplyPackageAsync(
        UpdateLaunchPlan plan,
        UpdatePackageDescriptor package,
        string downloadsRoot,
        string extractedRoot,
        string backupRoot)
    {
        WriteInformation(
            "패키지 적용을 시작합니다. Version={0}, PackageUri={1}",
            package.Version,
            package.PackageUri);

        var packageFilePath = await DownloadPackageAsync(plan, package, downloadsRoot);
        ValidatePackage(packageFilePath, package, plan.MaintenanceMode);

        var packageExtractedPath = Path.Combine(extractedRoot, SanitizeFileName(package.Version));
        if (Directory.Exists(packageExtractedPath) == true)
        {
            Directory.Delete(packageExtractedPath, true);
        }

        Directory.CreateDirectory(packageExtractedPath);
        ZipFile.ExtractToDirectory(packageFilePath, packageExtractedPath, true);
        WriteInformation("패키지 압축 해제가 완료되었습니다. Version={0}, ExtractedPath={1}", package.Version, packageExtractedPath);

        var manifestFilePath = ResolvePackageManifestFilePath(packageExtractedPath, packageFilePath);
        var entries = PackageManifestParser.Load(manifestFilePath);
        ApplyPackageFiles(plan.InstallRoot, package.Version, packageExtractedPath, entries, backupRoot);
        await RunMigrationIfPresentAsync(plan.InstallRoot, package.Version);
    }

    private static async Task<string> DownloadPackageAsync(UpdateLaunchPlan plan, UpdatePackageDescriptor package, string downloadsRoot)
    {
        var resolvedPackageUri = ResolvePackageUri(plan.ManifestUri, package.PackageUri);
        var fileName = ResolvePackageFileName(resolvedPackageUri, package.Version);
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

        WriteInformation("패키지 다운로드가 완료되었습니다. Version={0}, DownloadFilePath={1}", package.Version, downloadFilePath);
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
            WriteWarning("maintenanceMode=true 이므로 SHA-256 검증을 건너뜁니다. Version={0}", package.Version);
            return;
        }

        if (string.IsNullOrWhiteSpace(package.PackageSha256) == true)
        {
            throw new InvalidOperationException($"패키지 SHA-256 값이 없습니다. Version={package.Version}");
        }

        var actualHash = CalculateSha256(packageFilePath);
        if (string.Equals(actualHash, package.PackageSha256, StringComparison.OrdinalIgnoreCase) == false)
        {
            throw new InvalidOperationException($"패키지 SHA-256 검증 실패: Version={package.Version}");
        }

        WriteInformation("패키지 SHA-256 검증이 완료되었습니다. Version={0}, Sha256={1}", package.Version, actualHash);
    }

    private static string ResolvePackageManifestFilePath(string extractedPath, string packageFilePath)
    {
        var expectedManifestPath = Path.Combine(extractedPath, $"{Path.GetFileNameWithoutExtension(packageFilePath)}.txt");
        if (File.Exists(expectedManifestPath) == true)
        {
            return expectedManifestPath;
        }

        var candidates = Directory.GetFiles(extractedPath, "*.txt", SearchOption.TopDirectoryOnly);
        if (candidates.Length == 1)
        {
            return candidates[0];
        }

        throw new FileNotFoundException("패키지 manifest 파일을 찾을 수 없습니다.", expectedManifestPath);
    }

    private static void ApplyPackageFiles(
        string installRoot,
        string packageVersion,
        string extractedPath,
        IReadOnlyList<PackageManifestEntry> entries,
        string backupRoot)
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
                WriteWarning("허용되지 않은 경로를 건너뜁니다. Version={0}, Path={1}", packageVersion, entry.RelativePath);
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
                WriteWarning("허용되지 않은 삭제 경로를 건너뜁니다. Version={0}, Path={1}", packageVersion, entry.RelativePath);
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

        WriteInformation(
            "패키지 파일 적용이 완료되었습니다. Version={0}, CopiedCount={1}, DeletedCount={2}, SkippedCount={3}",
            packageVersion,
            copiedCount,
            deletedCount,
            skippedCount);
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
        var scriptPath = ResolveMigrationScriptPath(installRoot, packageVersion);
        if (string.IsNullOrWhiteSpace(scriptPath) == true)
        {
            WriteInformation("실행할 마이그레이션 스크립트가 없습니다. Version={0}", packageVersion);
            return;
        }

        var startInfo = BuildMigrationStartInfo(scriptPath, installRoot);
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
            WriteInformation("마이그레이션 표준 출력. Version={0}{1}{2}", packageVersion, Environment.NewLine, standardOutput.Trim());
        }

        if (string.IsNullOrWhiteSpace(standardError) == false)
        {
            WriteWarning("마이그레이션 표준 오류. Version={0}{1}{2}", packageVersion, Environment.NewLine, standardError.Trim());
        }

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"마이그레이션 스크립트가 실패했습니다. Version={packageVersion}, ExitCode={process.ExitCode}");
        }

        WriteInformation("마이그레이션 실행이 완료되었습니다. Version={0}, ScriptPath={1}", packageVersion, scriptPath);
    }

    private static string? ResolveMigrationScriptPath(string installRoot, string packageVersion)
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

        foreach (var relativeCandidate in relativeCandidates)
        {
            var candidatePath = Path.Combine(installRoot, relativeCandidate);
            if (File.Exists(candidatePath) == true)
            {
                return candidatePath;
            }
        }

        return null;
    }

    private static ProcessStartInfo BuildMigrationStartInfo(string scriptPath, string workingDirectoryPath)
    {
        var extension = Path.GetExtension(scriptPath).ToLowerInvariant();
        if (extension == ".ps1")
        {
            return new ProcessStartInfo
            {
                FileName = OperatingSystem.IsWindows() == true ? "powershell" : "pwsh",
                WorkingDirectory = workingDirectoryPath,
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

        if (extension == ".cmd" || extension == ".bat")
        {
            return new ProcessStartInfo
            {
                FileName = "cmd.exe",
                WorkingDirectory = workingDirectoryPath,
                UseShellExecute = false,
                ArgumentList =
                {
                    "/c",
                    scriptPath
                }
            };
        }

        return new ProcessStartInfo
        {
            FileName = extension == ".sh" ? "/bin/bash" : scriptPath,
            WorkingDirectory = workingDirectoryPath,
            UseShellExecute = false,
            ArgumentList =
            {
                scriptPath
            }
        };
    }

    private static void EnsureDiskCapacity(UpdateLaunchPlan plan)
    {
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

        WriteInformation(
            "디스크 용량 검사를 통과했습니다. Available={0}, Required={1}",
            driveInfo.AvailableFreeSpace,
            requiredBytes);
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

            WriteInformation("대상 프로세스 종료를 기다립니다. ProcessId={0}", processId);
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

    private static async Task ReportFailureAsync(UpdateLaunchPlan plan, Exception exception)
    {
        if (string.IsNullOrWhiteSpace(plan.ErrorReportUri) == true)
        {
            return;
        }

        try
        {
            using var content = new MultipartFormDataContent();
            content.Add(new StringContent(exception.Message, Encoding.UTF8), "message");
            content.Add(new StringContent("launcher", Encoding.UTF8), "source");
            content.Add(new StringContent(plan.TargetVersion, Encoding.UTF8), "version");

            if (string.IsNullOrWhiteSpace(logFilePath) == false && File.Exists(logFilePath) == true)
            {
                var fileContent = new ByteArrayContent(await File.ReadAllBytesAsync(logFilePath));
                fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
                content.Add(fileContent, "file", Path.GetFileName(logFilePath));
            }

            using var response = await HttpClient.PostAsync(plan.ErrorReportUri, content);
            response.EnsureSuccessStatusCode();
            WriteInformation("배포 서버에 실패 로그를 보고했습니다. ErrorReportUri={0}", plan.ErrorReportUri);
        }
        catch (Exception reportException)
        {
            WriteWarning("실패 로그 보고에 실패했습니다. Message={0}", reportException.Message);
        }
    }

    private static string ResolvePackageUri(string manifestUri, string packageUri)
    {
        if (Uri.TryCreate(packageUri, UriKind.Absolute, out var absoluteUri) == true)
        {
            return absoluteUri.ToString();
        }

        if (Uri.TryCreate(manifestUri, UriKind.Absolute, out var manifestAbsoluteUri) == true)
        {
            return new Uri(manifestAbsoluteUri, packageUri).ToString();
        }

        var manifestDirectoryPath = Path.GetDirectoryName(Path.GetFullPath(manifestUri)) ?? AppContext.BaseDirectory;
        return Path.GetFullPath(Path.Combine(manifestDirectoryPath, packageUri));
    }

    private static string ResolvePackageFileName(string packageUri, string packageVersion)
    {
        if (Uri.TryCreate(packageUri, UriKind.Absolute, out var absoluteUri) == true)
        {
            var fileName = Path.GetFileName(absoluteUri.LocalPath);
            if (string.IsNullOrWhiteSpace(fileName) == false)
            {
                return fileName;
            }
        }

        var localFileName = Path.GetFileName(packageUri);
        return string.IsNullOrWhiteSpace(localFileName) == true
            ? $"deploy-{packageVersion}.zip"
            : localFileName;
    }

    private static string CalculateSha256(string filePath)
    {
        using var stream = File.OpenRead(filePath);
        var hash = SHA256.HashData(stream);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static void TryDeleteDirectory(string directoryPath)
    {
        try
        {
            if (Directory.Exists(directoryPath) == true)
            {
                Directory.Delete(directoryPath, true);
            }
        }
        catch
        {
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
        logFilePath = Path.Combine(logDirectoryPath, "launcher.log");
        WriteInformation("launcher 로그를 초기화했습니다. LogFilePath={0}", logFilePath);
    }

    private static void WriteInformation(string format, params object[] values)
    {
        WriteLog("INF", string.Format(format, values));
    }

    private static void WriteWarning(string format, params object[] values)
    {
        WriteLog("WRN", string.Format(format, values));
    }

    private static void WriteError(string format, params object[] values)
    {
        WriteLog("ERR", string.Format(format, values));
    }

    private static void WriteError(string message, Exception exception)
    {
        WriteLog("ERR", $"{message}{Environment.NewLine}{exception}");
    }

    private static void WriteLog(string level, string message)
    {
        var line = $"[{DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss} {level}] {message}";
        lock (LogSyncRoot)
        {
            Console.WriteLine(line);

            if (string.IsNullOrWhiteSpace(logFilePath) == false)
            {
                File.AppendAllText(logFilePath!, line + Environment.NewLine, Encoding.UTF8);
            }
        }
    }

    private sealed record LaunchCommand(string FileName, IReadOnlyList<string> PrefixArguments);
}


