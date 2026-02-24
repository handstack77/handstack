using System;
using System.Collections.Generic;
using System.CommandLine;
using System.CommandLine.Parsing;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using forbes.Extensions;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

namespace forbes
{
    internal sealed class Program
    {
        public static async Task<int> Main(string[] args)
        {
            var debugOption = new Option<bool>("--debug")
            {
                Description = "디버그 모드로 연결 하기 위해 실행 지연을 시작 합니다. (기본값: false)",
                DefaultValueFactory = _ => false
            };

            var delayOption = new Option<int>("--delay")
            {
                Description = "지연 시간을 초 단위로 설정 합니다. (기본값: 10)",
                DefaultValueFactory = _ => 10
            };

            var rootCommand = new RootCommand();
            rootCommand.Options.Add(debugOption);
            rootCommand.Options.Add(delayOption);

            ParseResult argument = rootCommand.Parse(args);

            foreach (ParseError parseError in argument.Errors)
            {
                Console.Error.WriteLine(parseError.Message);
            }

            if (argument.Errors.Count > 0)
            {
                return 1;
            }

            bool debugMode = argument.GetValue(debugOption);
            int debugDelay = argument.GetValue(delayOption);

            if (debugMode && !Debugger.IsAttached)
            {
                WaitForDebuggerOrTimeout(debugDelay);
            }

            var builder = WebApplication.CreateBuilder(args);
            builder.Configuration.AddJsonFile("sync-setting.json", optional: true, reloadOnChange: true);
            string[] allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("StaticFilesCorsPolicy", policy =>
                {
                    if (allowedOrigins.Length > 0)
                    {
                        policy.WithOrigins(allowedOrigins)
                              .AllowAnyMethod()
                              .AllowAnyHeader()
                              .AllowCredentials();
                    }
                    else
                    {
                        policy.SetIsOriginAllowed(_ => false);
                    }
                });
            });
            builder.Services.AddControllers();
            builder.Services.AddDirectoryBrowser();

            var app = builder.Build();

            string entryDirectoryPath = builder.Configuration["EntryDirectoryPath"] as string ?? "";
            if (string.IsNullOrEmpty(entryDirectoryPath) || !Directory.Exists(entryDirectoryPath))
            {
                entryDirectoryPath = AppDomain.CurrentDomain.BaseDirectory;
            }

            TraceLogger.Init(entryDirectoryPath);
            TraceLogger.Info($"서버 시작 경로: {entryDirectoryPath}");

            await StartCodeSynchronization(builder.Configuration, entryDirectoryPath);

            string wwwRootBasePath = builder.Configuration["WWWRootBasePath"] ?? "";
            if (string.IsNullOrEmpty(wwwRootBasePath))
            {
                wwwRootBasePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot");
            }

            string contractBasePath = builder.Configuration["ContractBasePath"] ?? "";
            string contractRequestPath = builder.Configuration["ContractRequestPath"] ?? "view";
            bool isContractRequestPath = false;

            if (!string.IsNullOrEmpty(contractBasePath))
            {
                string contractDirectoryPath = Path.Combine(contractBasePath, "forbes");
                if (Directory.Exists(contractDirectoryPath))
                {
                    isContractRequestPath = true;
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(contractDirectoryPath),
                        RequestPath = "/" + contractRequestPath,
                        ServeUnknownFileTypes = true
                    });

                    TraceLogger.Info($"계약 파일 제공 경로: {contractDirectoryPath}");
                    TraceLogger.Info($"계약 파일 요청 경로: /{contractRequestPath}");
                }
            }

            if (Directory.Exists(wwwRootBasePath))
            {
                app.UseCors("StaticFilesCorsPolicy");

                app.UseDefaultFiles(new DefaultFilesOptions
                {
                    FileProvider = new PhysicalFileProvider(wwwRootBasePath)
                });

                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new PhysicalFileProvider(wwwRootBasePath),
                    RequestPath = "",
                    ServeUnknownFileTypes = true,
                    OnPrepareResponse = httpContext =>
                    {
                        if (isContractRequestPath && httpContext.Context.Request.Path.ToString().StartsWith($"/{contractRequestPath}/"))
                        {
                            httpContext.Context.Response.StatusCode = StatusCodes.Status404NotFound;
                            httpContext.Context.Response.ContentLength = 0;
                            httpContext.Context.Response.Body = Stream.Null;
                            return;
                        }

                        if (httpContext.Context.Request.Path.ToString().IndexOf("syn.loader.", StringComparison.OrdinalIgnoreCase) > -1)
                        {
                            if (!httpContext.Context.Response.Headers.ContainsKey("Cache-Control"))
                            {
                                httpContext.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store");
                            }

                            if (!httpContext.Context.Response.Headers.ContainsKey("Expires"))
                            {
                                httpContext.Context.Response.Headers.Append("Expires", "-1");
                            }
                        }

                        if (httpContext.Context.Response.Headers.ContainsKey("p3p"))
                        {
                            httpContext.Context.Response.Headers.Remove("p3p");
                        }

                        httpContext.Context.Response.Headers.Append("p3p", "CP=\"ALL ADM DEV PSAi COM OUR OTRo STP IND ONL\"");
                    }
                });

                string libDirectoryPath = Path.Combine(wwwRootBasePath, "lib");
                if (Directory.Exists(libDirectoryPath))
                {
                    app.UseDirectoryBrowser(new DirectoryBrowserOptions
                    {
                        FileProvider = new PhysicalFileProvider(libDirectoryPath),
                        RequestPath = "/lib",
                        RedirectToAppendTrailingSlash = false
                    });

                    TraceLogger.Info($"디렉터리 탐색 활성화 경로: {libDirectoryPath}");
                }

                TraceLogger.Info($"정적 파일 제공 경로: {wwwRootBasePath}");
            }
            else
            {
                TraceLogger.Error($"WWWRootBasePath 경로를 찾을 수 없습니다: {wwwRootBasePath}");
            }

            app.MapControllers();
            await app.RunAsync();
            return 0;
        }

        private static async Task StartCodeSynchronization(IConfiguration configuration, string entryDirectoryPath)
        {
            string codeMergeMethod = configuration["CodeMegerMethod"] ?? configuration["CodeMergeMethod"] ?? "Manual";

            if (codeMergeMethod.Equals("Manual", StringComparison.OrdinalIgnoreCase))
            {
                TraceLogger.Info("CodeMegerMethod가 Manual 입니다. 코드 동기화를 수행하지 않습니다.");
                return;
            }

            if (codeMergeMethod.Equals("FileSync", StringComparison.OrdinalIgnoreCase))
            {
                StartContractFileMonitoringByFileSync(configuration, entryDirectoryPath);
                return;
            }

            if (codeMergeMethod.Equals("GitHub", StringComparison.OrdinalIgnoreCase))
            {
                await StartContractFileMonitoringByGitHub(configuration, entryDirectoryPath);
                return;
            }

            TraceLogger.Error($"알 수 없는 CodeMegerMethod 값입니다: {codeMergeMethod}. 코드 동기화를 수행하지 않습니다.");
        }

        private static void StartContractFileMonitoringByFileSync(IConfiguration configuration, string entryDirectoryPath)
        {
            string fileSyncServer = configuration["FileSyncServer"] ?? "";
            if (string.IsNullOrWhiteSpace(fileSyncServer))
            {
                TraceLogger.Info("FileSyncServer 값이 비어 있어 FileSync 코드 동기화를 비활성화합니다.");
                return;
            }

            string contractsBasePath = ResolveContractsBasePath(configuration, entryDirectoryPath);
            if (!Directory.Exists(contractsBasePath))
            {
                TraceLogger.Error($"ContractsBasePath 경로를 찾을 수 없습니다: {contractsBasePath}");
                return;
            }

            foreach (var monitorTarget in GetMonitorTargets())
            {
                string watchBasePath = Path.Combine(contractsBasePath, monitorTarget.RelativePath);
                if (!Directory.Exists(watchBasePath))
                {
                    continue;
                }

                var fileSyncManager = new FileSyncManager(watchBasePath, monitorTarget.Filter);
                fileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                {
                    if (!IsTargetContractFile(monitorTarget.ModuleName, fileInfo))
                    {
                        return;
                    }

                    string relativePath = GetRelativePath(fileInfo.FullName, watchBasePath);

                    var syncResult = await ContractSyncClient.UploadAndRefreshFromFileAsync(fileSyncServer, monitorTarget.ModuleName, changeTypes, relativePath, fileInfo.FullName);
                    if (!syncResult.Success)
                    {
                        TraceLogger.Error($"계약 동기화 실패. 모듈: {monitorTarget.ModuleName}, 경로: {relativePath}, 메시지: {syncResult.Message}");
                    }
                    else
                    {
                        TraceLogger.Info($"계약 동기화 완료. 모듈: {monitorTarget.ModuleName}, 경로: {relativePath}, 변경 유형: {changeTypes}");
                    }
                };

                fileSyncManager.Start();
                ForbesConfiguration.ContractFileSyncManagers.Add(fileSyncManager);
                TraceLogger.Info($"FileSync 계약 파일 모니터링 시작. 모듈: {monitorTarget.ModuleName}, 경로: {watchBasePath}");
            }
        }

        private static async Task StartContractFileMonitoringByGitHub(IConfiguration configuration, string entryDirectoryPath)
        {
            string gitHubRepositoryOwner = configuration["GitHubRepositoryOwner"] ?? "";
            string gitHubRepositoryName = configuration["GitHubRepositoryName"] ?? "";
            string gitHubRepositoryBranch = configuration["GitHubRepositoryBranch"] ?? "main";
            string gitHubRepositoryBasePath = configuration["GitHubRepositoryBasePath"] ?? "Contracts";
            string userName = configuration["UserName"] ?? "";
            string userEmail = configuration["UserEmail"] ?? "";

            if (string.IsNullOrWhiteSpace(gitHubRepositoryOwner) || string.IsNullOrWhiteSpace(gitHubRepositoryName))
            {
                TraceLogger.Error("GitHubRepositoryOwner 또는 GitHubRepositoryName 값이 비어 있어 GitHub 코드 동기화를 비활성화합니다.");
                return;
            }

            var gitHubSyncManager = GitHubSyncManager.CreateFromConfiguration(configuration);

            string contractsBasePath = ResolveContractsBasePath(configuration, entryDirectoryPath);
            if (!Directory.Exists(contractsBasePath))
            {
                TraceLogger.Error($"ContractsBasePath 경로를 찾을 수 없습니다: {contractsBasePath}");
                return;
            }

            var monitorTargets = GetGitHubMonitorTargets();
            await SyncContractsFromGitHubOnStartupAsync(
                gitHubSyncManager,
                gitHubRepositoryOwner,
                gitHubRepositoryName,
                gitHubRepositoryBranch,
                gitHubRepositoryBasePath,
                contractsBasePath,
                monitorTargets,
                userName,
                userEmail);

            foreach (var monitorTarget in monitorTargets)
            {
                string watchBasePath = Path.Combine(contractsBasePath, monitorTarget.RelativePath);
                if (!Directory.Exists(watchBasePath))
                {
                    continue;
                }

                var fileSyncManager = new FileSyncManager(watchBasePath, monitorTarget.Filter);
                fileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                {
                    try
                    {
                        if (!IsTargetContractFile(monitorTarget.ModuleName, fileInfo))
                        {
                            return;
                        }

                        string relativePath = GetRelativePath(fileInfo.FullName, watchBasePath);
                        string gitHubPath = BuildGitHubRepositoryPath(gitHubRepositoryBasePath, monitorTarget.ModuleName, relativePath);
                        string commitMessage = BuildGitHubCommitMessage(monitorTarget.ModuleName, changeTypes.ToString(), relativePath, userName, userEmail);

                        if (changeTypes == WatcherChangeTypes.Deleted)
                        {
                            await gitHubSyncManager.DeleteFileAsync(
                                gitHubRepositoryOwner,
                                gitHubRepositoryName,
                                gitHubRepositoryBranch,
                                gitHubPath,
                                commitMessage);

                            TraceLogger.Info($"GitHub 삭제 동기화 요청. 모듈: {monitorTarget.ModuleName}, 경로: {gitHubPath}");
                            return;
                        }

                        if (!File.Exists(fileInfo.FullName))
                        {
                            return;
                        }

                        string fileContent = await File.ReadAllTextAsync(fileInfo.FullName);
                        await gitHubSyncManager.UpsertFileAsync(
                            gitHubRepositoryOwner,
                            gitHubRepositoryName,
                            gitHubRepositoryBranch,
                            gitHubPath,
                            fileContent,
                            commitMessage);

                        TraceLogger.Info($"GitHub 업로드 동기화 요청. 모듈: {monitorTarget.ModuleName}, 경로: {gitHubPath}, 변경 유형: {changeTypes}");
                    }
                    catch (Exception exception)
                    {
                        TraceLogger.Error($"GitHub 동기화 처리 예외. 모듈: {monitorTarget.ModuleName}, 파일: {fileInfo.FullName}, 메시지: {exception.Message}");
                    }
                };

                fileSyncManager.Start();
                ForbesConfiguration.ContractFileSyncManagers.Add(fileSyncManager);
                TraceLogger.Info($"GitHub 계약 파일 모니터링 시작. 모듈: {monitorTarget.ModuleName}, 경로: {watchBasePath}");
            }
        }

        private static (string ModuleName, string RelativePath, string Filter)[] GetMonitorTargets()
        {
            return new (string ModuleName, string RelativePath, string Filter)[]
            {
                ("dbclient", "dbclient", "*.xml"),
                ("function", "function", "*.*"),
                ("transact", "transact", "*.json")
            };
        }

        private static (string ModuleName, string RelativePath, string Filter)[] GetGitHubMonitorTargets()
        {
            return new (string ModuleName, string RelativePath, string Filter)[]
            {
                ("dbclient", "dbclient", "*.xml"),
                ("function", "function", "*.*"),
                ("transact", "transact", "*.json"),
                ("wwwroot", "wwwroot", "*.*")
            };
        }

        private static string ResolveContractsBasePath(IConfiguration configuration, string entryDirectoryPath)
        {
            string contractsBasePath = configuration["ContractsBasePath"] ?? "";
            if (string.IsNullOrWhiteSpace(contractsBasePath))
            {
                contractsBasePath = Path.Combine(entryDirectoryPath, "Contracts");
            }

            return contractsBasePath;
        }

        private static string GetRelativePath(string fullFilePath, string basePath)
        {
            string relativePath = fullFilePath.Replace("\\", "/").Replace(basePath.Replace("\\", "/"), "");
            if (!relativePath.StartsWith("/", StringComparison.Ordinal))
            {
                relativePath = "/" + relativePath;
            }

            return relativePath;
        }

        private static string BuildGitHubRepositoryPath(string basePath, string moduleName, string relativePath)
        {
            string modulePath = BuildGitHubModulePath(basePath, moduleName);
            string normalizedRelativePath = (relativePath ?? "").Replace("\\", "/").TrimStart('/');

            if (!string.IsNullOrEmpty(modulePath))
            {
                return $"{modulePath}/{normalizedRelativePath}";
            }

            return $"{moduleName}/{normalizedRelativePath}";
        }

        private static string BuildGitHubModulePath(string basePath, string moduleName)
        {
            string prefix = (basePath ?? "").Replace("\\", "/").Trim('/');
            if (!string.IsNullOrWhiteSpace(prefix))
            {
                return $"{prefix}/{moduleName}";
            }

            return moduleName;
        }

        private static string GetRelativePathFromGitHubPath(string gitHubFilePath, string gitHubModulePath)
        {
            string normalizedFilePath = (gitHubFilePath ?? "").Replace("\\", "/");
            string normalizedModulePath = (gitHubModulePath ?? "").Replace("\\", "/").Trim('/');
            string modulePrefix = normalizedModulePath + "/";

            if (normalizedFilePath.StartsWith(modulePrefix, StringComparison.OrdinalIgnoreCase))
            {
                normalizedFilePath = normalizedFilePath.Substring(modulePrefix.Length);
            }

            if (!normalizedFilePath.StartsWith("/", StringComparison.Ordinal))
            {
                normalizedFilePath = "/" + normalizedFilePath;
            }

            return normalizedFilePath;
        }

        private static async Task SyncContractsFromGitHubOnStartupAsync(
            GitHubSyncManager gitHubSyncManager,
            string gitHubRepositoryOwner,
            string gitHubRepositoryName,
            string gitHubRepositoryBranch,
            string gitHubRepositoryBasePath,
            string contractsBasePath,
            (string ModuleName, string RelativePath, string Filter)[] monitorTargets,
            string userName,
            string userEmail)
        {
            TraceLogger.Info("GitHub 시작 동기화를 수행합니다.");

            foreach (var monitorTarget in monitorTargets)
            {
                string localModulePath = Path.Combine(contractsBasePath, monitorTarget.RelativePath);
                Directory.CreateDirectory(localModulePath);

                string gitHubModulePath = BuildGitHubModulePath(gitHubRepositoryBasePath, monitorTarget.ModuleName);
                IReadOnlyList<GitHubRepositoryTreeItem> repositoryFiles = await gitHubSyncManager.GetRepositoryContentsRecursiveAsync(
                    gitHubRepositoryOwner,
                    gitHubRepositoryName,
                    gitHubRepositoryBranch,
                    gitHubModulePath);

                var remoteRelativePaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                int updatedFileCount = 0;
                int deletedFileCount = 0;

                foreach (GitHubRepositoryTreeItem repositoryFile in repositoryFiles)
                {
                    var repositoryFileInfo = new FileInfo(repositoryFile.Path);
                    if (!IsTargetContractFile(monitorTarget.ModuleName, repositoryFileInfo))
                    {
                        continue;
                    }

                    string relativePath = GetRelativePathFromGitHubPath(repositoryFile.Path, gitHubModulePath);
                    if (relativePath == "/")
                    {
                        continue;
                    }

                    remoteRelativePaths.Add(relativePath);

                    string localFilePath = Path.Combine(localModulePath, relativePath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                    string? remoteContent = await gitHubSyncManager.GetFileTextContentAsync(
                        gitHubRepositoryOwner,
                        gitHubRepositoryName,
                        gitHubRepositoryBranch,
                        repositoryFile.Path);

                    if (remoteContent is null)
                    {
                        continue;
                    }

                    string? localDirectoryPath = Path.GetDirectoryName(localFilePath);
                    if (!string.IsNullOrWhiteSpace(localDirectoryPath))
                    {
                        Directory.CreateDirectory(localDirectoryPath);
                    }

                    bool shouldWrite = true;
                    if (File.Exists(localFilePath))
                    {
                        string localContent = await File.ReadAllTextAsync(localFilePath);
                        shouldWrite = !string.Equals(localContent, remoteContent, StringComparison.Ordinal);
                    }

                    if (shouldWrite)
                    {
                        await File.WriteAllTextAsync(localFilePath, remoteContent);
                        updatedFileCount++;
                    }
                }

                if (repositoryFiles.Count == 0)
                {
                    string defaultSubDirectoryPath = Path.Combine(localModulePath, "HDS");
                    Directory.CreateDirectory(defaultSubDirectoryPath);
                    TraceLogger.Info($"원격 파일이 없어 기본 하위 디렉터리를 생성했습니다. 모듈: {monitorTarget.ModuleName}, 경로: {defaultSubDirectoryPath}");

                    int pushedLocalFileCount = 0;
                    foreach (string localFilePath in Directory.GetFiles(localModulePath, "*", SearchOption.AllDirectories))
                    {
                        var localFileInfo = new FileInfo(localFilePath);
                        if (!IsTargetContractFile(monitorTarget.ModuleName, localFileInfo))
                        {
                            continue;
                        }

                        string relativePath = GetRelativePath(localFilePath, localModulePath);
                        string gitHubPath = BuildGitHubRepositoryPath(gitHubRepositoryBasePath, monitorTarget.ModuleName, relativePath);
                        string fileContent = await File.ReadAllTextAsync(localFilePath);
                        string commitMessage = BuildGitHubCommitMessage(monitorTarget.ModuleName, "초기 동기화 업로드", relativePath, userName, userEmail);

                        await gitHubSyncManager.UpsertFileAsync(
                            gitHubRepositoryOwner,
                            gitHubRepositoryName,
                            gitHubRepositoryBranch,
                            gitHubPath,
                            fileContent,
                            commitMessage);

                        pushedLocalFileCount++;
                    }

                    TraceLogger.Info($"원격 파일이 없어 로컬 파일 자동 업로드를 수행했습니다. 모듈: {monitorTarget.ModuleName}, 업로드 파일 수: {pushedLocalFileCount}");
                    TraceLogger.Info($"GitHub 시작 동기화에서 원격 파일이 없어 삭제 단계는 건너뜁니다. 모듈: {monitorTarget.ModuleName}");
                    TraceLogger.Info($"GitHub 시작 동기화 완료. 모듈: {monitorTarget.ModuleName}, 갱신 파일 수: {updatedFileCount}, 삭제 파일 수: {deletedFileCount}");
                    continue;
                }

                foreach (string localFilePath in Directory.GetFiles(localModulePath, "*", SearchOption.AllDirectories))
                {
                    var localFileInfo = new FileInfo(localFilePath);
                    if (!IsTargetContractFile(monitorTarget.ModuleName, localFileInfo))
                    {
                        continue;
                    }

                    string relativePath = GetRelativePath(localFilePath, localModulePath);
                    if (remoteRelativePaths.Contains(relativePath))
                    {
                        continue;
                    }

                    File.Delete(localFilePath);
                    deletedFileCount++;
                }

                TraceLogger.Info($"GitHub 시작 동기화 완료. 모듈: {monitorTarget.ModuleName}, 갱신 파일 수: {updatedFileCount}, 삭제 파일 수: {deletedFileCount}");
            }
        }

        private static bool IsTargetContractFile(string moduleName, FileInfo fileInfo)
        {
            if (moduleName == "dbclient")
            {
                return fileInfo.Extension.Equals(".xml", StringComparison.OrdinalIgnoreCase);
            }

            if (moduleName == "transact")
            {
                return fileInfo.Extension.Equals(".json", StringComparison.OrdinalIgnoreCase);
            }

            if (moduleName == "function")
            {
                return fileInfo.Name.StartsWith("featureMain", StringComparison.OrdinalIgnoreCase)
                    || fileInfo.Name.Equals("featureMeta.json", StringComparison.OrdinalIgnoreCase)
                    || fileInfo.Name.Equals("featureSQL.xml", StringComparison.OrdinalIgnoreCase);
            }

            if (moduleName == "wwwroot")
            {
                return true;
            }

            return false;
        }

        private static string BuildGitHubCommitMessage(string moduleName, string action, string relativePath, string userName, string userEmail)
        {
            string normalizedUserName = (userName ?? "").Trim();
            string normalizedUserEmail = (userEmail ?? "").Trim();
            string userSegment = "";

            if (!string.IsNullOrWhiteSpace(normalizedUserName) && !string.IsNullOrWhiteSpace(normalizedUserEmail))
            {
                userSegment = $" [user:{normalizedUserName}<{normalizedUserEmail}>]";
            }

            return $"{moduleName}: {action} {relativePath}{userSegment} [machine:{Environment.MachineName}]";
        }

        private static void WaitForDebuggerOrTimeout(int debugDelaySeconds)
        {
            var stopwatch = Stopwatch.StartNew();
            while (!Debugger.IsAttached && stopwatch.Elapsed.TotalSeconds < debugDelaySeconds)
            {
                if (Console.KeyAvailable && Console.ReadKey(true).Key == ConsoleKey.Escape)
                {
                    Console.WriteLine("디버거 연결을 건너뜁니다.");
                    break;
                }

                Thread.Sleep(100);
            }

            stopwatch.Stop();

            if (Debugger.IsAttached)
            {
                Console.WriteLine("디버거가 연결되었습니다!");
            }
            else
            {
                Console.WriteLine("디버거 없이 계속 진행합니다...");
            }
        }
    }

    internal static class ForbesConfiguration
    {
        public static List<IDisposable> ContractFileSyncManagers { get; } = new List<IDisposable>();
    }

    internal static class TraceLogger
    {
        public static void Init(string directoryPath)
        {
            string logDirectory = Path.Join(directoryPath, "tracelog");
            if (!Directory.Exists(logDirectory))
            {
                Directory.CreateDirectory(logDirectory);
            }

            string logFilePath = Path.Join(logDirectory, $"trace-{DateTime.Now:yyyy-MM-dd}.log");
            if (Trace.Listeners.OfType<TextWriterTraceListener>().All(l => l.Name != "FileLogger"))
            {
                var fileListener = new TextWriterTraceListener(logFilePath, "FileLogger");
                Trace.Listeners.Add(fileListener);
                Trace.AutoFlush = true;
            }
        }

        private static void LogMessage(string level, string message)
        {
            string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            string log = $"[{timestamp}] [{level}] {message}";
            Trace.WriteLine(log);
            Console.WriteLine(log);
        }

        public static void Info(string message) => LogMessage("INFO", message);
        public static void Debug(string message) => LogMessage("DEBUG", message);
        public static void Error(string message) => LogMessage("ERROR", message);
    }
}
