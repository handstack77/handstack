using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Data.SQLite;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.Entity;

using Polly;
using Polly.CircuitBreaker;

using Serilog;

namespace openapi.Entity
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "openapi";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static List<string> AllowClientIP = new List<string>() { "*" };
        public static bool IsBundledWithHost = false;
        public static string ManagerEmailID = "";
        public static string ManagerSHA256Password = "";
        public static string BusinessServerUrl = "";
        public static string ModuleBasePath = "";
        public static string DatabaseContractPath = "";
        public static int CircuitBreakResetSecond = 30;
        public static bool IsApiFindServer = false;
        public static string ModuleLogFilePath = "";
        public static bool IsLogServer = false;
        public static string LogServerUrl = "";
        public static DataSource ModuleDataSource = new DataSource();
        public static List<ApiDataSource> ApiDataSource = new List<ApiDataSource>();
        public static List<ApiService> ApiServices = new List<ApiService>();
        public static Dictionary<string, List<ApiParameter>> ApiParameters = new Dictionary<string, List<ApiParameter>>();
        public static Dictionary<string, List<AccessMemberApi>> AccessMemberApis = new Dictionary<string, List<AccessMemberApi>>();
        public static Dictionary<string, ApiServiceCircuitBreakerPolicy> apiServiceCircuitBreakers = new Dictionary<string, ApiServiceCircuitBreakerPolicy>();
        public static List<string> CacheKeys = new List<string>();
        public static ILogger? ModuleLogger = null;

        public static ApiDataSource? CheckSQLiteCreate(string dataSourceID)
        {
            if (string.IsNullOrEmpty(dataSourceID) == true)
            {
                return null;
            }

            var dataSource = ApiDataSource.FirstOrDefault(p => p.DataSourceID == dataSourceID);
            if (dataSource != null)
            {
                var userWorkID = string.Empty;
                var appBasePath = string.Empty;
                var baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, dataSourceID, SearchOption.AllDirectories);
                foreach (var directory in directories)
                {
                    var directoryInfo = new DirectoryInfo(directory);
                    if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                    {
                        appBasePath = directoryInfo.FullName;
                        userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                        break;
                    }
                }

                var tenantID = $"{userWorkID}|{dataSourceID}";
                if (string.IsNullOrEmpty(appBasePath) == false)
                {
                    var transactionLogBasePath = Path.Combine(appBasePath, ".managed", "sqlite");
                    if (Directory.Exists(transactionLogBasePath) == false)
                    {
                        Directory.CreateDirectory(transactionLogBasePath);
                    }

                    var logDbFilePath = Path.Combine(transactionLogBasePath, $"openapi.db");
                    var connectionString = $"URI=file:{logDbFilePath};Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;";

                    var fileInfo = new FileInfo(logDbFilePath);
                    if (fileInfo.Directory != null && fileInfo.Directory.Exists == false)
                    {
                        Directory.CreateDirectory(fileInfo.Directory.FullName);
                    }

                    if (fileInfo.Exists == false)
                    {
                        SQLiteConnection.CreateFile(logDbFilePath);
                    }

                    try
                    {
                        var isExistTable = CreateNotExistTable(connectionString, "TransactLog");
                        if (isExistTable == true)
                        {
                            ApiDataSource.Add(new ApiDataSource()
                            {
                                DataSourceID = dataSourceID,
                                DataProvider = "SQLite",
                                ConnectionString = connectionString
                            });

                            if (apiServiceCircuitBreakers.ContainsKey(dataSourceID) == false)
                            {
                                var applicationCircuitBreakerPolicy = new ApiServiceCircuitBreakerPolicy();
                                applicationCircuitBreakerPolicy.ApplicationCircuitBreaker = Policy
                                    .Handle<SqlException>()
                                    .Or<Exception>()
                                    .CircuitBreaker(1, TimeSpan.FromSeconds(CircuitBreakResetSecond), onBreak: (exception, timespan, context) =>
                                    {
                                        Log.Error(exception, $"CircuitBreaker Reason: {exception.Message}");
                                    },
                                    onReset: (context) =>
                                    {
                                        Log.Information($"CircuitBreaker 복구, DateTime={DateTime.Now}");
                                    });

                                applicationCircuitBreakerPolicy.ApplicationCircuitState = CircuitState.Closed;
                                applicationCircuitBreakerPolicy.BreakDateTime = null;

                                apiServiceCircuitBreakers.TryAdd(dataSourceID, applicationCircuitBreakerPolicy);
                            }
                        }
                    }
                    catch
                    {
                        Log.Logger.Error("[{LogCategory}] " + $"'{dataSourceID}' 데이터베이스 연결문자열 또는 권한 확인 필요", $"ModuleInitializer/CheckSQLiteCreate");
                    }
                }

                dataSource = ApiDataSource.FirstOrDefault(p => p.DataSourceID == dataSourceID);
            }

            return dataSource;
        }

        private static bool CreateNotExistTable(string connectionString, string tableName)
        {
            var result = false;
            var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), "SQLite");
            var commandText = $"SELECT COUNT(*) AS IsExists FROM sqlite_master WHERE type='table' AND name ='{tableName}';";
            using (var databaseFactory = new DatabaseFactory(connectionString, dataProvider))
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
                            var sqlFilePath = Path.Combine(ModuleBasePath, "SQL", "Create", dataProvider.ToString() + ".txt");
                            if (File.Exists(sqlFilePath) == true)
                            {
                                var ddlScript = File.ReadAllText(sqlFilePath).Replace("{TableName}", tableName);

                                command.CommandText = ddlScript;
                                command.ExecuteNonQuery();

                                result = true;
                            }
                            else
                            {
                                Log.Logger.Error("[{LogCategory}] " + $"sqlFilePath: {sqlFilePath} 확인 필요", "ModuleConfiguration/CreateNotExistTable");
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
}
