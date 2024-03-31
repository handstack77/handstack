using System;
using System.Data;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.Modules;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

using Newtonsoft.Json;

using openapi.DataClient;
using openapi.Encapsulation;
using openapi.Entity;
using openapi.Extensions;
using openapi.Services;

using Serilog;
using Serilog.Events;
using Serilog.Sinks.SystemConsole.Themes;

namespace openapi
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
                        ModuleConfiguration.ApplicationID = moduleConfigJson.ApplicationID;
                        ModuleConfiguration.Version = moduleConfigJson.Version;
                        ModuleConfiguration.ModuleBasePath = GlobalConfiguration.GetBasePath(moduleConfig.ModuleBasePath, module.BasePath);
                        ModuleConfiguration.DatabaseContractPath = GlobalConfiguration.GetBasePath(moduleConfig.DatabaseContractPath, Path.Combine(ModuleConfiguration.ModuleBasePath, "Contracts", "dbclient"));
                        ModuleConfiguration.AuthorizationKey = string.IsNullOrEmpty(moduleConfig.AuthorizationKey) == false ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.ManagerEmailID = moduleConfig.ManagerEmailID;
                        ModuleConfiguration.ManagerSHA256Password = moduleConfig.ManagerSHA256Password;
                        ModuleConfiguration.ModuleDataSource = moduleConfig.DataSource;
                        if (ModuleConfiguration.ModuleDataSource.IsEncryption.ParseBool() == true)
                        {
                            if (string.IsNullOrEmpty(ModuleConfiguration.ModuleDataSource.ConnectionString) == false)
                            {
                                ModuleConfiguration.ModuleDataSource.ConnectionString = DatabaseMapper.DecryptConnectionString(ModuleConfiguration.ModuleDataSource.ConnectionString);
                            }
                            ModuleConfiguration.ModuleDataSource.IsEncryption = "N";
                        }
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;
                        ModuleConfiguration.IsTransactionLogging = moduleConfig.IsTransactionLogging;
                        ModuleConfiguration.ModuleLogFilePath = string.IsNullOrEmpty(moduleConfig.ModuleLogFilePath) == true ? "transaction.log" : new FileInfo(moduleConfig.ModuleLogFilePath).FullName;
                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            var loggerConfiguration = CreateLoggerConfiguration(ModuleConfiguration.ModuleLogFilePath);
                            ModuleConfiguration.ModuleLogger = loggerConfiguration.CreateLogger();
                        }
                        ModuleConfiguration.IsLogServer = moduleConfig.IsLogServer;
                        ModuleConfiguration.LogServerUrl = moduleConfig.LogServerUrl;

                        if (string.IsNullOrEmpty(moduleConfig.ModuleConfigurationUrl) == false)
                        {
                            GlobalConfiguration.ModuleConfigurationUrl.Add(moduleConfig.ModuleConfigurationUrl);
                        }

                        // 관리 DB APIService 테이블 확인 및 생성 쿼리 실행
                        CreateNotExistTable("APIService");

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

                services.AddSingleton(new OpenApiLoggerClient(Log.Logger, ModuleConfiguration.ModuleLogger));
                services.AddScoped<ModuleApiClient>();
                services.AddTransient<IOpenAPIClient, OpenAPIClient>();
                services.AddHostedService<DailyJobService>();
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
        }

        private bool CreateNotExistTable(string tableName)
        {
            bool result = false;
            var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), ModuleConfiguration.ModuleDataSource.DataProvider);
            string commandText = string.Empty;
            string transactionID = string.Empty;
            switch (dataProvider)
            {
                case DataProviders.SqlServer:
                    transactionID = "SQS010";
                    commandText = $"SELECT COUNT(*) AS IsExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '{tableName}'";
                    break;
                case DataProviders.Oracle:
                    transactionID = "ORA010";
                    commandText = $"SELECT COUNT(*) AS IsExists FROM user_tables WHERE table_name = '{tableName}';";
                    break;
                case DataProviders.MySQL:
                    transactionID = "MYS010";
                    commandText = $"SELECT COUNT(*) AS IsExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '{tableName}';";
                    break;
                case DataProviders.PostgreSQL:
                    transactionID = "PGS010";
                    commandText = $"SELECT COUNT(*) AS IsExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '{tableName}';";
                    break;
                case DataProviders.SQLite:
                    transactionID = "SLT010";
                    commandText = $"SELECT COUNT(*) AS IsExists FROM sqlite_master WHERE type='table' AND name ='{tableName}';";
                    break;
            }

            using (DatabaseFactory databaseFactory = new DatabaseFactory(ModuleConfiguration.ModuleDataSource.ConnectionString, dataProvider))
            {
                if (databaseFactory.Connection == null)
                {
                    Log.Logger.Error("[{LogCategory}] " + "Connection 생성 실패. 요청 정보 확인 필요", "ModuleInitializer/CreateNotExistTable");
                }
                else
                {
                    if (databaseFactory.Connection.IsConnectionOpen() == false)
                    {
                        databaseFactory.Connection.Open();
                    }

                    using (var command = databaseFactory.Connection.CreateCommand())
                    {
                        command.CommandTimeout = 3000;
                        command.CommandText = commandText;
                        command.CommandType = CommandType.Text;
                        var isExists = command.ExecuteScalar().ToStringSafe().ToBoolean();

                        if (isExists == false)
                        {
                            try
                            {
                                var affectedResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.ZD01");
                                Log.Logger.Information("[{LogCategory}] " + $"AffectedResults: {affectedResults}", "ModuleInitializer/CreateNotExistTable");

                                result = true;
                            }
                            catch (Exception exception)
                            {
                                Log.Logger.Error(exception, "[{LogCategory}] " + $"OpenAPI 서비스 테이블 확인 필요", "ModuleInitializer/CreateNotExistTable");
                            }
                        }
                        else
                        {
                            result = true;
                        }
                    }
                }
            }

            return result;
        }
    }

    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("openapi");
        }
    }
}
