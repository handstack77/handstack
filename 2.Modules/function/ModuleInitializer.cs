using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Data.SQLite;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;

using MySql.Data.MySqlClient;

using Newtonsoft.Json.Linq;

using Npgsql;

using NpgsqlTypes;

using Oracle.ManagedDataAccess.Client;

using function.DataClient;
using function.Encapsulation;
using function.Entity;
using function.Events;
using function.Extensions;

using HandStack.Data.Enumeration;
using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Modules;

using Jering.Javascript.NodeJS;

using MediatR;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;

using Newtonsoft.Json;

using RestSharp;

using Serilog;
using HandStack.Data.ExtensionMethod;
using HandStack.Data.Client;

namespace function
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
                        ModuleConfiguration.TransactionLogFilePath = GlobalConfiguration.GetBasePath(moduleConfig.TransactionLogFilePath);
                        ModuleConfiguration.IsProfileLogging = string.IsNullOrEmpty(moduleConfig.ProfileLogFilePath) == false;
                        ModuleConfiguration.ProfileLogFilePath = GlobalConfiguration.GetBasePath(moduleConfig.ProfileLogFilePath);
                        ModuleConfiguration.LocalStoragePath = GlobalConfiguration.GetBasePath(moduleConfig.NodeFunctionConfig.LocalStoragePath);
                        ModuleConfiguration.LogMinimumLevel = moduleConfig.NodeFunctionConfig.LogMinimumLevel;
                        ModuleConfiguration.NodeFunctionLogBasePath = GlobalConfiguration.GetBasePath(moduleConfig.NodeFunctionConfig.FileLogBasePath);
                        ModuleConfiguration.TimeoutMS = moduleConfig.NodeFunctionConfig.TimeoutMS;
                        ModuleConfiguration.IsSingleThread = moduleConfig.NodeFunctionConfig.IsSingleThread;
                        ModuleConfiguration.WatchGracefulShutdown = moduleConfig.NodeFunctionConfig.WatchGracefulShutdown;
                        ModuleConfiguration.EnableFileWatching = moduleConfig.NodeFunctionConfig.EnableFileWatching;
                        ModuleConfiguration.NodeAndV8Options = moduleConfig.NodeFunctionConfig.NodeAndV8Options;
                        ModuleConfiguration.EnvironmentVariables = moduleConfig.NodeFunctionConfig.EnvironmentVariables;

                        ModuleConfiguration.WatchFileNamePatterns.Clear();
                        ModuleConfiguration.WatchFileNamePatterns = moduleConfig.NodeFunctionConfig.WatchFileNamePatterns;

                        ModuleConfiguration.CSharpEnableFileWatching = moduleConfig.CSharpFunctionConfig.EnableFileWatching;
                        ModuleConfiguration.CSharpFunctionLogBasePath = GlobalConfiguration.GetBasePath(moduleConfig.CSharpFunctionConfig.FileLogBasePath);
                        ModuleConfiguration.CSharpWatchFileNamePatterns = moduleConfig.CSharpFunctionConfig.WatchFileNamePatterns;

                        ModuleConfiguration.FunctionSource.Clear();
                        if (moduleConfig.FunctionSource != null && moduleConfig.FunctionSource.Count > 0)
                        {
                            foreach (var item in moduleConfig.FunctionSource)
                            {
                                if (item != null)
                                {
                                    ModuleConfiguration.FunctionSource.Add(new FunctionSource()
                                    {
                                        ApplicationID = item.ApplicationID,
                                        ProjectID = item.ProjectID,
                                        DataSourceID = item.DataSourceID,
                                        LanguageType = item.LanguageType,
                                        DataProvider = item.DataProvider,
                                        ConnectionString = item.ConnectionString,
                                        IsEncryption = item.IsEncryption,
                                        WorkingDirectoryPath = item.WorkingDirectoryPath,
                                        Comment = item.Comment
                                    });
                                }
                            }
                        }

                        if (string.IsNullOrEmpty(ModuleConfiguration.ProfileLogFilePath) != true)
                        {
                            FileInfo fileInfo = new FileInfo(ModuleConfiguration.ProfileLogFilePath);
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

                FunctionMapper.LoadContract(environment.EnvironmentName, Log.Logger, configuration);

                services.AddNodeJS();
                services.Configure<NodeJSProcessOptions>(options =>
                {
                    if (string.IsNullOrEmpty(ModuleConfiguration.NodeAndV8Options) == false)
                    {
                        options.NodeAndV8Options = ModuleConfiguration.NodeAndV8Options;
                    }

                    Dictionary<string, string> nodeEnvironmentVariables = new Dictionary<string, string>();
                    if (string.IsNullOrEmpty(ModuleConfiguration.EnvironmentVariables) == false)
                    {
                        var environmentVariables = ModuleConfiguration.EnvironmentVariables.Split(";");
                        foreach (string item in environmentVariables)
                        {
                            if (string.IsNullOrEmpty(item) == false)
                            {
                                var keyValues = item.Split("=");
                                nodeEnvironmentVariables.Add(keyValues[0], keyValues[1]);
                            }
                        }
                    }

                    for (int i = 0; i < ModuleConfiguration.ContractBasePath.Count; i++)
                    {
                        string basePath = ModuleConfiguration.ContractBasePath[i];
                        nodeEnvironmentVariables.Add($"SYN_ContractBasePath{i}", GlobalConfiguration.GetBasePath(basePath));
                    }

                    if (Directory.Exists(ModuleConfiguration.NodeFunctionLogBasePath) == false)
                    {
                        Directory.CreateDirectory(ModuleConfiguration.NodeFunctionLogBasePath);
                    }

                    nodeEnvironmentVariables.Add("SYN_FileLogBasePath", ModuleConfiguration.NodeFunctionLogBasePath);
                    nodeEnvironmentVariables.Add("SYN_LogMinimumLevel", ModuleConfiguration.LogMinimumLevel);
                    nodeEnvironmentVariables.Add("SYN_LocalStoragePath", ModuleConfiguration.LocalStoragePath);

                    string synConfigFilePath = Path.Combine(module.BasePath, "syn.config.json");
                    if (File.Exists(synConfigFilePath) == true)
                    {
                        nodeEnvironmentVariables.Add("SYN_CONFIG", File.ReadAllText(synConfigFilePath));
                    }
                    else
                    {
                        string defaultEnvironmentVariables = "{\"ApplicationID\":\"HDS\",\"ProjectID\":\"WBD\",\"SystemID\":\"BOP01\",\"TransactionTimeout\":60000,\"IsConfiguration\":false,\"SolutionName\":\"HDS Solution\",\"ProgramName\":\"function\",\"IsDebugMode\":true,\"IsApiFindServer\":false,\"DiscoveryApiServerUrl\":\"http://localhost:8080/api/find\",\"FileManagerUrl\":\"http://localhost:8080/repository/api/storage\",\"FileManagerServer\":\"http://localhost:8080\",\"FileServerType\":\"L\",\"Environment\":\"Development\",\"LocalStoragePath\":\"C:\\\\home\\\\ack\\\\cache\\\\function\",\"LogMinimumLevel\":\"trace\",\"FileLogBasePath\":\"C:\\\\home\\\\ack\\\\log\\\\function\",\"DomainAPIServer\":{\"ServerID\":\"SERVERD01\",\"ServerType\":\"D\",\"Protocol\":\"http\",\"IP\":\"localhost\",\"Port\":\"8080\",\"Path\":\"/api/transaction\",\"ClientIP\":\"127.0.0.1\"},\"IntranetServerIP\":\"127.0.0.1\",\"IntranetServerPort\":\"8080\",\"Program\":{\"ProgramVersion\":\"1.0.0\",\"LanguageID\":\"KO\",\"LocaleID\":\"ko-KR\",\"TerminalBranchCode\":\"\"},\"Transaction\":{\"ProtocolVersion\":\"001\",\"RunningEnvironment\":\"D\",\"DataFormat\":\"J\",\"MachineName\":\"\",\"SystemCode\":\"DTS\",\"SystemID\":\"BOP01\",\"MachineTypeID\":\"SVR\",\"DataEncryptionYN\":\"N\"}}";
                        nodeEnvironmentVariables.Add("SYN_CONFIG", defaultEnvironmentVariables);
                    }
                    options.EnvironmentVariables = nodeEnvironmentVariables;
                });

                services.Configure<OutOfProcessNodeJSServiceOptions>(options =>
                {
                    options.Concurrency = ModuleConfiguration.IsSingleThread == true ? Concurrency.None : Concurrency.MultiProcess;
                    options.InvocationTimeoutMS = ModuleConfiguration.TimeoutMS;

                    if (ModuleConfiguration.ContractBasePath.Count > 0)
                    {
                        options.EnableFileWatching = false;
                    }
                    else
                    {
                        options.EnableFileWatching = ModuleConfiguration.EnableFileWatching;
                    }

                    options.WatchPath = ModuleConfiguration.ContractBasePath.Count > 0 ? ModuleConfiguration.ContractBasePath[0] : "";
                    options.GracefulProcessShutdown = ModuleConfiguration.WatchGracefulShutdown;
                    options.WatchFileNamePatterns = ModuleConfiguration.WatchFileNamePatterns;
                });

                //services.AddMvc().AddMvcOptions(option =>
                //{
                //    option.InputFormatters.Add(new RawRequestBodyFormatter(Log.Logger));
                //})
                //.AddJsonOptions(jsonOptions =>
                //{
                //    jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = null;
                //});

                FunctionLoggerClient loggerClient = new FunctionLoggerClient(Log.Logger);
                services.AddSingleton(loggerClient);
                services.AddTransient<IFunctionClient, FunctionClient>();

                services.AddTransient<IRequestHandler<FunctionRequest, object?>, FunctionRequestHandler>();
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
                string nodeContractBasePath = Path.Combine(basePath, "javascript");
                if (Directory.Exists(nodeContractBasePath) == true && ModuleConfiguration.EnableFileWatching == true)
                {
                    var nodeFileSyncManager = new FileSyncManager(nodeContractBasePath, string.Join("|", ModuleConfiguration.WatchFileNamePatterns));
                    nodeFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                    {
                        if (fileInfo.FullName.IndexOf(nodeContractBasePath) > -1 && changeTypes != WatcherChangeTypes.Changed && (fileInfo.Name == "featureMain.js" || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml") == true)
                        {
                            string filePath = fileInfo.FullName.Replace(nodeContractBasePath, "");
                            string hostUrl = $"http://localhost:{GlobalConfiguration.ServerPort}/function/api/execution/refresh?changeType={changeTypes}&filePath={filePath}";

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

                    Log.Information("[{LogCategory}] Node File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                    nodeFileSyncManager.Start();
                    ModuleConfiguration.NodeFileSyncManager.Add(nodeFileSyncManager);
                }

                string csharpContractBasePath = Path.Combine(basePath, "csharp");
                if (Directory.Exists(csharpContractBasePath) == true && ModuleConfiguration.CSharpEnableFileWatching == true)
                {
                    var csharpFileSyncManager = new FileSyncManager(csharpContractBasePath, string.Join("|", ModuleConfiguration.CSharpWatchFileNamePatterns));
                    csharpFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                    {
                        if (fileInfo.FullName.IndexOf(csharpContractBasePath) > -1 && changeTypes != WatcherChangeTypes.Changed && (fileInfo.Name == "featureMain.cs" || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml") == true)
                        {
                            string filePath = fileInfo.FullName.Replace(csharpContractBasePath, "");
                            string hostUrl = $"http://localhost:{GlobalConfiguration.ServerPort}/function/api/execution/refresh?changeType={changeTypes}&filePath={filePath}";

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

                    Log.Information("[{LogCategory}] CSharp File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");
                    csharpFileSyncManager.Start();
                    ModuleConfiguration.NodeFileSyncManager.Add(csharpFileSyncManager);
                }
            }
        }
    }

    internal class Program
    {
        public static dynamic? ExecuteModuleSQL(ReturnType returnType, string queryID, object? parameters = null)
        {
            dynamic? result = null;
            var paths = queryID.Split(".");
            if (paths.Length == 3)
            {
                try
                {
                    string? parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);
                    var sqlMeta = DatabaseExtensions.GetSqlClientTuple("", queryID, parseParameters);
                    if (sqlMeta != null)
                    {
                        JObject? adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                        string commandText = sqlMeta.Item1;
                        commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                        using (SqlServerClient sqlServerClient = new SqlServerClient(""))
                        {
                            switch (returnType)
                            {
                                case ReturnType.NonQuery:
                                    result = sqlServerClient.ExecuteNonQuery(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.Scalar:
                                    result = sqlServerClient.ExecuteScalar(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataSet:
                                    result = sqlServerClient.ExecuteDataSet(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataReader:
                                    result = sqlServerClient.ExecuteReader(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.Dynamic:
                                    result = sqlServerClient.ExecuteDynamic(commandText, sqlMeta.Item2);
                                    break;
                            }
                        }
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, "[{LogCategory}] " + $"returnType: {returnType}, queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                }
            }

            return result;
        }

        static void Main(string[] args)
        {
            Console.WriteLine("function");
        }
    }
}
