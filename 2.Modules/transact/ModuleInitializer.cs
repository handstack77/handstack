using System;
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

using RestSharp;

using Serilog;
using Serilog.Events;
using Serilog.Sinks.SystemConsole.Themes;

using transact.Entity;
using transact.Events;
using transact.Extensions;

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
                        ModuleConfiguration.AuthorizationKey = string.IsNullOrEmpty(moduleConfig.AuthorizationKey) == false ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.CircuitBreakResetSecond = moduleConfig.CircuitBreakResetSecond;
                        ModuleConfiguration.SystemID = moduleConfig.SystemID;
                        ModuleConfiguration.AvailableEnvironment = moduleConfig.AvailableEnvironment;
                        ModuleConfiguration.UseApiAuthorize = moduleConfig.UseApiAuthorize;
                        ModuleConfiguration.TrustedProxyIP = string.IsNullOrEmpty(moduleConfig.TrustedProxyIP) == true ? "1.1.1.1" : moduleConfig.TrustedProxyIP;
                        ModuleConfiguration.HasTrustedCheckIP = moduleConfig.HasTrustedCheckIP;
                        ModuleConfiguration.BypassAuthorizeIP = moduleConfig.BypassAuthorizeIP;
                        ModuleConfiguration.IsValidationRequest = moduleConfig.IsValidationRequest;
                        ModuleConfiguration.IsAllowDynamicRequest = moduleConfig.IsAllowDynamicRequest;
                        ModuleConfiguration.AllowTenantTransactionCommands = moduleConfig.AllowTenantTransactionCommands;
                        ModuleConfiguration.IsCodeDataCache = moduleConfig.IsCodeDataCache;
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.IsTransactAggregate = moduleConfig.IsTransactAggregate;
                        ModuleConfiguration.IsDataMasking = moduleConfig.IsDataMasking;
                        ModuleConfiguration.MaskingChar = char.Parse((string.IsNullOrEmpty(moduleConfig.MaskingChar) == true || moduleConfig.MaskingChar.Length != 1) ? "*" : moduleConfig.MaskingChar);
                        ModuleConfiguration.MaskingMethod = string.IsNullOrEmpty(moduleConfig.MaskingMethod) == true ? "Syn" : moduleConfig.MaskingMethod;
                        ModuleConfiguration.IsTransactionLogging = moduleConfig.IsTransactionLogging;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;

                        ModuleConfiguration.IsContractFileWatching = moduleConfig.IsContractFileWatching;
                        foreach (var basePath in moduleConfig.ContractBasePath)
                        {
                            ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBaseDirectoryPath(basePath));
                        }

                        ModuleConfiguration.ModuleBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.ModuleBasePath);
                        ModuleConfiguration.DatabaseContractPath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.DatabaseContractPath, PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "dbclient"));
                        ModuleConfiguration.TransactionLogBasePath = GlobalConfiguration.GetBaseDirectoryPath(moduleConfig.TransactionLogBasePath);

                        ModuleConfiguration.PublicTransactions = moduleConfig.PublicTransactions;
                        ModuleConfiguration.PublicTransactions.ExtendExpiryTime(DateTime.Now.AddYears(10));

                        foreach (var item in moduleConfig.RoutingCommandUri.AsEnumerable())
                        {
                            ModuleConfiguration.RoutingCommandUri.Add(item.Key, item.Value, TimeSpan.FromDays(36500));
                        }

                        foreach (var item in moduleConfig.AllowRequestTransactions.AsEnumerable())
                        {
                            ModuleConfiguration.AllowRequestTransactions.Add(item.Key, item.Value);
                        }

                        ModuleConfiguration.BypassGlobalIDTransactions = moduleConfig.BypassGlobalIDTransactions;
                        ModuleConfiguration.AllowClientIP = moduleConfig.AllowClientIP;
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
                services.AddSingleton<TransactClient>();
                services.AddTransient<IRequestHandler<TransactRequest, object?>, TransactRequestHandler>();
            }
        }

        private static LoggerConfiguration CreateLoggerConfiguration(string logFilePath)
        {
            var fileInfo = new FileInfo(logFilePath);
            if (string.IsNullOrEmpty(fileInfo.DirectoryName) == false)
            {
                if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
                {
                    Directory.CreateDirectory(fileInfo.DirectoryName);
                }

                if (string.IsNullOrEmpty(GlobalConfiguration.ProcessName) == true)
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
            if (string.IsNullOrEmpty(ModuleID) == false && module != null)
            {
                var wwwrootDirectory = PathExtensions.Combine(module.BasePath, "wwwroot", module.ModuleID);
                if (string.IsNullOrEmpty(wwwrootDirectory) == false && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(PathExtensions.Combine(wwwrootDirectory)),
                        RequestPath = "/" + ModuleID,
                        ServeUnknownFileTypes = true,
                        OnPrepareResponse = httpContext =>
                        {
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

            var client = new RestClient();
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
                            var hostUrl = $"http://localhost:{GlobalConfiguration.OriginPort}/transact/api/transaction/refresh?changeType={changeTypes}&filePath={filePath}";

                            var request = new RestRequest(hostUrl, Method.Get);
                            request.Timeout = TimeSpan.FromSeconds(3);
                            request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                            try
                            {
                                var response = await client.ExecuteAsync(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    Log.Warning("[{LogCategory}] " + $"{filePath} 파일 갱신 확인 필요. {response.Content.ToStringSafe()}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Error(exception, "[{LogCategory}] " + $"{filePath} 파일 서버 확인 필요.", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                            }
                        }
                    };

                    Log.Information("[{LogCategory}] Business File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");

                    fileSyncManager.Start();
                    ModuleConfiguration.BusinessFileSyncManager.Add(basePath, fileSyncManager);
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
