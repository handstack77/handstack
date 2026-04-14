using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using command.DataClient;
using command.Encapsulation;
using command.Entity;
using command.Events;
using command.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Modules;

using MediatR;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

using Newtonsoft.Json;

using Serilog;
using Serilog.Events;
using Serilog.Sinks.SystemConsole.Themes;

namespace command
{
    public class ModuleInitializer : IModuleInitializer
    {
        public string? ModuleID;

        public ModuleInitializer()
        {
            ModuleID = typeof(ModuleInitializer).Assembly.GetName().Name;
        }

        public void ConfigureServices(IServiceCollection services, IWebHostEnvironment environment, IConfiguration configuration)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (module != null)
            {
                var moduleSettingFilePath = module.ModuleSettingFilePath;
                if (File.Exists(moduleSettingFilePath) == true)
                {
                    var configurationText = File.ReadAllText(moduleSettingFilePath);
                    var moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                    if (moduleConfigJson != null)
                    {
                        var moduleConfig = moduleConfigJson.ModuleConfig;
                        ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
                        ModuleConfiguration.Version = moduleConfigJson.Version;
                        ModuleConfiguration.AuthorizationKey = !string.IsNullOrWhiteSpace(moduleConfig.AuthorizationKey) ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.CircuitBreakResetSecond = moduleConfig.CircuitBreakResetSecond;
                        ModuleConfiguration.DefaultCommandTimeout = moduleConfig.DefaultCommandTimeout;
                        ModuleConfiguration.DefaultMaxOutputBytes = moduleConfig.DefaultMaxOutputBytes;
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;

                        foreach (var fileSyncManager in ModuleConfiguration.CommandFileSyncManager.Values)
                        {
                            fileSyncManager.Dispose();
                        }

                        ModuleConfiguration.CommandFileSyncManager.Clear();
                        ModuleConfiguration.ContractBasePath.Clear();
                        ModuleConfiguration.IsContractFileWatching = moduleConfig.IsContractFileWatching;
                        foreach (var basePath in moduleConfig.ContractBasePath ?? new List<string>())
                        {
                            var contractBasePath = GlobalConfiguration.GetBaseDirectoryPath(basePath);
                            if (string.IsNullOrWhiteSpace(contractBasePath) == false && ModuleConfiguration.ContractBasePath.Contains(contractBasePath) == false)
                            {
                                ModuleConfiguration.ContractBasePath.Add(contractBasePath);
                            }
                        }

                        ModuleConfiguration.IsTransactionLogging = moduleConfig.IsTransactionLogging;
                        ModuleConfiguration.ModuleLogFilePath = string.IsNullOrWhiteSpace(moduleConfig.ModuleLogFilePath) ? "command.log" : new FileInfo(moduleConfig.ModuleLogFilePath).FullName.Replace("\\", "/");
                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            var loggerConfiguration = CreateLoggerConfiguration(ModuleConfiguration.ModuleLogFilePath);
                            ModuleConfiguration.ModuleLogger = loggerConfiguration.CreateLogger();
                        }

                        ModuleConfiguration.AllowClientIP = (moduleConfig.AllowClientIP ?? new List<string>())
                            .Where(p => string.IsNullOrWhiteSpace(p) == false)
                            .Select(p => p.Trim())
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .ToList();
                        if (ModuleConfiguration.AllowClientIP.Count == 0)
                        {
                            ModuleConfiguration.AllowClientIP.Add("*");
                        }

                        ModuleConfiguration.IsConfigure = true;
                    }
                    else
                    {
                        var message = $"Json Deserialize 오류 module.json 파일 확인 필요: {moduleSettingFilePath}";
                        Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                        throw new FileLoadException(message);
                    }
                }
                else
                {
                    var message = $"module.json 파일 확인 필요: {moduleSettingFilePath}";
                    Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                    throw new FileNotFoundException(message);
                }

                CommandMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);

                services.AddHttpClient(ModuleConfiguration.ModuleID);
                services.AddSingleton(new CommandLoggerClient(Log.Logger, ModuleConfiguration.ModuleLogger));
                services.AddTransient<ICommandDataClient, CommandDataClient>();
                services.AddTransient<IRequestHandler<CommandRefreshRequest, bool>, CommandRefreshRequestHandler>();
            }
        }

        private static LoggerConfiguration CreateLoggerConfiguration(string logFilePath)
        {
            var fileInfo = new FileInfo(logFilePath);
            if (!string.IsNullOrWhiteSpace(fileInfo.DirectoryName))
            {
                if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
                {
                    Directory.CreateDirectory(fileInfo.DirectoryName);
                }

                if (string.IsNullOrWhiteSpace(GlobalConfiguration.ProcessName))
                {
                    logFilePath = fileInfo.FullName.Replace("\\", "/");
                }
                else
                {
                    logFilePath = PathExtensions.Combine(fileInfo.DirectoryName, GlobalConfiguration.ProcessName + "_" + fileInfo.Name);
                }
            }

            var loggerConfiguration = new LoggerConfiguration()
                .Enrich.FromLogContext()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Error)
                .MinimumLevel.Override("System", LogEventLevel.Error)
                .WriteTo.Console(
                    outputTemplate: "[{Timestamp:HH:mm:ss.fff} {Level:u3}] {Message:lj}{NewLine}{Exception}",
                    theme: AnsiConsoleTheme.Code)
                .WriteTo.File(
                    path: logFilePath,
                    outputTemplate: "[{Timestamp:HH:mm:ss.fff} {Level:u3}] {Message:lj}{NewLine}{Exception}",
                    fileSizeLimitBytes: 104857600,
                    rollOnFileSizeLimit: true,
                    rollingInterval: RollingInterval.Day,
                    flushToDiskInterval: TimeSpan.FromSeconds(1),
                    buffered: true);
            return loggerConfiguration;
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (!string.IsNullOrWhiteSpace(ModuleID) && module != null)
            {
                var wwwrootDirectory = PathExtensions.Combine(module.BasePath, "wwwroot", module.ModuleID);
                if (!string.IsNullOrWhiteSpace(wwwrootDirectory) && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(PathExtensions.Combine(wwwrootDirectory)),
                        RequestPath = "/" + ModuleID,
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = httpContext =>
                        {
                            if (WithOnlyIPFilter.TryRejectStaticFile(httpContext.Context, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure") == true)
                            {
                                return;
                            }

                            var policy = corsPolicyProvider.GetPolicyAsync(httpContext.Context, null)
                            .ConfigureAwait(false)
                            .GetAwaiter().GetResult();

                            if (policy != null)
                            {
                                try
                                {
                                    var corsResult = corsService.EvaluatePolicy(httpContext.Context, policy);
                                    corsService.ApplyResult(corsResult, httpContext.Context.Response);
                                }
                                catch
                                {
                                    Log.Logger.Warning("[{LogCategory}] corsService.ApplyResult 확인 필요 {RequestPath}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure", httpContext.Context.Request.Path);
                                }
                            }
                        }
                    });
                }
            }

            var serviceScopeFactory = app.ApplicationServices.GetRequiredService<IServiceScopeFactory>();
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                if (Directory.Exists(basePath) == true && basePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == false && ModuleConfiguration.IsContractFileWatching == true)
                {
                    var fileSyncManager = new FileSyncManager(basePath, "*.xml");
                    fileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                    {
                        if (GlobalConfiguration.IsRunning == true && fileInfo.FullName.Replace("\\", "/").IndexOf(basePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                        {
                            var filePath = fileInfo.FullName.Replace("\\", "/").Replace(basePath.Replace("\\", "/"), "");
                            try
                            {
                                using var scope = serviceScopeFactory.CreateScope();
                                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                                var actionResult = await mediator.Send(new CommandRefreshRequest(changeTypes.ToString(), filePath, null, null));
                                if (actionResult == false && changeTypes != WatcherChangeTypes.Deleted)
                                {
                                    Log.Warning("[{LogCategory}] {FilePath} 파일 갱신 확인 필요.", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure", filePath);
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Error(exception, "[{LogCategory}] {FilePath} 파일 갱신 확인 필요.", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure", filePath);
                            }
                        }
                    };

                    Log.Information("[{LogCategory}] Command File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");

                    fileSyncManager.Start();
                    if (ModuleConfiguration.CommandFileSyncManager.TryGetValue(basePath, out var existingFileSyncManager) == true)
                    {
                        existingFileSyncManager.Dispose();
                    }

                    ModuleConfiguration.CommandFileSyncManager[basePath] = fileSyncManager;
                }
            }
        }
    }

    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("command");
        }
    }
}
