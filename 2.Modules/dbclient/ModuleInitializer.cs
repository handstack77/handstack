using System;
using System.IO;
using System.Linq;
using System.Net;

using dbclient.DataClient;
using dbclient.Encapsulation;
using dbclient.Entity;
using dbclient.Events;
using dbclient.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;
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

namespace dbclient
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
            ModuleInfo? module = GlobalConfiguration.Modules.FirstOrDefault(p => p.ModuleID == ModuleID);
            if (module != null)
            {
                string moduleConfigFilePath = Path.Combine(module.BasePath, "module.json");
                if (File.Exists(moduleConfigFilePath) == true)
                {
                    string configurationText = File.ReadAllText(moduleConfigFilePath);
                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                    if (moduleConfigJson != null)
                    {
                        ModuleConfig moduleConfig = moduleConfigJson.ModuleConfig;
                        ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
                        ModuleConfiguration.ApplicationID = moduleConfigJson.ApplicationID;
                        ModuleConfiguration.Version = moduleConfigJson.Version;
                        ModuleConfiguration.AuthorizationKey = GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.CircuitBreakResetSecond = moduleConfig.CircuitBreakResetSecond;
                        ModuleConfiguration.DefaultCommandTimeout = moduleConfig.DefaultCommandTimeout;
                        ModuleConfiguration.IsExceptionDetailText = moduleConfig.IsExceptionDetailText;
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;

                        foreach (var basePath in moduleConfig.ContractBasePath)
                        {
                            ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBasePath(basePath));
                        }

                        ModuleConfiguration.IsTransactionLogging = string.IsNullOrEmpty(moduleConfig.TransactionLogFilePath) == false;
                        ModuleConfiguration.TransactionLogFilePath = string.IsNullOrEmpty(moduleConfig.TransactionLogFilePath) == true ? "transaction.log" : new FileInfo(moduleConfig.TransactionLogFilePath).FullName;
                        ModuleConfiguration.IsProfileLogging = string.IsNullOrEmpty(moduleConfig.ProfileLogFilePath) == false;
                        ModuleConfiguration.ProfileLogFilePath = string.IsNullOrEmpty(moduleConfig.ProfileLogFilePath) == true ? "profile.log" : new FileInfo(moduleConfig.ProfileLogFilePath).FullName;

                        ModuleConfiguration.DataSource.Clear();
                        if (moduleConfig.DataSource != null && moduleConfig.DataSource.Count > 0)
                        {
                            foreach (var item in moduleConfig.DataSource)
                            {
                                if (item != null)
                                {
                                    ModuleConfiguration.DataSource.Add(new DataSource()
                                    {
                                        ApplicationID = item.ApplicationID,
                                        ProjectID = item.ProjectID,
                                        DataSourceID = item.DataSourceID,
                                        DataProvider = item.DataProvider,
                                        ConnectionString = item.ConnectionString,
                                        IsEncryption = item.IsEncryption,
                                        Comment = item.Comment
                                    });
                                }
                            }
                        }

                        if (string.IsNullOrEmpty(ModuleConfiguration.ProfileLogFilePath) != true)
                        {
                            FileInfo fileInfo = new FileInfo(ModuleConfiguration.ProfileLogFilePath);
                            // Logger.LoggerHandlerManager
                            //     .AddHandler(new ConsoleLoggerHandler())
                            //     .AddHandler(new FileLoggerHandler(fileInfo.Name, fileInfo.DirectoryName))
                            //     .AddHandler(new DebugConsoleLoggerHandler());
                        }

                        ModuleConfiguration.IsConfigure = true;
                    }
                    else
                    {
                        string message = $"Json Deserialize 오류 module.json 파일 확인 필요: {moduleConfigFilePath}";
                        Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                        throw new FileLoadException(message);
                    }
                }
                else
                {
                    string message = $"module.json 파일 확인 필요: {moduleConfigFilePath}";
                    Log.Logger.Error("[{LogCategory}] " + message, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                    throw new FileNotFoundException(message);
                }

                if (string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath)) == true)
                {
                    foreach (var appBasePath in Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath))
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                        string applicationID = directoryInfo.Name;

                        string settingFilePath = Path.Combine(appBasePath, "settings.json");
                        if (System.IO.File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(applicationID) == false)
                        {
                            string appSettingText = System.IO.File.ReadAllText(settingFilePath);
                            var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                            if (appSetting != null)
                            {
                                var dataSourceJson = appSetting.DataSource;
                                if (dataSourceJson != null)
                                {
                                    foreach (var dataSource in dataSourceJson)
                                    {
                                        if (ModuleConfiguration.DataSource.Contains(dataSource) == false)
                                        {
                                            dataSource.ConnectionString = dataSource.ConnectionString.Replace("{appBasePath}", appBasePath);
                                            ModuleConfiguration.DataSource.Add(dataSource);
                                        }
                                        else
                                        {
                                            Log.Logger.Error("[{LogCategory}] " + $"applicationID: {applicationID}의 데이터 원본 설정 확인 필요, dataSource: {JsonConvert.SerializeObject(dataSource)}", $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");
                                        }
                                    }
                                }
                            }
                        }

                        ModuleConfiguration.ContractBasePath.Add(Path.Combine(appBasePath, "dbclient"));
                    }
                }

                DatabaseMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);

                //services.AddMvc().AddMvcOptions(option =>
                //{
                //    option.InputFormatters.Add(new RawRequestBodyFormatter(Log.Logger));
                //})
                //.AddJsonOptions(jsonOptions =>
                //{
                //    jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = null;
                //});

                services.AddSingleton(new DbClientLoggerClient(Log.Logger));
                services.AddTransient<IQueryDataClient, QueryDataClient>();

                services.AddTransient<IRequestHandler<DbClientRequest, object?>, DbClientRequestHandler>();
            }
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

            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                if (Directory.Exists(basePath) == true)
                {
                    var fileSyncManager = new FileSyncManager(basePath, "*.xml");
                    fileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                    {
                        if (fileInfo.FullName.IndexOf(basePath) > -1 && changeTypes != WatcherChangeTypes.Changed && fileInfo.Name != "DataSource.xml")
                        {
                            string filePath = fileInfo.FullName.Replace(basePath, "");
                            string hostUrl = $"http://localhost:{GlobalConfiguration.ServerPort}/dbclient/api/query/refresh?changeType={changeTypes}&filePath={filePath}";

                            var client = new RestClient();
                            var request = new RestRequest(hostUrl, Method.Get);
                            request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                            try
                            {
                                RestResponse response = await client.ExecuteAsync(request);
                                if (response.StatusCode != HttpStatusCode.OK)
                                {
                                    Log.Error($"{filePath} 파일 갱신 확인 필요. {response.Content.ToStringSafe()}");
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Error(exception, $"{filePath} 파일 서버 확인 필요");
                            }
                        }
                    };

                    Log.Information("[{LogCategory}] SQL File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                    fileSyncManager.Start();

                    ModuleConfiguration.SQLFileSyncManager.Add(fileSyncManager);
                }
            }
        }
    }

    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("dbclient");
        }
    }
}
