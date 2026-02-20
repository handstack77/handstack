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
using forbes.wwwroot.Controllers;

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
            TraceLogger.Info($"Server Started at: {entryDirectoryPath}");
            app.MapControllers();

            ForbesConfiguration.StaticFileCacheMaxAge = builder.Configuration.GetValue<int>("StaticFileCacheMaxAge", 0);
            StartContractFileMonitoring(builder.Configuration, entryDirectoryPath);

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

                    TraceLogger.Info($"Contract files serving from: {contractDirectoryPath}");
                    TraceLogger.Info($"Contract request path: /{contractRequestPath}");
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
                        else if (ForbesConfiguration.StaticFileCacheMaxAge > 0)
                        {
                            if (httpContext.Context.Response.Headers.ContainsKey("Cache-Control"))
                            {
                                httpContext.Context.Response.Headers.Remove("Cache-Control");
                            }

                            httpContext.Context.Response.Headers.Append("Cache-Control", $"public, max-age={ForbesConfiguration.StaticFileCacheMaxAge}");
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

                    TraceLogger.Info($"Directory browsing enabled for: {libDirectoryPath}");
                }

                TraceLogger.Info($"Static files serving from: {wwwRootBasePath}");
                TraceLogger.Info($"Allowed CORS origins: {string.Join(", ", allowedOrigins)}");
            }
            else
            {
                TraceLogger.Error($"WWWRootBasePath not found: {wwwRootBasePath}");
            }

            await app.RunAsync();
            return 0;
        }

        private static void StartContractFileMonitoring(IConfiguration configuration, string entryDirectoryPath)
        {
            string fileSyncServer = configuration["FileSyncServer"] ?? "";
            if (string.IsNullOrWhiteSpace(fileSyncServer))
            {
                TraceLogger.Info("FileSyncServer is empty. Contract file monitoring is disabled.");
                return;
            }

            string contractsBasePath = configuration["ContractsBasePath"] ?? "";
            if (string.IsNullOrWhiteSpace(contractsBasePath))
            {
                contractsBasePath = Path.Combine(entryDirectoryPath, "Contracts");
            }

            if (!Directory.Exists(contractsBasePath))
            {
                TraceLogger.Error($"ContractsBasePath not found: {contractsBasePath}");
                return;
            }

            var monitorTargets = new (string ModuleName, string RelativePath, string Filter)[]
            {
                ("dbclient", "dbclient", "*.xml"),
                ("function", "function", "*.*"),
                ("transact", "transact", "*.json")
            };

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
                    if (!IsTargetContractFile(monitorTarget.ModuleName, fileInfo))
                    {
                        return;
                    }

                    string relativePath = fileInfo.FullName.Replace("\\", "/").Replace(watchBasePath.Replace("\\", "/"), "");
                    if (!relativePath.StartsWith("/", StringComparison.Ordinal))
                    {
                        relativePath = "/" + relativePath;
                    }

                    var syncResult = await SyncController.UploadAndRefreshFromFileAsync(fileSyncServer, monitorTarget.ModuleName, changeTypes, relativePath, fileInfo.FullName);
                    if (!syncResult.Success)
                    {
                        TraceLogger.Error($"Contract sync failed. module: {monitorTarget.ModuleName}, path: {relativePath}, message: {syncResult.Message}");
                    }
                    else
                    {
                        TraceLogger.Info($"Contract sync completed. module: {monitorTarget.ModuleName}, path: {relativePath}, changeType: {changeTypes}");
                    }
                };

                fileSyncManager.Start();
                ForbesConfiguration.ContractFileSyncManagers.Add(fileSyncManager);
                TraceLogger.Info($"Contract file monitoring started. module: {monitorTarget.ModuleName}, path: {watchBasePath}");
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

            return false;
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
        public static int StaticFileCacheMaxAge { get; set; } = 0;
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

            string logFilePath = Path.Join(logDirectory, $"wol-trace-{DateTime.Now:yyyy-MM-dd}.log");
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
