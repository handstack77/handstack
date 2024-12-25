using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using Microsoft.Data.SqlClient;
using System.Data.SQLite;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;

using function.DataClient;
using function.Encapsulation;
using function.Entity;
using function.Events;
using function.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Client;
using HandStack.Data.Enumeration;
using HandStack.Data.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.MessageContract.DataObject;
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
using Microsoft.SemanticKernel;

using MySql.Data.MySqlClient;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Npgsql;

using NpgsqlTypes;

using Oracle.ManagedDataAccess.Client;

using RestSharp;

using Serilog;
using Serilog.Events;
using Serilog.Sinks.SystemConsole.Themes;

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
                string moduleSettingFilePath = module.ModuleSettingFilePath;
                if (File.Exists(moduleSettingFilePath) == true)
                {
                    string configurationText = File.ReadAllText(moduleSettingFilePath);
                    ModuleConfigJson? moduleConfigJson = JsonConvert.DeserializeObject<ModuleConfigJson>(configurationText);

                    if (moduleConfigJson != null)
                    {
                        ModuleConfig moduleConfig = moduleConfigJson.ModuleConfig;
                        ModuleConfiguration.ModuleID = moduleConfigJson.ModuleID;
                        ModuleConfiguration.Version = moduleConfigJson.Version;
                        ModuleConfiguration.AuthorizationKey = string.IsNullOrEmpty(moduleConfig.AuthorizationKey) == false ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.ModuleBasePath = string.IsNullOrEmpty(moduleConfig.ModuleBasePath) == true || Directory.Exists(moduleConfig.ModuleBasePath) == false ? "" : new DirectoryInfo(moduleConfig.ModuleBasePath).FullName;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.CircuitBreakResetSecond = moduleConfig.CircuitBreakResetSecond;
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;

                        foreach (var basePath in moduleConfig.ContractBasePath)
                        {
                            ModuleConfiguration.ContractBasePath.Add(GlobalConfiguration.GetBasePath(basePath));
                        }

                        ModuleConfiguration.IsTransactionLogging = moduleConfig.IsTransactionLogging;
                        ModuleConfiguration.ModuleLogFilePath = string.IsNullOrEmpty(moduleConfig.ModuleLogFilePath) == true ? "transaction.log" : new FileInfo(moduleConfig.ModuleLogFilePath).FullName;
                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            var loggerConfiguration = CreateLoggerConfiguration(ModuleConfiguration.ModuleLogFilePath);
                            ModuleConfiguration.ModuleLogger = loggerConfiguration.CreateLogger();
                        }

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

                        ModuleConfiguration.DefaultDataSourceID = moduleConfig.DefaultDataSourceID;
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

                        ModuleConfiguration.AllowClientIP = moduleConfig.AllowClientIP;
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
                                nodeEnvironmentVariables.Add(keyValues[0].Trim(), keyValues[1].Trim());
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

                    nodeEnvironmentVariables.Add("SYN_FileLogBasePath", GlobalConfiguration.GetBasePath(ModuleConfiguration.NodeFunctionLogBasePath));
                    nodeEnvironmentVariables.Add("SYN_LogMinimumLevel", ModuleConfiguration.LogMinimumLevel);
                    nodeEnvironmentVariables.Add("SYN_LocalStoragePath", GlobalConfiguration.GetBasePath(ModuleConfiguration.LocalStoragePath));

                    string nodeConfigFilePath = Path.Combine(module.BasePath, "node.config.json");
                    if (File.Exists(nodeConfigFilePath) == true)
                    {
                        nodeEnvironmentVariables.Add("SYN_CONFIG", File.ReadAllText(nodeConfigFilePath));
                    }
                    else
                    {
                        string defaultEnvironmentVariables = """
                        {
                            "SystemID": "HANDSTACK",
                            "ApplicationID": "HDS",
                            "ProjectID": "SYS",
                            "SystemVersion": "1.0.0",
                            "TransactionTimeout": 180000,
                            "HostName": "WebClient",
                            "UIEventLogLevel": "Verbose",
                            "IsLocaleTranslations": true,
                            "LocaleAssetUrl": "/assets/shared/language/",
                            "AssetsCachingID": "",
                            "IsClientCaching": true,
                            "IsDebugMode": false,
                            "IsBundleLoad": false,
                            "BaseDirectory": "/",
                            "TenantAppRequestPath": "app",
                            "SharedAssetUrl": "/assets/shared/",
                            "IsApiFindServer": false,
                            "DiscoveryApiServerUrl": "",
                            "ReportServer": "",
                            "FileManagerServer": "http://localhost:8000",
                            "FindClientIPServer": "/checkip",
                            "FindGlobalIDServer": "",
                            "FileServerType": "L",
                            "CookiePrefixName": "HandStack",
                            "Environment": "Development",
                            "DomainAPIServer": {
                                "ServerID": "SERVERD01",
                                "ServerType": "D",
                                "Protocol": "http",
                                "IP": "localhost",
                                "Port": "8000",
                                "Path": "/transact/api/transaction/execute",
                                "ClientIP": "localhost"
                            },
                            "Program": {
                                "ProgramName": "ack",
                                "ProgramVersion": "1.0.0",
                                "LanguageID": "ko",
                                "LocaleID": "ko-KR",
                                "BranchCode": ""
                            },
                            "Transaction": {
                                "ProtocolVersion": "001",
                                "SimulationType": "P",
                                "DataFormat": "J",
                                "MachineTypeID": "WEB",
                                "EncryptionType": "P",
                                "EncryptionKey": "G",
                                "CompressionYN": "N"
                            }
                        }
                        """;
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
                        options.EnableFileWatching = ModuleConfiguration.EnableFileWatching;
                    }
                    else
                    {
                        options.EnableFileWatching = false;
                    }

                    string watchPath = ModuleConfiguration.ContractBasePath.Count > 0 ? ModuleConfiguration.ContractBasePath[0] : "";
                    if (string.IsNullOrEmpty(watchPath) == true)
                    {
                        options.EnableFileWatching = false;
                    }
                    else
                    {
                        options.WatchPath = Path.Combine(watchPath, "javascript");
                        Log.Information("[{LogCategory}] Node File WatchPath: " + options.WatchPath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/ConfigureServices");

                        options.GracefulProcessShutdown = ModuleConfiguration.WatchGracefulShutdown;
                        options.WatchFileNamePatterns = ModuleConfiguration.WatchFileNamePatterns;
                    }
                });

                services.AddSingleton(new FunctionLoggerClient(Log.Logger, ModuleConfiguration.ModuleLogger));
                services.AddTransient<IFunctionClient, FunctionClient>();

                services.AddTransient<IRequestHandler<FunctionRequest, object?>, FunctionRequestHandler>();
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

            var client = new RestClient();
            foreach (var basePath in ModuleConfiguration.ContractBasePath)
            {
                if (Directory.Exists(basePath) == true && basePath.StartsWith(GlobalConfiguration.TenantAppBasePath) == false)
                {
                    string nodeContractBasePath = Path.Combine(basePath, "javascript");
                    if (Directory.Exists(nodeContractBasePath) == true && ModuleConfiguration.EnableFileWatching == true)
                    {
                        var nodeFileSyncManager = new FileSyncManager(nodeContractBasePath, string.Join("|", ModuleConfiguration.WatchFileNamePatterns));
                        nodeFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                        {
                            if (GlobalConfiguration.IsRunning == true && fileInfo.FullName.IndexOf(nodeContractBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed) && (fileInfo.Name == "featureMain.js" || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml") == true)
                            {
                                string filePath = fileInfo.FullName.Replace(nodeContractBasePath, "");
                                string hostUrl = $"http://localhost:{GlobalConfiguration.ServerPort}/function/api/execution/refresh?changeType={changeTypes}&filePath={filePath}";

                                var request = new RestRequest(hostUrl, Method.Get);
                                request.Timeout = TimeSpan.FromSeconds(3);
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

                        Log.Information("[{LogCategory}] Node File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");

                        nodeFileSyncManager.Start();
                        ModuleConfiguration.NodeFileSyncManager.Add(nodeContractBasePath, nodeFileSyncManager);
                    }

                    string csharpContractBasePath = Path.Combine(basePath, "csharp");
                    if (Directory.Exists(csharpContractBasePath) == true && ModuleConfiguration.CSharpEnableFileWatching == true)
                    {
                        var csharpFileSyncManager = new FileSyncManager(csharpContractBasePath, string.Join("|", ModuleConfiguration.CSharpWatchFileNamePatterns));
                        csharpFileSyncManager.MonitoringFile += async (WatcherChangeTypes changeTypes, FileInfo fileInfo) =>
                        {
                            if (GlobalConfiguration.IsRunning == true && fileInfo.FullName.IndexOf(csharpContractBasePath) > -1 && (changeTypes == WatcherChangeTypes.Deleted || changeTypes == WatcherChangeTypes.Created || changeTypes == WatcherChangeTypes.Changed) && (fileInfo.Name == "featureMain.cs" || fileInfo.Name == "featureMeta.json" || fileInfo.Name == "featureSQL.xml") == true)
                            {
                                string filePath = fileInfo.FullName.Replace(csharpContractBasePath, "");
                                string hostUrl = $"http://localhost:{GlobalConfiguration.ServerPort}/function/api/execution/refresh?changeType={changeTypes}&filePath={filePath}";

                                var request = new RestRequest(hostUrl, Method.Get);
                                request.Timeout = TimeSpan.FromSeconds(3);
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

                        Log.Information("[{LogCategory}] CSharp File Sync ContractBasePath: " + basePath, $"{ModuleConfiguration.ModuleID} ModuleInitializer/Configure");

                        csharpFileSyncManager.Start();
                        ModuleConfiguration.NodeFileSyncManager.Add(csharpContractBasePath, csharpFileSyncManager);
                    }
                }
            }
        }
    }

    internal class Program
    {
        public static dynamic? ExecuteModuleSQL(DataContext dataContext, ReturnType returnType, string featureID, object? parameters = null)
        {
            dynamic? result = null;
            try
            {
                if (string.IsNullOrEmpty(dataContext.featureSQLPath) == true || string.IsNullOrEmpty(dataContext.connectionString) == true)
                {
                    Log.Error("[{LogCategory}] " + $"globalID: {dataContext.globalID}, featureID: {featureID}, dataSourceMap DataProvider의 DataSource 또는 featureSQL 확인 필요", "ModuleExtensions/ExecuteModuleSQL");
                }
                else
                {
                    string? parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);
                    var sqlMeta = DatabaseExtensions.GetSQLiteMetaSQL(dataContext.featureSQLPath, featureID, parseParameters);
                    if (sqlMeta != null)
                    {
                        JObject? adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                        string commandText = sqlMeta.Item1;
                        commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                        using (SQLiteClient sqliteClient = new SQLiteClient(dataContext.connectionString))
                        {
                            switch (returnType)
                            {
                                case ReturnType.NonQuery:
                                    result = sqliteClient.ExecuteNonQuery(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.Scalar:
                                    result = sqliteClient.ExecuteScalar(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataSet:
                                    result = sqliteClient.ExecuteDataSet(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataReader:
                                    result = sqliteClient.ExecuteReader(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.Dynamic:
                                    result = sqliteClient.ExecuteDynamic(commandText, sqlMeta.Item2);
                                    break;
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + $"returnType: {returnType}, featureID: {featureID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
            }

            return result;
        }

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
#pragma warning disable CS0219
            DataSet? dataSet = null;
            DbConnection? dbConnection = null;
            SqlCommand? sqlCommand = null;
            SQLiteCommand? sQLiteCommand = null;
            NpgsqlParameter? npgsqlParameter = null;
            CultureInfo? cultureInfo = null;
            Encoding? encoding = null;
            Regex? regex = null;
            Kernel? kernel = null;
            XmlDocument? xmlDocument = null;
            MySqlDbType? mySqlDbType = null;
            NpgsqlDbType? npgsqlDbType = null;
            OracleDbType? oracleDbType = null;
            var statusCodes = StatusCodes.Status200OK;
#pragma warning restore CS0219

            Console.WriteLine("function");
        }
    }
}
