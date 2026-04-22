using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using graphclient.DataClient;
using graphclient.Encapsulation;
using graphclient.Entity;
using graphclient.Events;
using graphclient.Extensions;

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

namespace graphclient
{
    public class ModuleInitializer : IModuleInitializer
    {
        public ModuleInitializer()
        {
            ModuleID = typeof(ModuleInitializer).Assembly.GetName().Name;
        }

        public string? ModuleID;

        public void ConfigureServices(IServiceCollection services, IWebHostEnvironment environment, IConfiguration configuration)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(item => item.ModuleID == ModuleID);
            if (module == null)
            {
                return;
            }

            var moduleSettingFilePath = module.ModuleSettingFilePath;
            if (File.Exists(moduleSettingFilePath) == false)
            {
                var message = $"module.json 파일 확인 필요: {moduleSettingFilePath}";
                Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                throw new FileNotFoundException(message);
            }

            var configurationText = File.ReadAllText(moduleSettingFilePath);
            var moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);
            if (moduleConfigJson == null)
            {
                var message = $"Json Deserialize 오류 module.json 파일 확인 필요: {moduleSettingFilePath}";
                Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                throw new FileLoadException(message);
            }

            var moduleConfig = moduleConfigJson.ModuleConfig;
            ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
            ModuleConfiguration.Version = moduleConfigJson.Version;
            ModuleConfiguration.AuthorizationKey = string.IsNullOrWhiteSpace(moduleConfig.AuthorizationKey)
                ? GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName
                : moduleConfig.AuthorizationKey;
            ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
            ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
            ModuleConfiguration.CircuitBreakResetSecond = moduleConfig.CircuitBreakResetSecond;
            ModuleConfiguration.DefaultCommandTimeout = moduleConfig.DefaultCommandTimeout;
            ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
            ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;

            foreach (var fileSyncManager in ModuleConfiguration.GraphFileSyncManager.Values)
            {
                fileSyncManager.Dispose();
            }

            ModuleConfiguration.GraphFileSyncManager.Clear();
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
            ModuleConfiguration.ModuleLogFilePath = string.IsNullOrWhiteSpace(moduleConfig.ModuleLogFilePath)
                ? "transaction.log"
                : new FileInfo(moduleConfig.ModuleLogFilePath).FullName.Replace("\\", "/");
            ModuleConfiguration.ModuleLogger = ModuleConfiguration.IsTransactionLogging == true
                ? CreateLoggerConfiguration(ModuleConfiguration.ModuleLogFilePath).CreateLogger()
                : null;

            ModuleConfiguration.IsProfileLogging = moduleConfig.IsProfileLogging;
            ModuleConfiguration.ProfileLogFilePath = string.IsNullOrWhiteSpace(moduleConfig.ProfileLogFilePath)
                ? "profile.log"
                : new FileInfo(moduleConfig.ProfileLogFilePath).FullName.Replace("\\", "/");
            ModuleConfiguration.ProfileLogger = ModuleConfiguration.IsProfileLogging == true
                ? CreateLoggerConfiguration(ModuleConfiguration.ProfileLogFilePath).CreateLogger()
                : null;

            ModuleConfiguration.DefaultDataSourceID = moduleConfig.DefaultDataSourceID;
            ModuleConfiguration.GraphDataSource = moduleConfig.GraphDataSource ?? new List<GraphDataSource>();
            ModuleConfiguration.AllowClientIP = (moduleConfig.AllowClientIP ?? new List<string>())
                .Where(item => string.IsNullOrWhiteSpace(item) == false)
                .Select(item => item.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (ModuleConfiguration.AllowClientIP.Count == 0)
            {
                ModuleConfiguration.AllowClientIP.Add("*");
            }

            ModuleConfiguration.IsConfigure = true;

            GraphMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);

            services.AddSingleton(new GraphClientLoggerClient(Log.Logger, ModuleConfiguration.ModuleLogger));
            services.AddTransient<IGraphDataClient, GraphDataClient>();
            services.AddTransient<IRequestHandler<GraphClientRequest, object?>, GraphClientRequestHandler>();
            services.AddTransient<IRequestHandler<ManagedRequest, object?>, ManagedRequestHandler>();
            services.AddTransient<IRequestHandler<QueryRefreshRequest, bool>, QueryRefreshRequestHandler>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            var module = GlobalConfiguration.Modules.FirstOrDefault(item => item.ModuleID == ModuleID);
            if (string.IsNullOrWhiteSpace(ModuleID) == false && module != null)
            {
                var wwwrootDirectory = PathExtensions.Combine(module.BasePath, "wwwroot", module.ModuleID);
                if (string.IsNullOrWhiteSpace(wwwrootDirectory) == false && Directory.Exists(wwwrootDirectory) == true)
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
                                .GetAwaiter()
                                .GetResult();

                            if (policy == null)
                            {
                                return;
                            }

                            try
                            {
                                var corsResult = corsService.EvaluatePolicy(httpContext.Context, policy);
                                corsService.ApplyResult(corsResult, httpContext.Context.Response);
                            }
                            catch
                            {
                                Log.Logger.Warning("[{LogCategory}] " + $"corsService.ApplyResult 확인 필요 {httpContext.Context.Request.Path}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                            }
                        }
                    });
                }
            }

            var serviceScopeFactory = app.ApplicationServices.GetRequiredService<IServiceScopeFactory>();
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                if (Directory.Exists(basePath) == false
                    || basePath.StartsWith(GlobalConfiguration.TenantAppBasePath, StringComparison.OrdinalIgnoreCase)
                    || ModuleConfiguration.IsContractFileWatching == false)
                {
                    continue;
                }

                var fileSyncManager = new FileSyncManager(basePath, "*.xml");
                fileSyncManager.MonitoringFile += async (changeTypes, fileInfo) =>
                {
                    if (GlobalConfiguration.IsRunning == false
                        || fileInfo.FullName.Replace("\\", "/").IndexOf(basePath, StringComparison.OrdinalIgnoreCase) < 0
                        || (changeTypes != WatcherChangeTypes.Deleted && changeTypes != WatcherChangeTypes.Created && changeTypes != WatcherChangeTypes.Changed))
                    {
                        return;
                    }

                    var filePath = fileInfo.FullName.Replace("\\", "/").Replace(basePath, "");
                    try
                    {
                        using var scope = serviceScopeFactory.CreateScope();
                        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                        var actionResult = await mediator.Send(new QueryRefreshRequest(changeTypes.ToString(), filePath, null, null));
                        if (actionResult == false && changeTypes != WatcherChangeTypes.Deleted)
                        {
                            Log.Warning("[{LogCategory}] " + $"{filePath} 파일 갱신 확인 필요.", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[{LogCategory}] " + $"{filePath} 파일 갱신 확인 필요.", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                    }
                };

                Log.Information("[{LogCategory}] Graph File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");

                fileSyncManager.Start();
                if (ModuleConfiguration.GraphFileSyncManager.TryGetValue(basePath, out var existingFileSyncManager) == true)
                {
                    existingFileSyncManager.Dispose();
                }

                ModuleConfiguration.GraphFileSyncManager[basePath] = fileSyncManager;
            }
        }

        private static LoggerConfiguration CreateLoggerConfiguration(string logFilePath)
        {
            var fileInfo = new FileInfo(logFilePath);
            if (string.IsNullOrWhiteSpace(fileInfo.DirectoryName) == false)
            {
                if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
                {
                    Directory.CreateDirectory(fileInfo.DirectoryName);
                }

                logFilePath = string.IsNullOrWhiteSpace(GlobalConfiguration.ProcessName)
                    ? fileInfo.FullName.Replace("\\", "/")
                    : PathExtensions.Combine(fileInfo.DirectoryName, GlobalConfiguration.ProcessName + "_" + fileInfo.Name);
            }

            return new LoggerConfiguration()
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
        }
    }

    internal class Program
    {
        private static void Main(string[] args)
        {
            Console.WriteLine("graphclient");
        }
    }
}

