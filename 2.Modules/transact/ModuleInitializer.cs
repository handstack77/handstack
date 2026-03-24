using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;

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

using transact.Entity;
using transact.Events;
using transact.Extensions;
using transact.Services;

namespace transact
{
    public class ModuleInitializer : IModuleInitializer
    {
        public string ModuleID;

        public ModuleInitializer()
        {
            ModuleID = typeof(ModuleInitializer).Assembly.GetName().Name.ToStringSafe();
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
                        ModuleConfiguration.SystemID = moduleConfig.SystemID;
                        ModuleConfiguration.AvailableEnvironment = moduleConfig.AvailableEnvironment;
                        ModuleConfiguration.UseApiAuthorize = moduleConfig.UseApiAuthorize;
                        ModuleConfiguration.TrustedProxyIP = string.IsNullOrWhiteSpace(moduleConfig.TrustedProxyIP) ? "1.1.1.1" : moduleConfig.TrustedProxyIP;
                        ModuleConfiguration.HasTrustedCheckIP = moduleConfig.HasTrustedCheckIP;
                        ModuleConfiguration.BypassAuthorizeIP = moduleConfig.BypassAuthorizeIP;
                        ModuleConfiguration.IsValidationRequest = moduleConfig.IsValidationRequest;
                        ModuleConfiguration.IsValidationGlobalID = moduleConfig.IsValidationGlobalID;
                        ModuleConfiguration.IsAllowDynamicRequest = moduleConfig.IsAllowDynamicRequest;
                        ModuleConfiguration.AllowTenantTransactionCommands = moduleConfig.AllowTenantTransactionCommands;
                        ModuleConfiguration.IsCodeDataCache = moduleConfig.IsCodeDataCache;
                        ModuleConfiguration.CodeDataCacheTimeout = moduleConfig.CodeDataCacheTimeout;
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.IsTransactAggregate = moduleConfig.IsTransactAggregate;
                        ModuleConfiguration.IsTransactAggregateRolling = moduleConfig.IsTransactAggregateRolling;
                        ModuleConfiguration.TransactAggregateDeleteOldCronTime = string.IsNullOrWhiteSpace(moduleConfig.TransactAggregateDeleteOldCronTime) ? "0 1 * * *" : moduleConfig.TransactAggregateDeleteOldCronTime.Trim();
                        ModuleConfiguration.IsDataMasking = moduleConfig.IsDataMasking;
                        ModuleConfiguration.MaskingChar = char.Parse((string.IsNullOrWhiteSpace(moduleConfig.MaskingChar) || moduleConfig.MaskingChar.Length != 1) ? "*" : moduleConfig.MaskingChar);
                        ModuleConfiguration.MaskingMethod = string.IsNullOrWhiteSpace(moduleConfig.MaskingMethod) ? "Syn" : moduleConfig.MaskingMethod;
                        ModuleConfiguration.IsTransactionLogging = moduleConfig.IsTransactionLogging;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;

                        foreach (var fileSyncManager in ModuleConfiguration.BusinessFileSyncManager.Values)
                        {
                            fileSyncManager.Dispose();
                        }

                        ModuleConfiguration.BusinessFileSyncManager.Clear();
                        ModuleConfiguration.ContractBasePath.Clear();
                        ModuleConfiguration.RoutingCommandUri.Clear();
                        ModuleConfiguration.AllowRequestTransactions.Clear();
                        ModuleConfiguration.PublicTransactions ??= new HandStack.Web.Extensions.ExpiringList<PublicTransaction>();
                        ModuleConfiguration.PublicTransactions.Clear();
                        ModuleConfiguration.IsContractFileWatching = moduleConfig.IsContractFileWatching;
                        foreach (var basePath in moduleConfig.ContractBasePath ?? new List<string>())
                        {
                            var contractBasePath = GlobalConfiguration.GetBaseDirectoryPath(basePath);
                            if (string.IsNullOrWhiteSpace(contractBasePath) == false && ModuleConfiguration.ContractBasePath.Contains(contractBasePath) == false)
                            {
                                ModuleConfiguration.ContractBasePath.Add(contractBasePath);
                            }
                        }

                        ModuleConfiguration.ModuleBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ModuleBasePath);
                        ModuleConfiguration.DatabaseContractPath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.DatabaseContractPath, PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "dbclient"));
                        ModuleConfiguration.TransactionAggregateBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.TransactionAggregateBasePath);

                        ModuleConfiguration.PublicTransactions = moduleConfig.PublicTransactions ?? new HandStack.Web.Extensions.ExpiringList<PublicTransaction>();
                        ModuleConfiguration.PublicTransactions.ExtendExpiryTime(DateTime.Now.AddYears(10));

                        foreach (var item in (moduleConfig.RoutingCommandUri ?? new Dictionary<string, string>()).AsEnumerable())
                        {
                            if (string.IsNullOrWhiteSpace(item.Key) == false && string.IsNullOrWhiteSpace(item.Value) == false)
                            {
                                ModuleConfiguration.RoutingCommandUri.Add(item.Key, item.Value, TimeSpan.FromDays(36500));
                            }
                        }

                        foreach (var item in (moduleConfig.AllowRequestTransactions ?? new Dictionary<string, List<string>>()).AsEnumerable())
                        {
                            if (string.IsNullOrWhiteSpace(item.Key) == true)
                            {
                                continue;
                            }

                            ModuleConfiguration.AllowRequestTransactions[item.Key] = (item.Value ?? new List<string>())
                                .Where(p => string.IsNullOrWhiteSpace(p) == false)
                                .Select(p => p.Trim())
                                .Distinct(StringComparer.OrdinalIgnoreCase)
                                .ToList();
                        }

                        ModuleConfiguration.BypassGlobalIDTransactions = (moduleConfig.BypassGlobalIDTransactions ?? new List<string>())
                            .Where(p => string.IsNullOrWhiteSpace(p) == false)
                            .Select(p => p.Trim())
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .ToList();
                        ModuleConfiguration.AllowTenantTransactionCommands = (moduleConfig.AllowTenantTransactionCommands ?? new List<string>())
                            .Where(p => string.IsNullOrWhiteSpace(p) == false)
                            .Select(p => p.Trim())
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .ToList();
                        ModuleConfiguration.BypassAuthorizeIP = (moduleConfig.BypassAuthorizeIP ?? new List<string>())
                            .Where(p => string.IsNullOrWhiteSpace(p) == false)
                            .Select(p => p.Trim())
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .ToList();
                        ModuleConfiguration.AvailableEnvironment = (moduleConfig.AvailableEnvironment ?? new List<string>())
                            .Where(p => string.IsNullOrWhiteSpace(p) == false)
                            .Select(p => p.Trim())
                            .Distinct(StringComparer.OrdinalIgnoreCase)
                            .ToList();
                        if (ModuleConfiguration.AvailableEnvironment.Count == 0)
                        {
                            ModuleConfiguration.AvailableEnvironment.Add("D");
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

                TransactionMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);

                services.AddSingleton(new TransactLoggerClient(Log.Logger));
                services.AddScoped<TransactClient>();
                services.AddTransient<IRequestHandler<TransactRequest, object?>, TransactRequestHandler>();
                services.AddTransient<IRequestHandler<TransactionRefreshRequest, bool>, TransactionRefreshRequestHandler>();
                services.AddHostedService<TransactAggregateCleanupService>();
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
                                    Log.Logger.Warning("[{LogCategory}] " + $"corsService.ApplyResult 확인 필요 {httpContext.Context.Request.Path}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
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
                    var fileSyncManager = new FileSyncManager(basePath, "*.json");
                    fileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                    {
                        if (GlobalConfiguration.IsRunning == true && fileInfo.FullName.Replace("\\", "/").IndexOf(basePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                        {
                            var filePath = fileInfo.FullName.Replace("\\", "/").Replace(basePath, "");
                            try
                            {
                                using var scope = serviceScopeFactory.CreateScope();
                                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                                var actionResult = await mediator.Send(new TransactionRefreshRequest(changeTypes.ToString(), filePath, null, null));
                                if (actionResult == false && changeTypes != WatcherChangeTypes.Deleted)
                                {
                                    Log.Warning("[{LogCategory}] " + $"{filePath} 파일 갱신 확인 필요.", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Error(exception, "[{LogCategory}] " + $"{filePath} 파일 갱신 확인 필요.", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                            }
                        }
                    };

                    Log.Information("[{LogCategory}] Business File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");

                    fileSyncManager.Start();
                    if (ModuleConfiguration.BusinessFileSyncManager.TryGetValue(basePath, out var existingFileSyncManager) == true)
                    {
                        existingFileSyncManager.Dispose();
                    }

                    ModuleConfiguration.BusinessFileSyncManager[basePath] = fileSyncManager;
                }
            }
        }
    }

    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("transact");
        }
    }
}

