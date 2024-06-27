using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;
using HandStack.Web.Modules;

using MediatR;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
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
            ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (module != null)
            {
                string moduleSettingFilePath = module.ModuleSettingFilePath;
                if (File.Exists(moduleSettingFilePath) == true)
                {
                    string configurationText = File.ReadAllText(moduleSettingFilePath);
                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                    if (moduleConfigJson != null)
                    {
                        ModuleConfig moduleConfig = moduleConfigJson.ModuleConfig;
                        ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
                        ModuleConfiguration.ApplicationID = moduleConfigJson.ApplicationID;
                        ModuleConfiguration.Version = moduleConfigJson.Version;
                        ModuleConfiguration.AuthorizationKey = string.IsNullOrEmpty(moduleConfig.AuthorizationKey) == false ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.CircuitBreakResetSecond = moduleConfig.CircuitBreakResetSecond;
                        ModuleConfiguration.SystemID = moduleConfig.SystemID;
                        ModuleConfiguration.AvailableEnvironment = moduleConfig.AvailableEnvironment;
                        ModuleConfiguration.UseApiAuthorize = moduleConfig.UseApiAuthorize;
                        ModuleConfiguration.BypassAuthorizeIP = moduleConfig.BypassAuthorizeIP;
                        ModuleConfiguration.WithOrigins = moduleConfig.WithOrigins;
                        ModuleConfiguration.DefaultCommandTimeout = moduleConfig.DefaultCommandTimeout;
                        ModuleConfiguration.IsExceptionDetailText = moduleConfig.IsExceptionDetailText;
                        ModuleConfiguration.IsValidationRequest = moduleConfig.IsValidationRequest;
                        ModuleConfiguration.IsAllowDynamicRequest = moduleConfig.IsAllowDynamicRequest;
                        ModuleConfiguration.AllowTenantTransactionCommands = moduleConfig.AllowTenantTransactionCommands;
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.IsTransactAggregate = moduleConfig.IsTransactAggregate;
                        ModuleConfiguration.IsDataMasking = moduleConfig.IsDataMasking;
                        ModuleConfiguration.MaskingChar = char.Parse((string.IsNullOrEmpty(moduleConfig.MaskingChar) == true || moduleConfig.MaskingChar.Length != 1) ? "*" : moduleConfig.MaskingChar);
                        ModuleConfiguration.MaskingMethod = string.IsNullOrEmpty(moduleConfig.MaskingMethod) == true ? "Syn" : moduleConfig.MaskingMethod;
                        ModuleConfiguration.IsTransactionLogging = moduleConfig.IsTransactionLogging;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;

                        foreach (var basePath in moduleConfig.ContractBasePath)
                        {
                            ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBasePath(basePath));
                        }

                        ModuleConfiguration.ModuleBasePath = GlobalConfiguration.GetBasePath(moduleConfig.ModuleBasePath);
                        ModuleConfiguration.DatabaseContractPath = GlobalConfiguration.GetBasePath(moduleConfig.DatabaseContractPath, Path.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "dbclient"));
                        ModuleConfiguration.TransactionLogBasePath = GlobalConfiguration.GetBasePath(moduleConfig.TransactionLogBasePath);

                        ModuleConfiguration.PublicTransactions = moduleConfig.PublicTransactions;

                        foreach (var item in moduleConfig.RoutingCommandUri.AsEnumerable())
                        {
                            ModuleConfiguration.RoutingCommandUri.Add(item.Key, item.Value);
                        }

                        foreach (var item in moduleConfig.AllowRequestTransactions.AsEnumerable())
                        {
                            ModuleConfiguration.AllowRequestTransactions.Add(item.Key, item.Value);
                        }

                        ModuleConfiguration.IsConfigure = true;
                    }
                    else
                    {
                        string message = $"Json Deserialize 오류 module.json 파일 확인 필요: {moduleSettingFilePath}";
                        Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                        throw new FileLoadException(message);
                    }
                }
                else
                {
                    string message = $"module.json 파일 확인 필요: {moduleSettingFilePath}";
                    Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                    throw new FileNotFoundException(message);
                }

                if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath)) == true)
                {
                    foreach (var userWorkPath in Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath))
                    {
                        DirectoryInfo workDirectoryInfo = new DirectoryInfo(userWorkPath);
                        string userWorkID = workDirectoryInfo.Name;
                        foreach (var appBasePath in Directory.GetDirectories(userWorkPath))
                        {
                            DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                            string applicationID = directoryInfo.Name;
                            string tenantID = $"{userWorkID}|{applicationID}";
                            string settingFilePath = Path.Combine(appBasePath, "settings.json");
                            if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                string appSettingText = File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var routingCommandUri = appSetting.Routing;
                                    if (routingCommandUri != null)
                                    {
                                        foreach (var item in routingCommandUri.AsEnumerable())
                                        {
                                            string routeSegmentID = $"{userWorkID}|{item.ApplicationID}|{item.ProjectID}|{item.CommandType}|{item.Environment}";
                                            if (ModuleConfiguration.RoutingCommandUri.ContainsKey(routeSegmentID) == false)
                                            {
                                                ModuleConfiguration.RoutingCommandUri.Add(routeSegmentID, item.Uri);
                                            }
                                            else
                                            {
                                                Log.Logger.Error("[{LogCategory}] " + $"applicationID: {applicationID}의 transact 거래 프록시 설정 확인 필요, key: {routeSegmentID}, value: {item.Uri}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                                            }
                                        }
                                    }
                                }
                            }

                            ModuleConfiguration.ContractBasePath.Add(Path.Combine(appBasePath, "transact"));
                        }
                    }
                }

                TransactionMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);

                services.AddSingleton(new TransactLoggerClient(Log.Logger));
                services.AddSingleton<TransactClient>();
                services.AddTransient<IRequestHandler<TransactRequest, object?>, TransactRequestHandler>();
            }
        }

        private static LoggerConfiguration CreateLoggerConfiguration(string logFilePath)
        {
            FileInfo fileInfo = new FileInfo(logFilePath);
            if (string.IsNullOrEmpty(fileInfo.DirectoryName) == false)
            {
                if (fileInfo.Directory == null || fileInfo.Directory.Exists == false)
                {
                    Directory.CreateDirectory(fileInfo.DirectoryName);
                }

                if (string.IsNullOrEmpty(GlobalConfiguration.ProcessName) == true)
                {
                    logFilePath = fileInfo.FullName;
                }
                else
                {
                    logFilePath = Path.Combine(fileInfo.DirectoryName, GlobalConfiguration.ProcessName + "_" + fileInfo.Name);
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
                    flushToDiskInterval: TimeSpan.FromSeconds(3),
                    shared: true);
            return loggerConfiguration;
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (string.IsNullOrEmpty(ModuleID) == false && module != null)
            {
                string wwwrootDirectory = Path.Combine(module.BasePath, "wwwroot", module.ModuleID);
                if (string.IsNullOrEmpty(wwwrootDirectory) == false && Directory.Exists(wwwrootDirectory) == true)
                {
                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new PhysicalFileProvider(Path.Combine(wwwrootDirectory)),
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

            int tenantsCount = 0;
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                if (Directory.Exists(basePath) == true)
                {
                    var fileSyncManager = new FileSyncManager(basePath, "*.json");
                    fileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                    {
                        if (fileInfo.FullName.IndexOf(basePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed))
                        {
                            string filePath = fileInfo.FullName.Replace(basePath, "");
                            string hostUrl = $"http://localhost:{GlobalConfiguration.ServerPort}/transact/api/transaction/refresh?changeType={changeTypes}&filePath={filePath}";

                            var client = new RestClient();
                            var request = new RestRequest(hostUrl, Method.Get);
                            request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                            try
                            {
                                RestResponse response = await client.ExecuteAsync(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    Log.Error("[{LogCategory}] " + $"{filePath} 파일 갱신 확인 필요. {response.Content.ToStringSafe()}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Error(exception, "[{LogCategory}] " + $"{filePath} 파일 서버 확인 필요.", $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                            }
                        }
                    };

                    string tenantsDirectoryPath = $"{Path.DirectorySeparatorChar}tenants{Path.DirectorySeparatorChar}";
                    if (basePath.Contains(tenantsDirectoryPath) == true)
                    {
                        tenantsCount = tenantsCount + 1;
                    }
                    else
                    {
                        Log.Information("[{LogCategory}] Business File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                    }

                    fileSyncManager.Start();
                    ModuleConfiguration.BusinessFileSyncManager.Add(basePath, fileSyncManager);
                }
            }
            Log.Information("[{LogCategory}] Tenants Business File Sync: " + tenantsCount, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
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
