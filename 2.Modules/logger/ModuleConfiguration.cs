using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Data.SQLite;
using System.IO;
using System.Linq;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Web;

using logger.Entity;

using Polly;
using Polly.CircuitBreaker;

using Serilog;

namespace logger
{
    public static class ModuleConfiguration
    {
        public static bool IsConfigure = false;
        public static string ModuleID = "logger";
        public static string Version = "";
        public static string AuthorizationKey = "";
        public static bool IsBundledWithHost = false;
        public static bool IsSQLiteCreateOnNotSettingRequest = false;
        public static string BusinessServerUrl = "";
        public static string ModuleBasePath = "";
        public static int LogDeleteRepeatSecond = 43200;
        public static int CircuitBreakResetSecond = 30;
        public static bool IsApiFindServer = false;
        public static List<DataSource> DataSource = new List<DataSource>();
        public static Dictionary<string, ApplicationCircuitBreakerPolicy> ApplicationIDCircuitBreakers = new Dictionary<string, ApplicationCircuitBreakerPolicy>();

        public static DataSource? CheckSQLiteCreate(string applicationID)
        {
            if (string.IsNullOrEmpty(applicationID) == true)
            {
                return null;
            }

            var dataSource = DataSource.FirstOrDefault(p => p.ApplicationID == applicationID);
            if (dataSource == null && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false)
            {
                string userWorkID = string.Empty;
                string appBasePath = string.Empty;
                DirectoryInfo baseDirectoryInfo = new DirectoryInfo(GlobalConfiguration.TenantAppBasePath);
                var directories = Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath, applicationID, SearchOption.AllDirectories);
                foreach (string directory in directories)
                {
                    DirectoryInfo directoryInfo = new DirectoryInfo(directory);
                    if (baseDirectoryInfo.Name == directoryInfo.Parent?.Parent?.Name)
                    {
                        appBasePath = directoryInfo.FullName;
                        userWorkID = (directoryInfo.Parent?.Name).ToStringSafe();
                        break;
                    }
                }

                string tenantID = $"{userWorkID}|{applicationID}";
                if (string.IsNullOrEmpty(appBasePath) == false)
                {
                    string transactionLogBasePath = Path.Combine(appBasePath, ".managed", "sqlite");
                    if (Directory.Exists(transactionLogBasePath) == false)
                    {
                        Directory.CreateDirectory(transactionLogBasePath);
                    }

                    string logDbFilePath = Path.Combine(transactionLogBasePath, $"transact.db");
                    string connectionString = $"URI=file:{logDbFilePath};Journal Mode=Off;Cache Size=4000;Synchronous=Normal;Page Size=4096;Pooling=True;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;";

                    FileInfo fileInfo = new FileInfo(logDbFilePath);
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
                        bool isExistTable = CreateNotExistTable(connectionString, "TransactLog");
                        if (isExistTable == true)
                        {
                            DataSource.Add(new DataSource()
                            {
                                ApplicationID = applicationID,
                                TableName = "TransactLog",
                                DataProvider = "SQLite",
                                RemovePeriod = -30,
                                ConnectionString = connectionString,
                                IsEncryption = "N"
                            });

                            if (ApplicationIDCircuitBreakers.ContainsKey(applicationID) == false)
                            {
                                ApplicationCircuitBreakerPolicy applicationCircuitBreakerPolicy = new ApplicationCircuitBreakerPolicy();
                                applicationCircuitBreakerPolicy.ApplicationCircuitBreaker = Polly.Policy
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

                                ApplicationIDCircuitBreakers.TryAdd(applicationID, applicationCircuitBreakerPolicy);
                            }
                        }
                    }
                    catch
                    {
                        Log.Logger.Error("[{LogCategory}] " + $"'{applicationID}' 데이터베이스 연결문자열 또는 권한 확인 필요", $"ModuleInitializer/CheckSQLiteCreate");
                    }
                }

                dataSource = DataSource.FirstOrDefault(p => p.ApplicationID == applicationID);
            }

            return dataSource;
        }

        private static bool CreateNotExistTable(string connectionString, string tableName)
        {
            bool result = false;
            var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), "SQLite");
            string commandText = $"SELECT COUNT(*) AS IsExists FROM sqlite_master WHERE type='table' AND name ='{tableName}';";
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
