using System;
using System.Collections.Generic;
using System.CommandLine;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.Helpers;

using Serilog;

namespace publish_package
{
    internal readonly record struct PackageFileEntry(char Operation, string RelativePath, long FileSize, string Md5, DateTimeOffset ModifiedAt)
    {
        public bool ShouldIncludeInPackage => char.ToUpperInvariant(Operation) != 'D';
    }

    internal static class Program
    {
        private const string DeployTargetName = "deploy";
        private const string RuntimesTargetName = "runtimes";
        private const string ModulesTargetName = "modules";
        private const string DeployMakeFileName = "deploy-filelist.txt";
        private const string DeployDiffFileName = "deploy-diff-filelist.txt";
        private const string RuntimesDiffFileName = "runtimes-diff-filelist.txt";
        private const string ModulesDiffFileName = "modules-diff-filelist.txt";
        private static readonly string[] RuntimeDirectories = ["app", "assemblies", "hosts", "tools"];
        private static readonly string[] ModuleDirectories = ["modules"];
        private static readonly string[] DeployDirectories = [.. RuntimeDirectories, .. ModuleDirectories];
        private static string startupWorkingDirectory = Directory.GetCurrentDirectory();
        private static System.Timers.Timer? startupAwaitTimer;
        private static CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();
        private static ArgumentHelper? commandOptions = null;
        private static readonly object LogSyncRoot = new object();
        private static string? logFilePath;
        private static bool logFileConfigured;

        public static async Task<int> Main(string[] args)
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.Console()
                .CreateLogger();

            startupWorkingDirectory = Directory.GetCurrentDirectory();
            var entryBasePath = AppDomain.CurrentDomain.BaseDirectory;
            if (string.IsNullOrWhiteSpace(entryBasePath) == true)
            {
                entryBasePath = startupWorkingDirectory;
            }

            if (entryBasePath != Environment.CurrentDirectory)
            {
                Environment.CurrentDirectory = entryBasePath;
            }

            var logDirectoryPath = ConfigureLogger(entryBasePath);

            try
            {
                var optionDebug = new Option<bool?>("--debug") { 
                    Description = "프로그램 시작시 디버거에 프로세스가 연결 될 수 있도록 지연 후 시작됩니다.(기본값: 10초)", DefaultValueFactory = parseResult => false 
                };

                var optionPublishPath = new Option<string?>("--publishpath")
                {
                    Description = "배포 루트 경로입니다. handstack publish 경로를 지정할 수 있습니다."
                };
                var optionAckFile = new Option<FileInfo?>("--ack")
                {
                    Description = "ack 프로그램 전체 파일 경로입니다."
                };
                var optionMakeFile = new Option<string?>("--makefile")
                {
                    Description = "압축에 사용할 파일 목록 경로입니다."
                };
                var optionIncludes = new Option<string?>("--includes")
                {
                    Description = "make/compress 대상 하위 디렉터리 경로 목록입니다. 쉼표(,)로 구분합니다. 예: app,tools/publish-package,modules/transact,transact/Contracts"
                };
                var optionExclude = new Option<string?>("--exclude")
                {
                    Description = "make/compress 제외 glob 패턴 목록입니다. 쉼표(,)로 구분합니다."
                };

                var optionPrevFile = new Option<string?>("--prevfile")
                {
                    Description = "이전 배포 기준 파일 목록 경로입니다."
                };
                var optionOutput = new Option<string?>("--output")
                {
                    Description = "생성 파일 출력 디렉터리 경로입니다. 생략 시 명령을 실행한 작업 디렉터리를 사용합니다."
                };

                var rootCommand = new RootCommand("HandStack 배포 파일 목록 생성, 변경분 계산, ZIP 패키지 생성 도구"){
                    optionDebug
                };

                var makeCommand = new Command("make", "대상 디렉터리의 파일 목록을 생성합니다.")
                {
                    optionAckFile,
                    optionPublishPath,
                    optionIncludes,
                    optionExclude,
                    optionOutput
                };
                makeCommand.SetAction(parseResult =>
                {
                    try
                    {
                        var includeOptions = ParseIncludes(parseResult.GetValue(optionIncludes));
                        var excludePatterns = ParseExcludes(parseResult.GetValue(optionExclude));
                        Log.Information("[make] 파일 목록 생성을 시작합니다. Target={0}, AckFileOption={1}, PublishPathOption={2}, IncludesOption={3}, ExcludeOption={4}, OutputOption={5}", DeployTargetName, FormatOptionValue(parseResult.GetValue(optionAckFile)?.FullName), FormatOptionValue(parseResult.GetValue(optionPublishPath)), FormatOptionValue(parseResult.GetValue(optionIncludes)), FormatOptionValue(parseResult.GetValue(optionExclude)), FormatOptionValue(parseResult.GetValue(optionOutput), startupWorkingDirectory));

                        var handstackRootPath = ResolveHandStackRoot(parseResult.GetValue(optionPublishPath), parseResult.GetValue(optionAckFile));
                        var includes = ResolveIncludeDirectoryRelativePaths(handstackRootPath, includeOptions);
                        var excludeMatchers = BuildGlobMatchers(excludePatterns);
                        var outputDirectoryPath = ResolveOutputDirectory(parseResult.GetValue(optionOutput));
                        Log.Information("[make] 경로 해석이 완료되었습니다. Target={0}, PublishPath={1}, Includes={2}, Excludes={3}, Output={4}", DeployTargetName, handstackRootPath, FormatIncludes(includes), FormatExcludes(excludePatterns), outputDirectoryPath);

                        var files = EnumerateDeployFiles(
                            handstackRootPath,
                            includes,
                            excludeMatchers,
                            CreateConsoleProgressReporter());
                        Log.Information("[make] 대상 파일 수집이 완료되었습니다. Target={0}, Includes={1}, Excludes={2}, FileCount={3}", DeployTargetName, FormatIncludes(includes), FormatExcludes(excludePatterns), files.Count);

                        var fileListPath = Path.Combine(outputDirectoryPath, DeployMakeFileName);

                        WriteFileList(fileListPath, files);

                        Log.Information("파일 목록을 생성했습니다. Target={0}, PublishPath={1}, Includes={2}, Excludes={3}, FileCount={4}, Output={5}", DeployTargetName, handstackRootPath, FormatIncludes(includes), FormatExcludes(excludePatterns), files.Count, fileListPath);

                        return 0;
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[make] 파일 목록 생성 중 예외가 발생했습니다.");
                        return 1;
                    }
                });
                rootCommand.Add(makeCommand);

                var compressCommand = new Command("compress", "대상 디렉터리 파일을 ZIP 패키지로 생성합니다.")
                {
                    optionAckFile,
                    optionPublishPath,
                    optionMakeFile,
                    optionIncludes,
                    optionExclude,
                    optionOutput
                };
                compressCommand.SetAction(parseResult =>
                {
                    try
                    {
                        var includeOptions = ParseIncludes(parseResult.GetValue(optionIncludes));
                        var excludePatterns = ParseExcludes(parseResult.GetValue(optionExclude));
                        Log.Information("[compress] ZIP 패키지 생성을 시작합니다. Target={0}, AckFileOption={1}, PublishPathOption={2}, MakeFileOption={3}, IncludesOption={4}, ExcludeOption={5}, OutputOption={6}", DeployTargetName, FormatOptionValue(parseResult.GetValue(optionAckFile)?.FullName), FormatOptionValue(parseResult.GetValue(optionPublishPath)), FormatOptionValue(parseResult.GetValue(optionMakeFile)), FormatOptionValue(parseResult.GetValue(optionIncludes)), FormatOptionValue(parseResult.GetValue(optionExclude)), FormatOptionValue(parseResult.GetValue(optionOutput), startupWorkingDirectory));

                        var handstackRootPath = ResolveHandStackRoot(parseResult.GetValue(optionPublishPath), parseResult.GetValue(optionAckFile));
                        var includes = ResolveIncludeDirectoryRelativePaths(handstackRootPath, includeOptions);
                        var excludeMatchers = BuildGlobMatchers(excludePatterns);
                        var makeFilePath = parseResult.GetValue(optionMakeFile);
                        var resolvedMakeFilePath = string.IsNullOrWhiteSpace(makeFilePath) == true
                            ? null
                            : ResolveInputFilePath(makeFilePath, startupWorkingDirectory, handstackRootPath, AppContext.BaseDirectory);
                        var outputDirectoryPath = ResolveOutputDirectory(parseResult.GetValue(optionOutput));
                        Log.Information("[compress] 경로 해석이 완료되었습니다. Target={0}, PublishPath={1}, Includes={2}, Excludes={3}, Output={4}", DeployTargetName, handstackRootPath, FormatIncludes(includes), FormatExcludes(excludePatterns), outputDirectoryPath);

                        var currentEntries = EnumerateDeployFiles(
                            handstackRootPath,
                            includes,
                            excludeMatchers,
                            CreateConsoleProgressReporter());
                        IReadOnlyList<PackageFileEntry> packageEntries = string.IsNullOrWhiteSpace(makeFilePath) == true
                            ? currentEntries
                            : LoadDeployFilesFromMakeFile(handstackRootPath, makeFilePath, includes, excludeMatchers);
                        var archiveEntries = packageEntries
                            .Where(entry => entry.ShouldIncludeInPackage == true)
                            .OrderBy(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase)
                            .ToList();
                        var archiveFileCount = archiveEntries.Count + (string.IsNullOrWhiteSpace(resolvedMakeFilePath) == true ? 0 : 1);
                        Log.Information("[compress] 패키지 대상을 확정했습니다. Target={0}, Includes={1}, Excludes={2}, CurrentFileCount={3}, PackageFileCount={4}, MakeFile={5}", DeployTargetName, FormatIncludes(includes), FormatExcludes(excludePatterns), currentEntries.Count, archiveEntries.Count, resolvedMakeFilePath ?? "(scan)");

                        var packagesPath = Path.Combine(outputDirectoryPath, "packages");
                        Directory.CreateDirectory(packagesPath);

                        var packageFileName = CreatePackageFileName(packagesPath, DeployTargetName, DateTimeOffset.Now);
                        var packageFilePath = Path.Combine(packagesPath, packageFileName);
                        if (File.Exists(packageFilePath) == true)
                        {
                            File.Delete(packageFilePath);
                        }

                        var packageManifestFilePath = Path.ChangeExtension(packageFilePath, ".txt");
                        WriteFileList(packageManifestFilePath, packageEntries);

                        using (var archive = ZipFile.Open(packageFilePath, ZipArchiveMode.Create))
                        {
                            var reportArchiveProgress = CreateConsoleProgressReporter();
                            var processedArchiveEntryCount = 0;
                            var totalArchiveEntryCount = archiveEntries.Count + (string.IsNullOrWhiteSpace(packageManifestFilePath) == true ? 0 : 1);
                            foreach (var packageEntry in archiveEntries)
                            {
                                var sourceFilePath = ResolveSourceFilePath(handstackRootPath, packageEntry.RelativePath);
                                archive.CreateEntryFromFile(sourceFilePath, packageEntry.RelativePath, CompressionLevel.Optimal);
                                processedArchiveEntryCount++;
                                reportArchiveProgress(processedArchiveEntryCount, totalArchiveEntryCount);
                            }

                            if (string.IsNullOrWhiteSpace(packageManifestFilePath) == false)
                            {
                                archive.CreateEntryFromFile(
                                    packageManifestFilePath,
                                    Path.GetFileName(packageManifestFilePath),
                                    CompressionLevel.Optimal);
                                processedArchiveEntryCount++;
                                reportArchiveProgress(processedArchiveEntryCount, totalArchiveEntryCount);
                            }
                        }

                        Log.Information("[compress] ZIP 및 기준 manifest 기록이 완료되었습니다. Target={0}, ZipPath={1}, ManifestPath={2}", DeployTargetName, packageFilePath, packageManifestFilePath);

                        var packageSize = new FileInfo(packageFilePath).Length;
                        Log.Information("ZIP 패키지를 생성했습니다. Target={0}, PublishPath={1}, Includes={2}, Excludes={3}, FileCount={4}, Output={5}, Manifest={6}, Size={7}", DeployTargetName, handstackRootPath, FormatIncludes(includes), FormatExcludes(excludePatterns), archiveFileCount, packageFilePath, packageManifestFilePath, packageSize);

                        return 0;
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[compress] ZIP 패키지 생성 중 예외가 발생했습니다.");
                        return 1;
                    }
                });
                rootCommand.Add(compressCommand);

                var deployDiffCommand = new Command("deploy-diff", "이전 deploy 파일 목록 대비 변경분 파일 목록을 생성합니다.")
                {
                    optionMakeFile,
                    optionPrevFile,
                    optionExclude,
                    optionOutput
                };
                deployDiffCommand.SetAction(parseResult =>
                {
                    try
                    {
                        Log.Information("[deploy-diff] 변경분 파일 목록 생성을 시작합니다. MakeFileOption={0}, PrevFileOption={1}, ExcludeOption={2}, OutputOption={3}", FormatOptionValue(parseResult.GetValue(optionMakeFile)), FormatOptionValue(parseResult.GetValue(optionPrevFile)), FormatOptionValue(parseResult.GetValue(optionExclude)), FormatOptionValue(parseResult.GetValue(optionOutput), startupWorkingDirectory));

                        return ExecuteDiffCommand(
                            DeployTargetName,
                            DeployDirectories,
                            DeployDiffFileName,
                            parseResult.GetValue(optionMakeFile),
                            parseResult.GetValue(optionPrevFile),
                            parseResult.GetValue(optionExclude),
                            parseResult.GetValue(optionOutput));
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[deploy-diff] 변경분 파일 목록 생성 중 예외가 발생했습니다.");
                        return 1;
                    }
                });
                rootCommand.Add(deployDiffCommand);

                var runtimesDiffCommand = new Command("runtimes-diff", "이전 runtimes 파일 목록 대비 변경분 파일 목록을 생성합니다.")
                {
                    optionMakeFile,
                    optionPrevFile,
                    optionExclude,
                    optionOutput
                };
                runtimesDiffCommand.SetAction(parseResult =>
                {
                    try
                    {
                        Log.Information("[runtimes-diff] 변경분 파일 목록 생성을 시작합니다. MakeFileOption={0}, PrevFileOption={1}, ExcludeOption={2}, OutputOption={3}", FormatOptionValue(parseResult.GetValue(optionMakeFile)), FormatOptionValue(parseResult.GetValue(optionPrevFile)), FormatOptionValue(parseResult.GetValue(optionExclude)), FormatOptionValue(parseResult.GetValue(optionOutput), startupWorkingDirectory));

                        return ExecuteDiffCommand(
                            RuntimesTargetName,
                            RuntimeDirectories,
                            RuntimesDiffFileName,
                            parseResult.GetValue(optionMakeFile),
                            parseResult.GetValue(optionPrevFile),
                            parseResult.GetValue(optionExclude),
                            parseResult.GetValue(optionOutput));
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[runtimes-diff] 변경분 파일 목록 생성 중 예외가 발생했습니다.");
                        return 1;
                    }
                });
                rootCommand.Add(runtimesDiffCommand);

                var modulesDiffCommand = new Command("modules-diff", "이전 modules 파일 목록 대비 변경분 파일 목록을 생성합니다.")
                {
                    optionMakeFile,
                    optionPrevFile,
                    optionExclude,
                    optionOutput
                };
                modulesDiffCommand.SetAction(parseResult =>
                {
                    try
                    {
                        Log.Information("[modules-diff] 변경분 파일 목록 생성을 시작합니다. MakeFileOption={0}, PrevFileOption={1}, ExcludeOption={2}, OutputOption={3}", FormatOptionValue(parseResult.GetValue(optionMakeFile)), FormatOptionValue(parseResult.GetValue(optionPrevFile)), FormatOptionValue(parseResult.GetValue(optionExclude)), FormatOptionValue(parseResult.GetValue(optionOutput), startupWorkingDirectory));

                        return ExecuteDiffCommand(
                            ModulesTargetName,
                            ModuleDirectories,
                            ModulesDiffFileName,
                            parseResult.GetValue(optionMakeFile),
                            parseResult.GetValue(optionPrevFile),
                            parseResult.GetValue(optionExclude),
                            parseResult.GetValue(optionOutput));
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[modules-diff] 변경분 파일 목록 생성 중 예외가 발생했습니다.");
                        return 1;
                    }
                });
                rootCommand.Add(modulesDiffCommand);

                Log.Information("명령 실행을 시작합니다. WorkingDirectory={0}, BaseDirectory={1}, LogDirectory={2}, Args={3}", startupWorkingDirectory, entryBasePath, logDirectoryPath, FormatArguments(args));

                rootCommand.SetAction((parseResult) =>
                {
                    var debug = parseResult.GetValue(optionDebug);

                    try
                    {
                        Log.Information($"Current Directory from {Directory.GetCurrentDirectory()}");
                        Log.Information($"Launched from {Environment.CurrentDirectory}");
                        Log.Information($"Physical location {AppDomain.CurrentDomain.BaseDirectory}");
                        Log.Information($"Runtime call {Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)}");
                    }
                    catch (Exception exception)
                    {
                        Log.Fatal(exception, "프로그램 실행 중 오류가 발생했습니다");
                    }
                });

                var arguments = new ArgumentHelper(args);
                var argumentOptions = arguments["options"];
                if (argumentOptions != null)
                {
                    commandOptions = new ArgumentHelper(argumentOptions.Split(" "));
                }

                var debug = false;
                if (arguments["debug"] != null)
                {
                    debug = true;
                }

                await DebuggerAttach(debug);

                ParseResult parseResult = rootCommand.Parse(args);
                if (parseResult.Errors.Count > 0)
                {
                    foreach (var parseError in parseResult.Errors)
                    {
                        Log.Error(parseError.Message);
                    }

                    return 1;
                }

                return await parseResult.InvokeAsync();
            }
            catch (Exception exception)
            {
                Log.Error(exception, "처리되지 않은 예외가 발생했습니다. WorkingDirectory={0}, BaseDirectory={1}, Args={2}", startupWorkingDirectory, entryBasePath, FormatArguments(args));
                return 1;
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        private static int ExecuteDiffCommand(string targetName, IReadOnlyList<string> targetDirectories, string diffFileName, string? makeFilePath, string? prevFilePath, string? excludeOption, string? outputPath)
        {
            var resolvedMakeFilePath = ResolveInputFilePath(
                RequireOptionValue("--makefile", makeFilePath),
                startupWorkingDirectory,
                AppContext.BaseDirectory);
            if (File.Exists(resolvedMakeFilePath) == false)
            {
                throw new FileNotFoundException("현재 파일 목록을 찾을 수 없습니다.", resolvedMakeFilePath);
            }

            var resolvedPrevFilePath = ResolveInputFilePath(
                RequireOptionValue("--prevfile", prevFilePath),
                startupWorkingDirectory,
                AppContext.BaseDirectory);
            if (File.Exists(resolvedPrevFilePath) == false)
            {
                throw new FileNotFoundException("이전 파일 목록을 찾을 수 없습니다.", resolvedPrevFilePath);
            }

            var excludePatterns = ParseExcludes(excludeOption);
            var excludeMatchers = BuildGlobMatchers(excludePatterns);
            var outputDirectoryPath = ResolveOutputDirectory(outputPath);
            Log.Information("[{0}-diff] 입력 파일 해석이 완료되었습니다. CurrentFile={1}, PrevFile={2}, Excludes={3}, Output={4}", targetName, resolvedMakeFilePath, resolvedPrevFilePath, FormatExcludes(excludePatterns), outputDirectoryPath);

            var currentEntries = LoadFileListEntriesFromFile(targetName, targetDirectories, resolvedMakeFilePath, null, excludeMatchers);
            var previousEntries = LoadFileListEntriesFromFile(targetName, targetDirectories, resolvedPrevFilePath, null, excludeMatchers);
            Log.Information("[{0}-diff] 기준 파일 로딩이 완료되었습니다. CurrentFileCount={1}, PrevFileCount={2}", targetName, currentEntries.Count, previousEntries.Count);

            var diffEntries = BuildDiffEntries(previousEntries, currentEntries);
            var diffFilePath = Path.Combine(outputDirectoryPath, diffFileName);
            Log.Information("[{0}-diff] 변경분 계산이 완료되었습니다. CreateCount={1}, UpdateCount={2}, DeleteCount={3}", targetName, diffEntries.Count(entry => entry.Operation == 'C'), diffEntries.Count(entry => entry.Operation == 'U'), diffEntries.Count(entry => entry.Operation == 'D'));

            WriteFileList(diffFilePath, diffEntries);

            Log.Information("변경분 파일 목록을 생성했습니다. Target={0}, CurrentFile={1}, PrevFile={2}, FileCount={3}, Output={4}", targetName, resolvedMakeFilePath, resolvedPrevFilePath, diffEntries.Count, diffFilePath);

            return 0;
        }

        private static string ResolveHandStackRoot(string? requestedPath, FileInfo? ackFile = null)
        {
            if (ackFile != null)
            {
                var ackFilePath = Path.IsPathRooted(ackFile.FullName) == true
                    ? Path.GetFullPath(ackFile.FullName)
                    : Path.GetFullPath(Path.Combine(startupWorkingDirectory, ackFile.FullName));
                var resolvedPath = ResolveHandStackRootFromAckFilePath(ackFilePath);
                if (string.IsNullOrWhiteSpace(resolvedPath) == false)
                {
                    return resolvedPath;
                }

                throw new DirectoryNotFoundException($"ack 파일 경로에서 handstack 배포 루트를 찾을 수 없습니다. AckFile={ackFilePath}");
            }

            foreach (var candidatePath in GetCandidateRootPaths(requestedPath))
            {
                var normalizedPath = NormalizeHandStackRoot(candidatePath);
                if (normalizedPath != null)
                {
                    return normalizedPath;
                }
            }

            throw new DirectoryNotFoundException("handstack 배포 루트를 찾을 수 없습니다. `--publishpath=[handstack publish]` 경로를 지정하세요.");
        }

        private static string? ResolveHandStackRootFromAckFilePath(string ackFilePath)
        {
            var ackDirectoryPath = Path.GetDirectoryName(ackFilePath);
            if (string.IsNullOrWhiteSpace(ackDirectoryPath) == true)
            {
                return null;
            }

            var candidates = new List<string>();
            var fileDirectory = new DirectoryInfo(Path.GetFullPath(ackDirectoryPath));
            if (string.Equals(fileDirectory.Name, "app", StringComparison.OrdinalIgnoreCase) == true && fileDirectory.Parent != null)
            {
                candidates.Add(fileDirectory.Parent.FullName);
            }

            candidates.Add(fileDirectory.FullName);
            if (fileDirectory.Parent != null)
            {
                candidates.Add(fileDirectory.Parent.FullName);
            }

            foreach (var candidatePath in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var normalizedPath = NormalizeHandStackRoot(candidatePath);
                if (normalizedPath != null)
                {
                    return normalizedPath;
                }
            }

            return null;
        }

        private static IEnumerable<string> GetCandidateRootPaths(string? requestedPath)
        {
            var yielded = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (string.IsNullOrWhiteSpace(requestedPath) == false)
            {
                var explicitPath = Path.IsPathRooted(requestedPath) == true
                    ? Path.GetFullPath(requestedPath)
                    : Path.GetFullPath(Path.Combine(startupWorkingDirectory, requestedPath));
                if (yielded.Add(explicitPath) == true)
                {
                    yield return explicitPath;
                }

                yield break;
            }

            var publishRuntimeIdentifier = GetDefaultPublishRuntimeIdentifier();
            foreach (var basePath in new[] { startupWorkingDirectory, AppContext.BaseDirectory })
            {
                var directoryInfo = new DirectoryInfo(Path.GetFullPath(basePath));
                while (directoryInfo != null)
                {
                    foreach (var candidate in new[]
                    {
                        directoryInfo.FullName,
                        Path.Combine(directoryInfo.FullName, "handstack"),
                        Path.GetFullPath(Path.Combine(directoryInfo.FullName, "..", "publish", publishRuntimeIdentifier, "handstack"))
                    })
                    {
                        if (yielded.Add(candidate) == true)
                        {
                            yield return candidate;
                        }
                    }

                    directoryInfo = directoryInfo.Parent;
                }
            }
        }

        private static string GetDefaultPublishRuntimeIdentifier()
        {
            if (OperatingSystem.IsWindows() == true)
            {
                return "win-x64";
            }

            if (OperatingSystem.IsLinux() == true)
            {
                return "linux-x64";
            }

            if (OperatingSystem.IsMacOS() == true)
            {
                return RuntimeInformation.ProcessArchitecture switch
                {
                    Architecture.X64 => "osx-x64",
                    Architecture.Arm64 => "osx-arm64",
                    _ => throw new PlatformNotSupportedException($"지원하지 않는 macOS 아키텍처입니다: {RuntimeInformation.ProcessArchitecture}")
                };
            }

            throw new PlatformNotSupportedException($"지원하지 않는 운영체제입니다: {RuntimeInformation.OSDescription}");
        }

        private static string ResolveOutputDirectory(string? requestedPath)
        {
            var outputDirectoryPath = string.IsNullOrWhiteSpace(requestedPath) == true
                ? startupWorkingDirectory
                : Path.IsPathRooted(requestedPath) == true
                    ? requestedPath
                    : Path.Combine(startupWorkingDirectory, requestedPath);

            var fullPath = Path.GetFullPath(outputDirectoryPath);
            if (File.Exists(fullPath) == true)
            {
                throw new IOException($"출력 경로가 디렉터리가 아닙니다. Output={fullPath}");
            }

            Directory.CreateDirectory(fullPath);
            return fullPath;
        }

        private static IReadOnlyList<string> ParseIncludes(string? value)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return [];
            }

            var includes = new List<string>();
            var seenIncludes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var includeValue in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                var normalizedInclude = NormalizeIncludePath(includeValue);
                if (seenIncludes.Add(normalizedInclude) == true)
                {
                    includes.Add(normalizedInclude);
                }
            }

            return includes;
        }

        private static IReadOnlyList<string> ParseExcludes(string? value)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return [];
            }

            var excludes = new List<string>();
            var seenExcludes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var excludeValue in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                var normalizedExclude = NormalizeGlobPattern(excludeValue);
                if (seenExcludes.Add(normalizedExclude) == true)
                {
                    excludes.Add(normalizedExclude);
                }
            }

            return excludes;
        }

        private static string NormalizeIncludePath(string value)
        {
            var include = value.Trim().Trim('"');
            if (string.IsNullOrWhiteSpace(include) == true)
            {
                throw new ArgumentException("`--includes` 값 확인이 필요합니다.");
            }

            return NormalizeRelativeFilePath(include);
        }

        private static string NormalizeGlobPattern(string value)
        {
            var pattern = value.Trim().Trim('"').Replace('\\', '/');
            while (pattern.StartsWith("./", StringComparison.Ordinal) == true)
            {
                pattern = pattern[2..];
            }

            if (string.IsNullOrWhiteSpace(pattern) == true)
            {
                throw new ArgumentException("`--exclude` 값 확인이 필요합니다.");
            }

            if (Path.IsPathRooted(pattern) == true)
            {
                throw new ArgumentException("`--exclude`에는 상대 경로 glob 패턴만 사용할 수 있습니다.");
            }

            var normalizedSegments = new List<string>();
            foreach (var segment in pattern.Split('/', StringSplitOptions.RemoveEmptyEntries))
            {
                if (segment == ".")
                {
                    continue;
                }

                if (segment == "..")
                {
                    throw new ArgumentException("`--exclude`에는 배포 루트 밖 경로를 사용할 수 없습니다.");
                }

                normalizedSegments.Add(segment);
            }

            if (normalizedSegments.Count == 0)
            {
                throw new ArgumentException("`--exclude` 값 확인이 필요합니다.");
            }

            return string.Join("/", normalizedSegments);
        }

        private static string FormatIncludes(IReadOnlyList<string> includes)
        {
            return includes.Count == 0
                ? "(all)"
                : string.Join(",", includes);
        }

        private static string FormatExcludes(IReadOnlyList<string> excludes)
        {
            return excludes.Count == 0
                ? "(none)"
                : string.Join(",", excludes);
        }

        private static string? NormalizeHandStackRoot(string candidatePath)
        {
            var fullPath = Path.GetFullPath(candidatePath);
            if (IsHandStackRoot(fullPath) == true)
            {
                return fullPath;
            }

            return null;
        }

        private static bool IsHandStackRoot(string path)
        {
            return Directory.Exists(path) == true
                && Directory.Exists(Path.Combine(path, "modules")) == true
                && Directory.Exists(Path.Combine(path, "tools")) == true
                && Directory.Exists(Path.Combine(path, "app")) == true
                && Directory.Exists(Path.Combine(path, "assemblies")) == true
                && Directory.Exists(Path.Combine(path, "hosts")) == true;
        }

        private static IReadOnlyList<PackageFileEntry> EnumerateDeployFiles(string handstackRootPath, IReadOnlyList<string> includes, IReadOnlyList<Regex> excludeMatchers, Action<int, int>? reportProgress = null)
        {
            var filePaths = new List<string>();
            foreach (var targetDirectoryPath in ResolveDeployDirectoryPaths(handstackRootPath, includes))
            {
                filePaths.AddRange(
                    Directory.GetFiles(targetDirectoryPath, "*", SearchOption.AllDirectories)
                        .Where(filePath => IsExcludedFilePath(ToRelativePath(handstackRootPath, filePath), excludeMatchers) == false));
            }

            var fileEntries = new List<PackageFileEntry>(filePaths.Count);
            for (var index = 0; index < filePaths.Count; index++)
            {
                fileEntries.Add(CreatePackageFileEntry(handstackRootPath, filePaths[index], 'C'));
                reportProgress?.Invoke(index + 1, filePaths.Count);
            }

            var files = fileEntries
                .GroupBy(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase)
                .Select(group => group.Last())
                .OrderBy(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (files.Count == 0 && includes.Count == 0)
            {
                throw new InvalidOperationException($"대상 파일이 없습니다. Target={DeployTargetName}");
            }

            return files;
        }

        private static IReadOnlyList<PackageFileEntry> BuildDiffEntries(IReadOnlyList<PackageFileEntry> previousEntries, IReadOnlyList<PackageFileEntry> currentEntries)
        {
            var previousEntriesByPath = previousEntries.ToDictionary(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase);
            var currentEntriesByPath = currentEntries.ToDictionary(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase);
            var diffEntries = new List<PackageFileEntry>();

            foreach (var currentEntry in currentEntries.OrderBy(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase))
            {
                if (previousEntriesByPath.TryGetValue(currentEntry.RelativePath, out var previousEntry) == false)
                {
                    diffEntries.Add(currentEntry with { Operation = 'C' });
                    continue;
                }

                if (HasSameContent(previousEntry, currentEntry) == false)
                {
                    diffEntries.Add(currentEntry with { Operation = 'U' });
                }
            }

            foreach (var previousEntry in previousEntries.OrderBy(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase))
            {
                if (currentEntriesByPath.ContainsKey(previousEntry.RelativePath) == false)
                {
                    diffEntries.Add(previousEntry with { Operation = 'D' });
                }
            }

            return diffEntries
                .OrderBy(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static bool HasSameContent(PackageFileEntry previousEntry, PackageFileEntry currentEntry)
        {
            return string.IsNullOrWhiteSpace(previousEntry.Md5) == false
                && string.IsNullOrWhiteSpace(currentEntry.Md5) == false
                && previousEntry.FileSize == currentEntry.FileSize
                && string.Equals(previousEntry.Md5, currentEntry.Md5, StringComparison.OrdinalIgnoreCase) == true;
        }

        private static IReadOnlyList<PackageFileEntry> LoadDeployFilesFromMakeFile(string handstackRootPath, string makeFilePath, IReadOnlyList<string> includes, IReadOnlyList<Regex> excludeMatchers)
        {
            var resolvedMakeFilePath = ResolveInputFilePath(makeFilePath, startupWorkingDirectory, handstackRootPath, AppContext.BaseDirectory);
            if (File.Exists(resolvedMakeFilePath) == false)
            {
                throw new FileNotFoundException("파일 목록을 찾을 수 없습니다.", resolvedMakeFilePath);
            }

            var entries = LoadFileListEntriesFromFile(DeployTargetName, DeployDirectories, resolvedMakeFilePath, includes, excludeMatchers);
            foreach (var entry in entries.Where(entry => entry.ShouldIncludeInPackage == true))
            {
                var sourceFilePath = ResolveSourceFilePath(handstackRootPath, entry.RelativePath);
                if (File.Exists(sourceFilePath) == false)
                {
                    throw new FileNotFoundException("파일 목록에 포함된 파일을 찾을 수 없습니다.", sourceFilePath);
                }
            }

            return entries;
        }

        private static IReadOnlyList<PackageFileEntry> LoadFileListEntriesFromFile(string targetName, IReadOnlyList<string> targetDirectories, string filePath, IReadOnlyList<string>? includes = null, IReadOnlyList<Regex>? excludeMatchers = null)
        {
            var entriesByPath = new Dictionary<string, PackageFileEntry>(StringComparer.OrdinalIgnoreCase);
            foreach (var line in File.ReadAllLines(filePath))
            {
                var rawValue = line.Trim();
                if (string.IsNullOrWhiteSpace(rawValue) == true || rawValue.StartsWith("#", StringComparison.Ordinal) == true)
                {
                    continue;
                }

                var entry = ParseFileListEntry(rawValue);
                if (IsKnownPackageFilePath(entry.RelativePath) == false)
                {
                    throw new InvalidOperationException($"대상 범위를 벗어난 파일입니다. Target={targetName}, Path={entry.RelativePath}");
                }

                if (IsTargetFilePath(targetDirectories, entry.RelativePath) == false)
                {
                    continue;
                }

                if (IsIncludedFilePath(entry.RelativePath, includes) == false)
                {
                    continue;
                }

                if (excludeMatchers != null && IsExcludedFilePath(entry.RelativePath, excludeMatchers) == true)
                {
                    continue;
                }

                entriesByPath[entry.RelativePath] = entry;
            }

            return entriesByPath.Values
                .OrderBy(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static PackageFileEntry ParseFileListEntry(string rawValue)
        {
            var columns = rawValue.Split('|');
            if (columns.Length == 1)
            {
                return new PackageFileEntry(
                    'C',
                    NormalizeRelativeFilePath(columns[0]),
                    0,
                    string.Empty,
                    default);
            }

            if (columns.Length != 5)
            {
                throw new FormatException($"파일 목록 형식이 올바르지 않습니다. Entry={rawValue}");
            }

            return new PackageFileEntry(
                NormalizeOperation(columns[0]),
                NormalizeRelativeFilePath(columns[1]),
                ParseFileSize(columns[2]),
                NormalizeMd5(columns[3]),
                ParseModifiedAt(columns[4]));
        }

        private static PackageFileEntry CreatePackageFileEntry(string handstackRootPath, string filePath, char operation)
        {
            var sourceFilePath = ResolveSourceFilePath(handstackRootPath, ToRelativePath(handstackRootPath, filePath));
            var fileInfo = new FileInfo(sourceFilePath);

            return new PackageFileEntry(
                NormalizeOperation(operation.ToString(CultureInfo.InvariantCulture)),
                ToRelativePath(handstackRootPath, sourceFilePath),
                fileInfo.Length,
                ComputeMd5(sourceFilePath),
                new DateTimeOffset(fileInfo.LastWriteTimeUtc));
        }

        private static string ResolveInputFilePath(string requestedPath, params string[] basePaths)
        {
            if (Path.IsPathRooted(requestedPath) == true)
            {
                return Path.GetFullPath(requestedPath);
            }

            foreach (var basePath in basePaths.Where(basePath => string.IsNullOrWhiteSpace(basePath) == false))
            {
                var candidatePath = Path.GetFullPath(Path.Combine(basePath, requestedPath));
                if (File.Exists(candidatePath) == true)
                {
                    return candidatePath;
                }
            }

            var fallbackBasePath = basePaths.FirstOrDefault(basePath => string.IsNullOrWhiteSpace(basePath) == false) ?? startupWorkingDirectory;
            return Path.GetFullPath(Path.Combine(fallbackBasePath, requestedPath));
        }

        private static string NormalizeRelativeFilePath(string value)
        {
            var trimmedValue = value.Trim().Trim('"');
            while (trimmedValue.StartsWith("./", StringComparison.Ordinal) == true || trimmedValue.StartsWith(".\\", StringComparison.Ordinal) == true)
            {
                trimmedValue = trimmedValue[2..];
            }

            if (string.IsNullOrWhiteSpace(trimmedValue) == true)
            {
                throw new InvalidOperationException("상대 경로 값 확인이 필요합니다.");
            }

            if (Path.IsPathRooted(trimmedValue) == true)
            {
                throw new InvalidOperationException($"파일 목록에는 상대 경로만 사용할 수 있습니다. Path={trimmedValue}");
            }

            var normalizedSegments = new List<string>();
            foreach (var segment in trimmedValue.Split(['/', '\\'], StringSplitOptions.RemoveEmptyEntries))
            {
                if (segment == ".")
                {
                    continue;
                }

                if (segment == "..")
                {
                    if (normalizedSegments.Count == 0)
                    {
                        throw new InvalidOperationException($"배포 루트 밖의 파일은 사용할 수 없습니다. Path={trimmedValue}");
                    }

                    normalizedSegments.RemoveAt(normalizedSegments.Count - 1);
                    continue;
                }

                normalizedSegments.Add(segment);
            }

            if (normalizedSegments.Count == 0)
            {
                throw new InvalidOperationException($"상대 경로 값 확인이 필요합니다. Path={trimmedValue}");
            }

            return string.Join("/", normalizedSegments);
        }

        private static string ResolveSourceFilePath(string handstackRootPath, string relativePath)
        {
            var normalizedRelativePath = NormalizeRelativeFilePath(relativePath);
            var fullPath = Path.GetFullPath(Path.Combine(handstackRootPath, normalizedRelativePath.Replace('/', Path.DirectorySeparatorChar)));
            EnsurePathInsideRoot(handstackRootPath, fullPath);
            return fullPath;
        }

        private static void EnsurePathInsideRoot(string handstackRootPath, string path)
        {
            var normalizedRootPath = EnsureTrailingSeparator(Path.GetFullPath(handstackRootPath));
            var normalizedPath = Path.GetFullPath(path);

            if (normalizedPath.StartsWith(normalizedRootPath, StringComparison.OrdinalIgnoreCase) == false)
            {
                throw new InvalidOperationException($"배포 루트 밖의 파일은 사용할 수 없습니다. PublishPath={handstackRootPath}, Path={path}");
            }
        }

        private static string EnsureTrailingSeparator(string value)
        {
            return value.EndsWith(Path.DirectorySeparatorChar) == true
                ? value
                : value + Path.DirectorySeparatorChar;
        }

        private static IReadOnlyList<string> ResolveDeployDirectoryPaths(string handstackRootPath, IReadOnlyList<string> includes)
        {
            if (includes.Count == 0)
            {
                var targetDirectoryPaths = DeployDirectories
                    .Select(directoryName => Path.Combine(handstackRootPath, directoryName))
                    .ToList();
                foreach (var targetDirectoryPath in targetDirectoryPaths)
                {
                    if (Directory.Exists(targetDirectoryPath) == false)
                    {
                        throw new DirectoryNotFoundException($"대상 디렉터리를 찾을 수 없습니다: {targetDirectoryPath}");
                    }
                }

                return targetDirectoryPaths;
            }

            return includes
                .Select(include => ResolveSourceFilePath(handstackRootPath, include))
                .Where(Directory.Exists)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static IReadOnlyList<string> ResolveIncludeDirectoryRelativePaths(string handstackRootPath, IReadOnlyList<string> includes)
        {
            if (includes.Count == 0)
            {
                return [];
            }

            var targetDirectoryPaths = new List<string>();
            var seenPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var include in includes)
            {
                foreach (var candidateRelativePath in GetIncludeCandidateRelativePaths(include))
                {
                    var targetDirectoryPath = ResolveSourceFilePath(handstackRootPath, candidateRelativePath);
                    if (Directory.Exists(targetDirectoryPath) == true && seenPaths.Add(candidateRelativePath) == true)
                    {
                        targetDirectoryPaths.Add(candidateRelativePath);
                    }
                }
            }

            return targetDirectoryPaths;
        }

        private static IEnumerable<string> GetIncludeCandidateRelativePaths(string include)
        {
            var yielded = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var normalizedInclude = NormalizeRelativeFilePath(include);
            var isTargetRootRelativePath = DeployDirectories.Any(directoryName =>
                normalizedInclude.Equals(directoryName, StringComparison.OrdinalIgnoreCase) == true
                || normalizedInclude.StartsWith(directoryName + "/", StringComparison.OrdinalIgnoreCase) == true);
            if (isTargetRootRelativePath == true)
            {
                if (yielded.Add(normalizedInclude) == true)
                {
                    yield return normalizedInclude;
                }
            }

            if (isTargetRootRelativePath == false)
            {
                var moduleRelativePath = $"modules/{normalizedInclude}";
                if (yielded.Add(moduleRelativePath) == true)
                {
                    yield return moduleRelativePath;
                }
            }
        }

        private static bool IsTargetFilePath(IReadOnlyList<string> targetDirectories, string relativePath)
        {
            return targetDirectories
                .Any(directoryName =>
                    relativePath.Equals(directoryName, StringComparison.OrdinalIgnoreCase) == true
                    || relativePath.StartsWith(directoryName + "/", StringComparison.OrdinalIgnoreCase) == true);
        }

        private static bool IsKnownPackageFilePath(string relativePath)
        {
            return IsTargetFilePath(DeployDirectories, relativePath);
        }

        private static bool IsIncludedFilePath(string relativePath, IReadOnlyList<string>? includes)
        {
            if (includes == null || includes.Count == 0)
            {
                return true;
            }

            var normalizedRelativePath = NormalizeRelativeFilePath(relativePath);
            return includes.Any(include =>
                normalizedRelativePath.Equals(include, StringComparison.OrdinalIgnoreCase) == true
                || normalizedRelativePath.StartsWith(include + "/", StringComparison.OrdinalIgnoreCase) == true);
        }

        private static IReadOnlyList<Regex> BuildGlobMatchers(IReadOnlyList<string> patterns)
        {
            return patterns
                .Select(BuildGlobRegex)
                .ToList();
        }

        private static Regex BuildGlobRegex(string pattern)
        {
            var normalizedPattern = NormalizeGlobPattern(pattern);
            var expression = new System.Text.StringBuilder("^");
            for (var index = 0; index < normalizedPattern.Length; index++)
            {
                var currentCharacter = normalizedPattern[index];
                if (currentCharacter == '*')
                {
                    var isDoubleAsterisk = index + 1 < normalizedPattern.Length && normalizedPattern[index + 1] == '*';
                    if (isDoubleAsterisk == true)
                    {
                        var isDirectoryWildcard = index + 2 < normalizedPattern.Length && normalizedPattern[index + 2] == '/';
                        expression.Append(isDirectoryWildcard == true ? "(?:.*/)?" : ".*");
                        index += isDirectoryWildcard == true ? 2 : 1;
                        continue;
                    }

                    expression.Append("[^/]*");
                    continue;
                }

                if (currentCharacter == '?')
                {
                    expression.Append("[^/]");
                    continue;
                }

                if (currentCharacter == '/')
                {
                    expression.Append("/");
                    continue;
                }

                expression.Append(Regex.Escape(currentCharacter.ToString(CultureInfo.InvariantCulture)));
            }

            expression.Append("$");
            return new Regex(expression.ToString(), RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);
        }

        private static bool IsExcludedFilePath(string relativePath, IReadOnlyList<Regex> excludeMatchers)
        {
            if (excludeMatchers.Count == 0)
            {
                return false;
            }

            return EnumerateGlobMatchCandidates(relativePath)
                .Any(candidate => excludeMatchers.Any(matcher => matcher.IsMatch(candidate) == true));
        }

        private static IEnumerable<string> EnumerateGlobMatchCandidates(string relativePath)
        {
            var normalizedRelativePath = NormalizeRelativeFilePath(relativePath);
            var segments = normalizedRelativePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            for (var index = 0; index < segments.Length; index++)
            {
                yield return string.Join("/", segments.Take(index + 1));
            }
        }

        private static char NormalizeOperation(string? value)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return 'C';
            }

            var operation = char.ToUpperInvariant(value.Trim()[0]);
            return operation switch
            {
                'C' => 'C',
                'U' => 'U',
                'D' => 'D',
                _ => throw new InvalidOperationException($"작업구분 값 확인이 필요합니다. Operation={value}")
            };
        }

        private static long ParseFileSize(string value)
        {
            if (long.TryParse(value.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var fileSize) == false || fileSize < 0)
            {
                throw new InvalidOperationException($"파일 크기 값 확인이 필요합니다. FileSize={value}");
            }

            return fileSize;
        }

        private static string NormalizeMd5(string value)
        {
            var md5 = value.Trim();
            if (string.IsNullOrWhiteSpace(md5) == true || md5 == "-")
            {
                return string.Empty;
            }

            if (Regex.IsMatch(md5, "^[0-9a-fA-F]{32}$", RegexOptions.CultureInvariant) == false)
            {
                throw new InvalidOperationException($"MD5 값 확인이 필요합니다. MD5={value}");
            }

            return md5.ToUpperInvariant();
        }

        private static DateTimeOffset ParseModifiedAt(string value)
        {
            var modifiedAt = value.Trim();
            if (string.IsNullOrWhiteSpace(modifiedAt) == true || modifiedAt == "-")
            {
                return default;
            }

            if (DateTimeOffset.TryParse(modifiedAt, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsedValue) == false)
            {
                throw new InvalidOperationException($"변경일시 값 확인이 필요합니다. ModifiedAt={value}");
            }

            return parsedValue.ToUniversalTime();
        }

        private static string ComputeMd5(string filePath)
        {
            using var stream = File.OpenRead(filePath);
            using var md5 = MD5.Create();
            return Convert.ToHexString(md5.ComputeHash(stream));
        }

        private static void WriteFileList(string filePath, IEnumerable<PackageFileEntry> entries)
        {
            File.WriteAllLines(filePath, entries.Select(FormatFileListEntry));
        }

        private static string FormatFileListEntry(PackageFileEntry entry)
        {
            var modifiedAtValue = entry.ModifiedAt == default
                ? "-"
                : entry.ModifiedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture);
            var md5Value = string.IsNullOrWhiteSpace(entry.Md5) == true ? "-" : entry.Md5.ToUpperInvariant();
            return $"{NormalizeOperation(entry.Operation.ToString(CultureInfo.InvariantCulture))}|{entry.RelativePath}|{entry.FileSize.ToString(CultureInfo.InvariantCulture)}|{md5Value}|{modifiedAtValue}";
        }

        private static string CreatePackageFileName(string packagesPath, string packagePrefix, DateTimeOffset timestamp)
        {
            var yearMonth = timestamp.ToString("yyyy.MM", CultureInfo.InvariantCulture);
            var regex = new Regex($"^{Regex.Escape(packagePrefix)}-{Regex.Escape(yearMonth)}\\.(\\d+)\\.zip$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

            var nextRollingNumber = Directory.Exists(packagesPath) == true
                ? Directory.GetFiles(packagesPath, $"{packagePrefix}-{yearMonth}.*.zip", SearchOption.TopDirectoryOnly)
                    .Select(filePath => regex.Match(Path.GetFileName(filePath)))
                    .Where(match => match.Success == true)
                    .Select(match => int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture))
                    .DefaultIfEmpty(0)
                    .Max() + 1
                : 1;

            return $"{packagePrefix}-{yearMonth}.{nextRollingNumber:D3}.zip";
        }

        private static string ToRelativePath(string handstackRootPath, string filePath)
        {
            return Path.GetRelativePath(handstackRootPath, filePath).Replace('\\', '/');
        }

        private static string RequireOptionValue(string optionName, string? value)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                throw new ArgumentException($"{optionName} 값 확인이 필요합니다.");
            }

            return value;
        }

        private static string FormatArguments(string[] args)
        {
            return args.Length == 0
                ? "(none)"
                : string.Join(" ", args);
        }

        private static string FormatOptionValue(string? value, string? fallbackValue = null)
        {
            if (string.IsNullOrWhiteSpace(value) == false)
            {
                return value;
            }

            return string.IsNullOrWhiteSpace(fallbackValue) == true ? "(auto)" : fallbackValue;
        }

        private static Action<int, int> CreateConsoleProgressReporter()
        {
            var lineWidth = 0;
            return (current, total) =>
            {
                if (total <= 0)
                {
                    return;
                }

                var message = $"진행 중 ({current}/{total})";
                if (Console.IsOutputRedirected == true)
                {
                    if (current == total || current == 1 || current % 100 == 0)
                    {
                        Console.WriteLine(message);
                    }

                    return;
                }

                lineWidth = Math.Max(lineWidth, message.Length);
                Console.Write($"\r{message.PadRight(lineWidth)}");
                if (current >= total)
                {
                    Console.WriteLine();
                    lineWidth = 0;
                }
            };
        }

        private static string ConfigureLogger(string entryBasePath)
        {
            var resolvedLogDirectoryPath = Path.GetFullPath(Path.Combine(entryBasePath, "log"));
            Directory.CreateDirectory(resolvedLogDirectoryPath);
            var resolvedLogFilePath = Path.Combine(resolvedLogDirectoryPath, "publish-package.log");
            logFilePath = resolvedLogFilePath;

            lock (LogSyncRoot)
            {
                if (logFileConfigured == false)
                {
                    Log.Logger = new LoggerConfiguration()
                        .MinimumLevel.Information()
                        .WriteTo.Console()
                        .WriteTo.File(
                            path: resolvedLogFilePath,
                            rollingInterval: RollingInterval.Day,
                            shared: true)
                        .CreateLogger();
                    logFileConfigured = true;
                }
            }

            Log.Information("[CLI/publish-package]" + "publish-package 로그를 초기화했습니다. LogFilePath={0}", logFilePath);
            return resolvedLogDirectoryPath;
        }

        private static async Task DebuggerAttach(bool debug)
        {
            if (debug == true)
            {
                var startupAwaitDelay = 10000;
                startupAwaitTimer = new System.Timers.Timer(1000);
                startupAwaitTimer.Elapsed += (object? sender, System.Timers.ElapsedEventArgs e) =>
                {
                    if (startupAwaitTimer != null && Debugger.IsAttached == true)
                    {
                        startupAwaitTimer.Stop();
                        cancellationTokenSource.Cancel();
                    }
                };
                startupAwaitTimer.Start();

                try
                {
                    await Task.Delay(startupAwaitDelay, cancellationTokenSource.Token);
                }
                catch
                {
                }

                if (Debugger.IsAttached == true)
                {
                    Debugger.Break();
                }
            }
        }
    }
}

