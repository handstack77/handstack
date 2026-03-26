using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace updater
{
    public sealed class Program
    {
        private static readonly JsonSerializerOptions JsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
        private static readonly object LogSyncRoot = new object();
        private static string? logFilePath;

        public static async Task<int> Main(string[] args)
        {
            var manifestOption = new Option<FileInfo?>("--manifest")
            {
                Description = "ack가 생성한 업데이트 manifest 파일 경로입니다."
            };

            var rootCommand = new RootCommand("HandStack update applier")
            {
                manifestOption
            };

            rootCommand.SetAction(async parseResult =>
            {
                var manifestFile = parseResult.GetValue(manifestOption);
                if (manifestFile == null || manifestFile.Exists == false)
                {
                    WriteError("manifest 파일 확인 필요");
                    Environment.ExitCode = 1;
                    return;
                }

                Environment.ExitCode = await ApplyUpdateAsync(manifestFile.FullName);
            });

            ParseResult parseResult = rootCommand.Parse(args);
            foreach (var parseError in parseResult.Errors)
            {
                WriteError(parseError.Message);
            }

            if (parseResult.Errors.Count > 0)
            {
                return 1;
            }

            return await parseResult.InvokeAsync();
        }

        private static async Task<int> ApplyUpdateAsync(string manifestFilePath)
        {
            PendingUpdateManifest manifest;
            try
            {
                manifest = LoadManifest(manifestFilePath);
            }
            catch (Exception exception)
            {
                WriteError($"manifest 읽기 실패: {exception.Message}", exception);
                return 1;
            }

            InitializeLogFile(manifest.InstallRoot, manifest.ReleaseId);
            WriteInformation(
                "업데이트 manifest를 로드했습니다. ManifestFilePath={0}, ReleaseId={1}, PackageCount={2}, WaitForProcessId={3}",
                manifestFilePath,
                manifest.ReleaseId,
                manifest.Packages.Count,
                manifest.WaitForProcessId);

            if (manifest.Packages.Count == 0)
            {
                WriteInformation("적용할 패키지가 없습니다.");
                return 0;
            }

            var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss");
            var stagingRoot = Path.Combine(manifest.InstallRoot, "update", "staging", $"{SanitizeFileName(manifest.ReleaseId)}-{timestamp}");
            var backupRoot = Path.Combine(manifest.BackupRoot, $"{SanitizeFileName(manifest.ReleaseId)}-{timestamp}");
            var appliedPackages = new List<AppliedPackageContext>();

            try
            {
                WriteInformation("ack 프로세스 종료를 기다립니다. WaitForProcessId={0}", manifest.WaitForProcessId);
                await WaitForProcessExitAsync(manifest.WaitForProcessId, TimeSpan.FromMinutes(2));
                WriteInformation("ack 프로세스 종료 대기를 마쳤습니다. WaitForProcessId={0}", manifest.WaitForProcessId);

                foreach (var package in manifest.Packages)
                {
                    WriteInformation(
                        "패키지 검증 및 staging을 시작합니다. Target={0}, Version={1}, PackageFilePath={2}",
                        package.Target,
                        package.Version,
                        package.PackageFilePath);
                    ValidatePackage(package);
                    var packageStagePath = Path.Combine(stagingRoot, SanitizeFileName(package.Target));
                    Directory.CreateDirectory(packageStagePath);
                    ZipFile.ExtractToDirectory(package.PackageFilePath, packageStagePath, true);
                    WriteInformation(
                        "패키지 staging이 완료되었습니다. Target={0}, StagePath={1}",
                        package.Target,
                        packageStagePath);
                }

                foreach (var package in manifest.Packages)
                {
                    var packageStagePath = Path.Combine(stagingRoot, SanitizeFileName(package.Target));
                    var backupTargetPath = Path.Combine(backupRoot, SanitizeFileName(package.Target));
                    var targetExisted = Directory.Exists(package.TargetPath);

                    WriteInformation(
                        "패키지 적용을 시작합니다. Target={0}, TargetPath={1}, BackupPath={2}, TargetExisted={3}",
                        package.Target,
                        package.TargetPath,
                        backupTargetPath,
                        targetExisted);

                    if (targetExisted == true)
                    {
                        CopyDirectory(package.TargetPath, backupTargetPath);
                        WriteInformation("기존 대상 백업이 완료되었습니다. Target={0}, BackupPath={1}", package.Target, backupTargetPath);
                    }

                    if (Directory.Exists(package.TargetPath) == true)
                    {
                        Directory.Delete(package.TargetPath, true);
                    }

                    CopyDirectory(packageStagePath, package.TargetPath);
                    WriteInformation("패키지 적용이 완료되었습니다. Target={0}, TargetPath={1}", package.Target, package.TargetPath);
                    appliedPackages.Add(new AppliedPackageContext
                    {
                        TargetPath = package.TargetPath,
                        BackupPath = backupTargetPath,
                        TargetExisted = targetExisted
                    });
                }

                var state = UpdateStateStore.Load(manifest.StateFilePath);
                state.LastStatus = "Applied";
                state.LastErrorMessage = "";
                state.LastAppliedReleaseId = manifest.ReleaseId;
                state.LastAppliedAtUtc = DateTimeOffset.UtcNow;
                state.LastAttemptedReleaseId = manifest.ReleaseId;
                state.LastAttemptedAtUtc = DateTimeOffset.UtcNow;
                state.LastPackages = manifest.Packages.Select(item => new UpdateStatePackage
                {
                    Target = item.Target,
                    Version = item.Version
                }).ToList();

                WriteInformation("업데이트 상태 파일을 저장합니다. StateFilePath={0}, Status={1}", manifest.StateFilePath, state.LastStatus);
                var restartStarted = StartRestartProcess(manifest);
                if (restartStarted == false)
                {
                    state.LastErrorMessage = "업데이트 적용은 완료되었지만 ack 재시작에 실패했습니다.";
                    WriteWarning("업데이트 적용은 완료되었지만 ack 재시작에 실패했습니다. RestartExecutablePath={0}", manifest.RestartExecutablePath);
                }
                else
                {
                    WriteInformation(
                        "ack 재시작을 요청했습니다. RestartExecutablePath={0}, RestartWorkingDirectory={1}, ArgumentCount={2}",
                        manifest.RestartExecutablePath,
                        manifest.RestartWorkingDirectory,
                        manifest.RestartArguments.Count);
                }

                UpdateStateStore.Save(manifest.StateFilePath, state);
                WriteInformation("업데이트 적용이 완료되었습니다. ReleaseId={0}, FinalStatus={1}", manifest.ReleaseId, state.LastStatus);
                return restartStarted == true ? 0 : 2;
            }
            catch (Exception exception)
            {
                WriteError($"업데이트 적용 실패: {exception.Message}", exception);
                Rollback(appliedPackages);

                var failedState = UpdateStateStore.Load(manifest.StateFilePath);
                failedState.LastStatus = "Failed";
                failedState.LastErrorMessage = exception.Message;
                failedState.LastAttemptedReleaseId = manifest.ReleaseId;
                failedState.LastAttemptedAtUtc = DateTimeOffset.UtcNow;
                UpdateStateStore.Save(manifest.StateFilePath, failedState);
                WriteInformation("실패 상태를 기록했습니다. StateFilePath={0}, ReleaseId={1}", manifest.StateFilePath, manifest.ReleaseId);
                return 1;
            }
            finally
            {
                TryDeleteDirectory(stagingRoot);
                WriteInformation("staging 디렉터리 정리를 시도했습니다. StagingRoot={0}", stagingRoot);
            }
        }

        private static PendingUpdateManifest LoadManifest(string manifestFilePath)
        {
            var json = File.ReadAllText(manifestFilePath);
            return JsonSerializer.Deserialize<PendingUpdateManifest>(json, JsonSerializerOptions)
                ?? throw new InvalidOperationException("manifest 역직렬화 실패");
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

                var exited = process.WaitForExit((int)timeout.TotalMilliseconds);
                if (exited == false)
                {
                    throw new TimeoutException($"프로세스 종료 대기 시간 초과: pid={processId}");
                }
            }
            catch (ArgumentException)
            {
                await Task.CompletedTask;
            }
        }

        private static void ValidatePackage(PendingUpdatePackage package)
        {
            if (File.Exists(package.PackageFilePath) == false)
            {
                throw new FileNotFoundException("패키지 파일이 없습니다.", package.PackageFilePath);
            }

            if (string.IsNullOrWhiteSpace(package.Sha256) == false)
            {
                var actualHash = CalculateSha256(package.PackageFilePath);
                if (string.Equals(actualHash, package.Sha256, StringComparison.OrdinalIgnoreCase) == false)
                {
                    throw new InvalidOperationException($"패키지 SHA256 검증 실패: {package.PackageFilePath}");
                }

                WriteInformation(
                    "패키지 SHA256 검증이 완료되었습니다. Target={0}, PackageFilePath={1}, Sha256={2}",
                    package.Target,
                    package.PackageFilePath,
                    actualHash);
            }
        }

        private static bool StartRestartProcess(PendingUpdateManifest manifest)
        {
            if (string.IsNullOrWhiteSpace(manifest.RestartExecutablePath) == true)
            {
                return false;
            }

            try
            {
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = manifest.RestartExecutablePath,
                    WorkingDirectory = string.IsNullOrWhiteSpace(manifest.RestartWorkingDirectory) == false
                        ? manifest.RestartWorkingDirectory
                        : Path.GetDirectoryName(manifest.RestartExecutablePath) ?? Environment.CurrentDirectory,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                foreach (var argument in manifest.RestartArguments)
                {
                    processStartInfo.ArgumentList.Add(argument);
                }

                using var process = Process.Start(processStartInfo);
                return process != null;
            }
            catch
            {
                return false;
            }
        }

        private static void Rollback(List<AppliedPackageContext> appliedPackages)
        {
            WriteWarning("롤백을 시작합니다. AppliedPackageCount={0}", appliedPackages.Count);
            for (var index = appliedPackages.Count - 1; index >= 0; index--)
            {
                var appliedPackage = appliedPackages[index];
                try
                {
                    if (Directory.Exists(appliedPackage.TargetPath) == true)
                    {
                        Directory.Delete(appliedPackage.TargetPath, true);
                    }

                    if (appliedPackage.TargetExisted == true && Directory.Exists(appliedPackage.BackupPath) == true)
                    {
                        CopyDirectory(appliedPackage.BackupPath, appliedPackage.TargetPath);
                    }

                    WriteInformation(
                        "롤백을 완료했습니다. TargetPath={0}, BackupPath={1}, TargetExisted={2}",
                        appliedPackage.TargetPath,
                        appliedPackage.BackupPath,
                        appliedPackage.TargetExisted);
                }
                catch
                {
                    WriteWarning(
                        "롤백 중 예외를 무시했습니다. TargetPath={0}, BackupPath={1}",
                        appliedPackage.TargetPath,
                        appliedPackage.BackupPath);
                }
            }
        }

        private static void CopyDirectory(string sourceDirectoryPath, string targetDirectoryPath)
        {
            Directory.CreateDirectory(targetDirectoryPath);

            foreach (var directoryPath in Directory.GetDirectories(sourceDirectoryPath, "*", SearchOption.AllDirectories))
            {
                var relativePath = Path.GetRelativePath(sourceDirectoryPath, directoryPath);
                Directory.CreateDirectory(Path.Combine(targetDirectoryPath, relativePath));
            }

            foreach (var filePath in Directory.GetFiles(sourceDirectoryPath, "*", SearchOption.AllDirectories))
            {
                var relativePath = Path.GetRelativePath(sourceDirectoryPath, filePath);
                var destinationFilePath = Path.Combine(targetDirectoryPath, relativePath);
                var destinationDirectory = Path.GetDirectoryName(destinationFilePath);
                if (string.IsNullOrWhiteSpace(destinationDirectory) == false)
                {
                    Directory.CreateDirectory(destinationDirectory);
                }

                File.Copy(filePath, destinationFilePath, true);
            }
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

        private static string SanitizeFileName(string value)
        {
            var invalidFileNameChars = Path.GetInvalidFileNameChars();
            var buffer = value.Select(ch => invalidFileNameChars.Contains(ch) ? '_' : ch).ToArray();
            return new string(buffer);
        }

        private static void InitializeLogFile(string installRoot, string releaseId)
        {
            try
            {
                var resolvedInstallRoot = string.IsNullOrWhiteSpace(installRoot) == false
                    ? installRoot
                    : AppContext.BaseDirectory;
                var logDirectoryPath = Path.Combine(resolvedInstallRoot, "update", "logs");
                Directory.CreateDirectory(logDirectoryPath);
                logFilePath = Path.Combine(logDirectoryPath, "updater.log");
                WriteInformation("updater 로그를 초기화했습니다. ReleaseId={0}, LogFilePath={1}", releaseId, logFilePath);
            }
            catch (Exception exception)
            {
                WriteError("updater 로그 파일 초기화에 실패했습니다.", exception);
            }
        }

        private static void WriteInformation(string message, params object[] args)
        {
            WriteLog("INF", message, null, args);
        }

        private static void WriteWarning(string message, params object[] args)
        {
            WriteLog("WRN", message, null, args);
        }

        private static void WriteError(string message, Exception? exception = null, params object[] args)
        {
            WriteLog("ERR", message, exception, args);
        }

        private static void WriteLog(string level, string message, Exception? exception, params object[] args)
        {
            string formattedMessage;
            try
            {
                formattedMessage = args.Length > 0 ? string.Format(message, args) : message;
            }
            catch
            {
                formattedMessage = message;
            }

            var line = $"[{DateTimeOffset.Now:yyyy-MM-dd HH:mm:ss.fff zzz} {level}] {formattedMessage}";
            if (exception != null)
            {
                line += Environment.NewLine + exception;
            }

            if (level == "ERR")
            {
                Console.Error.WriteLine(line);
            }
            else
            {
                Console.WriteLine(line);
            }

            if (string.IsNullOrWhiteSpace(logFilePath) == true)
            {
                return;
            }

            try
            {
                lock (LogSyncRoot)
                {
                    File.AppendAllText(logFilePath, line + Environment.NewLine);
                }
            }
            catch
            {
            }
        }
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

        public DateTimeOffset CreatedAtUtc { get; set; }

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

    public static class UpdateStateStore
    {
        public static UpdateState Load(string stateFilePath)
        {
            try
            {
                if (File.Exists(stateFilePath) == false)
                {
                    return new UpdateState();
                }

                var text = File.ReadAllText(stateFilePath);
                if (string.IsNullOrWhiteSpace(text) == true)
                {
                    return new UpdateState();
                }

                return JsonSerializer.Deserialize<UpdateState>(text, JsonSettingsAccessor.JsonSerializerOptions) ?? new UpdateState();
            }
            catch
            {
                return new UpdateState();
            }
        }

        public static void Save(string stateFilePath, UpdateState state)
        {
            var directoryPath = Path.GetDirectoryName(stateFilePath);
            if (string.IsNullOrWhiteSpace(directoryPath) == false)
            {
                Directory.CreateDirectory(directoryPath);
            }

            var json = JsonSerializer.Serialize(state, JsonSettingsAccessor.JsonSerializerOptions);
            File.WriteAllText(stateFilePath, json + Environment.NewLine);
        }
    }

    public sealed class AppliedPackageContext
    {
        public string TargetPath { get; set; } = "";

        public string BackupPath { get; set; } = "";

        public bool TargetExisted { get; set; }
    }
}
