using System;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Modules;

using logger.DataClient;
using logger.Encapsulation;
using logger.Entity;
using logger.Events;
using logger.Services;

using MediatR;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

using Newtonsoft.Json;

using Polly;
using Polly.CircuitBreaker;

using Serilog;

namespace logger
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
                        ModuleConfiguration.IsSQLiteCreateOnNotSettingRequest = moduleConfig.IsSQLiteCreateOnNotSettingRequest;
                        ModuleConfiguration.ModuleBasePath = GlobalConfiguration.GetBasePath(moduleConfig.ModuleBasePath, module.BasePath);
                        ModuleConfiguration.AuthorizationKey = string.IsNullOrEmpty(moduleConfig.AuthorizationKey) == false ? moduleConfig.AuthorizationKey : GlobalConfiguration.SystemID + GlobalConfiguration.RunningEnvironment + GlobalConfiguration.HostName;
                        ModuleConfiguration.IsBundledWithHost = moduleConfigJson.IsBundledWithHost;
                        ModuleConfiguration.BusinessServerUrl = moduleConfig.BusinessServerUrl;

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
                                        TableName = item.TableName,
                                        DataProvider = item.DataProvider,
                                        RemovePeriod = item.RemovePeriod,
                                        ConnectionString = item.ConnectionString,
                                        IsEncryption = item.IsEncryption
                                    });
                                }
                            }

                            foreach (var item in ModuleConfiguration.DataSource)
                            {
                                ApplicationCircuitBreakerPolicy applicationCircuitBreakerPolicy = new ApplicationCircuitBreakerPolicy();
                                applicationCircuitBreakerPolicy.ApplicationCircuitBreaker = Policy
                                    .Handle<SqlException>()
                                    .Or<Exception>()
                                    .CircuitBreaker(1, TimeSpan.FromSeconds(ModuleConfiguration.CircuitBreakResetSecond), onBreak: (exception, timespan, context) =>
                                    {
                                        Log.Error(exception, $"CircuitBreaker Reason: {exception.Message}");
                                    },
                                    onReset: (context) =>
                                    {
                                        Log.Information($"CircuitBreaker 복구, DateTime={DateTime.Now}");
                                    });

                                applicationCircuitBreakerPolicy.ApplicationCircuitState = CircuitState.Closed;
                                applicationCircuitBreakerPolicy.BreakDateTime = null;

                                ModuleConfiguration.ApplicationIDCircuitBreakers.TryAdd(item.ApplicationID, applicationCircuitBreakerPolicy);

                                try
                                {
                                    CreateNotExistTable(item.DataProvider, item.ConnectionString, item.TableName);
                                }
                                catch (Exception exception)
                                {
                                    Log.Logger.Error(exception, "[{LogCategory}] " + $"'{item.ApplicationID}' '{item.DataProvider}' 데이터베이스 연결문자열 또는 권한 확인 필요", $"ModuleInitializer/ConfigureServices");
                                }
                            }
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

                services.AddTransient<ILoggerClient, LoggerClient>();
                services.AddTransient<INotificationHandler<LoggerRequest>, LoggerRequestHandler>();
                services.AddHostedService<LogDeleteService>();
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
        }

        private bool CreateNotExistTable(string provider, string connectionString, string tableName)
        {
            bool result = false;
            var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);
            string commandText = string.Empty;

            switch (dataProvider)
            {
                case DataProviders.SqlServer:
                    commandText = $"SELECT COUNT(*) AS IsExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '{tableName}'";
                    break;
                case DataProviders.Oracle:
                    commandText = $"SELECT COUNT(*) AS IsExists FROM user_tables WHERE table_name = '{tableName}';";
                    break;
                case DataProviders.MySQL:
                    commandText = $"SELECT COUNT(*) AS IsExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '{tableName}';";
                    break;
                case DataProviders.PostgreSQL:
                    commandText = $"SELECT COUNT(*) AS IsExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '{tableName}';";
                    break;
                case DataProviders.SQLite:
                    commandText = $"SELECT COUNT(*) AS IsExists FROM sqlite_master WHERE type='table' AND name ='{tableName}';";
                    break;
            }

            using (DatabaseFactory databaseFactory = new DatabaseFactory(connectionString, dataProvider))
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
                            string sqlFilePath = Path.Combine(ModuleConfiguration.ModuleBasePath, "SQL", "Create", dataProvider.ToString() + ".txt");
                            if (File.Exists(sqlFilePath) == true)
                            {
                                string ddlScript = File.ReadAllText(sqlFilePath).Replace("{TableName}", tableName);

                                command.CommandText = ddlScript;
                                command.ExecuteNonQuery();

                                result = true;
                            }
                            else
                            {
                                Log.Logger.Error("[{LogCategory}] " + $"sqlFilePath: {sqlFilePath} 확인 필요", "ModuleInitializer/CreateNotExistTable");
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
            Console.WriteLine("logger");
        }
    }
}
