using System;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using Dapper;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Data;
using HandStack.Web.MessageContract.Message;

using logger.Encapsulation;
using logger.Entity;

using Newtonsoft.Json;

using Polly.CircuitBreaker;

using Serilog;

namespace logger.DataClient
{
    public class LoggerClient : ILoggerClient
    {
        private ILogger logger { get; }

        public LoggerClient(ILogger logger)
        {
            this.logger = logger;
        }

        public void InsertWithPolicy(LogMessage request)
        {
            ApplicationCircuitBreakerPolicy? applicationCircuitBreakerPolicy = null;

            try
            {
                applicationCircuitBreakerPolicy = ModuleConfiguration.ApplicationIDCircuitBreakers[request.ApplicationID];

                if (applicationCircuitBreakerPolicy.ApplicationCircuitBreaker != null && applicationCircuitBreakerPolicy.ApplicationCircuitBreaker.CircuitState == CircuitState.Closed)
                {
                    applicationCircuitBreakerPolicy.ApplicationCircuitBreaker.Execute(() =>
                    {
                        var dataSource = ModuleConfiguration.DataSource.Find(p => p.ApplicationID == request.ApplicationID);
                        if (dataSource != null)
                        {
                            string connectionString = dataSource.ConnectionString;
                            string provider = dataSource.DataProvider;
                            string tableName = dataSource.TableName;
                            var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);

                            using (DatabaseFactory databaseFactory = new DatabaseFactory(connectionString, dataProvider))
                            {
                                if (databaseFactory.Connection == null)
                                {
                                    Log.Logger.Error("[{LogCategory}] " + "Connection 생성 실패. 요청 정보 확인 필요", "LoggerClient/InsertWithPolicy");
                                }
                                else
                                {
                                    string sqlFilePath = PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "SQL", "Insert", dataProvider.ToString() + ".txt");
                                    if (File.Exists(sqlFilePath) == true)
                                    {
                                        string dmlScript = File.ReadAllText(sqlFilePath).Replace("{TableName}", tableName);

                                        if (databaseFactory.Connection.IsConnectionOpen() == false)
                                        {
                                            databaseFactory.Connection.Open();
                                        }

                                        DynamicParameters dynamicParameters = new DynamicParameters();
                                        dynamicParameters.Add("@ServerID", request.ServerID, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@RunningEnvironment", request.RunningEnvironment, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@ProgramName", request.ProgramName, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@GlobalID", request.GlobalID, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@Acknowledge", request.Acknowledge, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@ApplicationID", request.ApplicationID, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@ProjectID", request.ProjectID, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@TransactionID", request.TransactionID, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@ServiceID", request.ServiceID, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@Type", request.Type, DbType.String, ParameterDirection.Input); // 로그구분 A (Application), T (Transaction)
                                        dynamicParameters.Add("@Flow", request.Flow, DbType.String, ParameterDirection.Input); // 거래흐름 N (Not), I (In), O (Out)
                                        dynamicParameters.Add("@Level", request.Level, DbType.String, ParameterDirection.Input); // 로그순위 V (VRB), D (DBG), I (INF), W (WRN), E (ERR), F (FTL)
                                        dynamicParameters.Add("@Format", request.Format, DbType.String, ParameterDirection.Input); // 데이터형식 P (Plain), T (TSV), C (CSV), J (JSON), X (XML)
                                        dynamicParameters.Add("@Message", string.IsNullOrEmpty(request.Message) == true ? "" : request.Message, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@Properties", request.Properties, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@UserID", request.UserID, DbType.String, ParameterDirection.Input);
                                        dynamicParameters.Add("@CreatedAt", string.IsNullOrEmpty(request.CreatedAt) == true ? DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") : request.CreatedAt, DbType.String, ParameterDirection.Input);

                                        DbConnection connection = databaseFactory.Connection;
                                        var result = connection.Execute(dmlScript, dynamicParameters);
                                    }
                                    else
                                    {
                                        Log.Logger.Error("[{LogCategory}] " + $"sqlFilePath: {sqlFilePath} 확인 필요", "LoggerClient/InsertWithPolicy");
                                    }
                                }
                            }
                        }
                    });
                }
                else
                {
                    if (applicationCircuitBreakerPolicy.BreakDateTime != null && applicationCircuitBreakerPolicy.BreakDateTime.Value.Ticks < DateTime.Now.AddSeconds(-ModuleConfiguration.CircuitBreakResetSecond).Ticks)
                    {
                        applicationCircuitBreakerPolicy.BreakDateTime = null;
                        applicationCircuitBreakerPolicy.ApplicationCircuitBreaker?.Reset();
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] 로그 입력 오류: " + JsonConvert.SerializeObject(request), "LoggerClient/InsertWithPolicy");

                try
                {
                    if (applicationCircuitBreakerPolicy != null)
                    {
                        applicationCircuitBreakerPolicy.BreakDateTime = DateTime.Now;
                        applicationCircuitBreakerPolicy.ApplicationCircuitBreaker?.Isolate();
                    }
                }
                catch
                {
                }
            }
        }

        public async Task<DataSet?> LogList(string applicationID, string? serverID, string? globalID, string? environment, string? projectID, string? serviceID, string? transactionID, string? startedAt, string? endedAt)
        {
            DataSet? result = null;

            try
            {
                var dataSource = ModuleConfiguration.DataSource.Find(p => p.ApplicationID == applicationID);
                if (dataSource != null)
                {
                    string connectionString = dataSource.ConnectionString;
                    string provider = dataSource.DataProvider;
                    string tableName = dataSource.TableName;
                    var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);

                    using (DatabaseFactory databaseFactory = new DatabaseFactory(connectionString, dataProvider))
                    {
                        if (databaseFactory.Connection == null)
                        {
                            Log.Logger.Error("[{LogCategory}] " + "Connection 생성 실패. 요청 정보 확인 필요", "LoggerClient/LogList");
                        }
                        else
                        {
                            string sqlFilePath = PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "SQL", "List", dataProvider.ToString() + ".txt");
                            if (File.Exists(sqlFilePath) == true)
                            {
                                string dmlScript = File.ReadAllText(sqlFilePath).Replace("{TableName}", tableName);

                                if (databaseFactory.Connection.IsConnectionOpen() == false)
                                {
                                    databaseFactory.Connection.Open();
                                }

                                DynamicParameters dynamicParameters = new DynamicParameters();
                                dynamicParameters.Add("@ServerID", serverID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@Environment", environment.ToStringSafe(), DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@GlobalID", globalID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@ApplicationID", applicationID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@ProjectID", projectID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@TransactionID", transactionID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@ServiceID", serviceID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@StartedAt", startedAt.ToStringSafe(), DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@EndedAt", endedAt.ToStringSafe(), DbType.String, ParameterDirection.Input);

                                DbConnection connection = databaseFactory.Connection;
                                var reader = await connection.ExecuteReaderAsync(dmlScript, dynamicParameters);
                                using (DataSet? ds = DataTableHelper.DataReaderToDataSet(reader))
                                {
                                    result = ds;
                                }
                            }
                            else
                            {
                                Log.Logger.Error("[{LogCategory}] " + $"sqlFilePath: {sqlFilePath} 확인 필요", "LoggerClient/LogList");
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, $"[{{LogCategory}}] 로그 목록 조회 오류 applicationID: {applicationID}, serverID: {serverID}, globalID: {globalID}, environment: {environment}, projectID: {projectID}, serviceID: {serviceID}, transactionID: {transactionID}, startedAt: {startedAt}, endedAt: {endedAt}", "LoggerClient/LogList");
            }

            return result;
        }

        public async Task<DataSet?> LogDetail(string applicationID, string logNo)
        {
            DataSet? result = null;

            try
            {
                var dataSource = ModuleConfiguration.DataSource.Find(p => p.ApplicationID == applicationID);
                if (dataSource != null)
                {
                    string connectionString = dataSource.ConnectionString;
                    string provider = dataSource.DataProvider;
                    string tableName = dataSource.TableName;
                    var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);

                    using (DatabaseFactory databaseFactory = new DatabaseFactory(connectionString, dataProvider))
                    {
                        if (databaseFactory.Connection == null)
                        {
                            Log.Logger.Error("[{LogCategory}] " + "Connection 생성 실패. 요청 정보 확인 필요", "LoggerClient/LogDetail");
                        }
                        else
                        {
                            string sqlFilePath = PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "SQL", "Get", dataProvider.ToString() + ".txt");
                            if (File.Exists(sqlFilePath) == true)
                            {
                                string dmlScript = File.ReadAllText(sqlFilePath).Replace("{TableName}", tableName);

                                if (databaseFactory.Connection.IsConnectionOpen() == false)
                                {
                                    databaseFactory.Connection.Open();
                                }

                                DynamicParameters dynamicParameters = new DynamicParameters();
                                dynamicParameters.Add("@ApplicationID", applicationID, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@LogNo", logNo, DbType.Int32, ParameterDirection.Input);

                                DbConnection connection = databaseFactory.Connection;
                                var reader = await connection.ExecuteReaderAsync(dmlScript, dynamicParameters);
                                using (DataSet? ds = DataTableHelper.DataReaderToDataSet(reader))
                                {
                                    result = ds;
                                }
                            }
                            else
                            {
                                Log.Logger.Error("[{LogCategory}] " + $"sqlFilePath: {sqlFilePath} 확인 필요", "LoggerClient/LogDetail");
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, $"[{{LogCategory}}] 로그 조회 오류 applicationID: {applicationID}, logNo: {logNo}", "LoggerClient/LogDetail");
            }

            return result;
        }

        public async Task Delete()
        {
            for (int i = 0; i < ModuleConfiguration.DataSource.Count; i++)
            {
                CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();
                var dataSource = ModuleConfiguration.DataSource[i];
                try
                {
                    string connectionString = dataSource.ConnectionString;
                    string provider = dataSource.DataProvider;
                    string tableName = dataSource.TableName;
                    var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);

                    using (DatabaseFactory databaseFactory = new DatabaseFactory(connectionString, dataProvider))
                    {
                        if (databaseFactory.Connection == null)
                        {
                            Log.Logger.Error("[{LogCategory}] " + "Connection 생성 실패. 요청 정보 확인 필요", "LoggerClient/Remove");
                        }
                        else
                        {
                            string sqlFilePath = PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "SQL", "Delete", dataProvider.ToString() + ".txt");
                            if (File.Exists(sqlFilePath) == true)
                            {
                                string dmlScript = File.ReadAllText(sqlFilePath)
                                        .Replace("{TableName}", tableName)
                                        .Replace("{RemovePeriod}", dataSource.RemovePeriod.ToString());

                                cancellationTokenSource.CancelAfter(60000);
                                if (databaseFactory.Connection.IsConnectionOpen() == false)
                                {
                                    await databaseFactory.Connection.OpenAsync(cancellationTokenSource.Token);
                                }

                                DbConnection connection = databaseFactory.Connection;
                                await connection.ExecuteScalarAsync(dmlScript);
                            }
                            else
                            {
                                Log.Logger.Error("[{LogCategory}] " + $"sqlFilePath: {sqlFilePath} 확인 필요", "LoggerClient/Remove");
                            }
                        }
                    }
                }
                catch (OperationCanceledException operationCanceledException)
                {
                    logger.Warning(operationCanceledException, $"[{{LogCategory}}] 로그 삭제 타임아웃 applicationID: {dataSource.ApplicationID},  provider: {dataSource.DataProvider}", "LoggerClient/Remove");
                }
                catch (Exception exception)
                {
                    logger.Error(exception, $"[{{LogCategory}}] 로그 삭제 오류 applicationID: {dataSource.ApplicationID},  provider: {dataSource.DataProvider}", "LoggerClient/Remove");
                }
                finally
                {
                    cancellationTokenSource.Dispose();
                }
            }
        }
    }
}
