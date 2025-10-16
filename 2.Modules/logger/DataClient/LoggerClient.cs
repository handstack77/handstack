using System;
using System.Collections.Generic;
using System.Data;
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

        private static readonly Dictionary<string, string> sqlScriptCache = new Dictionary<string, string>();
        private static readonly object cacheLock = new object();

        public LoggerClient(ILogger logger)
        {
            this.logger = logger;
        }

        private string GetSqlScript(string operation, string dataProvider, string tableName, int? removePeriod = null)
        {
            var cacheKey = $"{operation}_{dataProvider}_{tableName}";
            if (removePeriod.HasValue)
            {
                cacheKey += $"_{removePeriod.Value}";
            }

            lock (cacheLock)
            {
                if (sqlScriptCache.TryGetValue(cacheKey, out string? cachedScript))
                {
                    return cachedScript;
                }

                var sqlFilePath = PathExtensions.Combine(ModuleConfiguration.ModuleBasePath, "SQL", operation, dataProvider + ".txt");
                if (File.Exists(sqlFilePath) == false)
                {
                    throw new FileNotFoundException($"SQL 파일을 찾을 수 없습니다: {sqlFilePath}");
                }

                var dmlScript = File.ReadAllText(sqlFilePath).Replace("{TableName}", tableName);

                if (removePeriod.HasValue)
                {
                    dmlScript = dmlScript.Replace("{RemovePeriod}", removePeriod.Value.ToString());
                }

                sqlScriptCache[cacheKey] = dmlScript;
                return dmlScript;
            }
        }

        public async Task InsertWithPolicy(LogMessage request)
        {
            ApplicationCircuitBreakerPolicy? applicationCircuitBreakerPolicy = null;

            try
            {
                applicationCircuitBreakerPolicy = ModuleConfiguration.ApplicationIDCircuitBreakers[request.ApplicationID];

                if (applicationCircuitBreakerPolicy.ApplicationCircuitBreaker != null &&
                    applicationCircuitBreakerPolicy.ApplicationCircuitBreaker.CircuitState == CircuitState.Closed)
                {
                    await applicationCircuitBreakerPolicy.ApplicationCircuitBreaker.Execute(async () =>
                    {
                        var dataSource = ModuleConfiguration.DataSource.Find(p => p.ApplicationID == request.ApplicationID);
                        if (dataSource != null)
                        {
                            var connectionString = dataSource.ConnectionString;
                            var provider = dataSource.DataProvider;
                            var tableName = dataSource.TableName;
                            var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);

                            using var databaseFactory = new DatabaseFactory(connectionString, dataProvider);
                            if (databaseFactory.Connection == null)
                            {
                                Log.Logger.Error("[{LogCategory}] Connection 생성 실패. 요청 정보 확인 필요", "LoggerClient/InsertWithPolicy");
                                return;
                            }

                            try
                            {
                                var dmlScript = GetSqlScript("Insert", dataProvider.ToString(), tableName);

                                if (databaseFactory.Connection.IsConnectionOpen() == false)
                                {
                                    await databaseFactory.Connection.OpenAsync();
                                }

                                var dynamicParameters = new DynamicParameters();
                                dynamicParameters.Add("@ServerID", request.ServerID, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@RunningEnvironment", request.RunningEnvironment, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@ProgramName", request.ProgramName, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@GlobalID", request.GlobalID, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@Acknowledge", request.Acknowledge, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@ApplicationID", request.ApplicationID, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@ProjectID", request.ProjectID, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@TransactionID", request.TransactionID, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@ServiceID", request.ServiceID, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@Type", request.Type, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@Flow", request.Flow, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@Level", request.Level, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@Format", request.Format, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@Message", string.IsNullOrEmpty(request.Message) ? "" : request.Message, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@Properties", request.Properties, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@UserID", request.UserID, DbType.String, ParameterDirection.Input);
                                dynamicParameters.Add("@CreatedAt", string.IsNullOrEmpty(request.CreatedAt) ? DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") : request.CreatedAt, DbType.String, ParameterDirection.Input);

                                await databaseFactory.Connection.ExecuteAsync(dmlScript, dynamicParameters);
                            }
                            catch (FileNotFoundException fileNotFoundException)
                            {
                                Log.Logger.Error("[{LogCategory}] " + fileNotFoundException.Message, "LoggerClient/InsertWithPolicy");
                                throw;
                            }
                            finally
                            {
                                if (databaseFactory.Connection?.IsConnectionOpen() == true)
                                {
                                    await databaseFactory.Connection.CloseAsync();
                                }
                            }
                        }
                    });
                }
                else
                {
                    if (applicationCircuitBreakerPolicy.BreakDateTime != null &&
                        applicationCircuitBreakerPolicy.BreakDateTime.Value.Ticks < DateTime.Now.AddSeconds(-ModuleConfiguration.CircuitBreakResetSecond).Ticks)
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
                    var connectionString = dataSource.ConnectionString;
                    var provider = dataSource.DataProvider;
                    var tableName = dataSource.TableName;
                    var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);

                    using var databaseFactory = new DatabaseFactory(connectionString, dataProvider);
                    if (databaseFactory.Connection == null)
                    {
                        Log.Logger.Error("[{LogCategory}] Connection 생성 실패. 요청 정보 확인 필요", "LoggerClient/LogList");
                        return null;
                    }

                    try
                    {
                        var dmlScript = GetSqlScript("List", dataProvider.ToString(), tableName);

                        if (databaseFactory.Connection.IsConnectionOpen() == false)
                        {
                            await databaseFactory.Connection.OpenAsync();
                        }

                        var dynamicParameters = new DynamicParameters();
                        dynamicParameters.Add("@ServerID", serverID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                        dynamicParameters.Add("@Environment", environment.ToStringSafe(), DbType.String, ParameterDirection.Input);
                        dynamicParameters.Add("@GlobalID", globalID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                        dynamicParameters.Add("@ApplicationID", applicationID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                        dynamicParameters.Add("@ProjectID", projectID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                        dynamicParameters.Add("@TransactionID", transactionID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                        dynamicParameters.Add("@ServiceID", serviceID.ToStringSafe(), DbType.String, ParameterDirection.Input);
                        dynamicParameters.Add("@StartedAt", startedAt.ToStringSafe(), DbType.String, ParameterDirection.Input);
                        dynamicParameters.Add("@EndedAt", endedAt.ToStringSafe(), DbType.String, ParameterDirection.Input);

                        using var reader = await databaseFactory.Connection.ExecuteReaderAsync(dmlScript, dynamicParameters);
                        using var ds = DataTableHelper.DataReaderToDataSet(reader);
                        result = ds;
                    }
                    catch (FileNotFoundException fileNotFoundException)
                    {
                        Log.Logger.Error("[{LogCategory}] " + fileNotFoundException.Message, "LoggerClient/LogList");
                    }
                    finally
                    {
                        if (databaseFactory.Connection?.IsConnectionOpen() == true)
                        {
                            await databaseFactory.Connection.CloseAsync();
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
                    var connectionString = dataSource.ConnectionString;
                    var provider = dataSource.DataProvider;
                    var tableName = dataSource.TableName;
                    var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);

                    using var databaseFactory = new DatabaseFactory(connectionString, dataProvider);
                    if (databaseFactory.Connection == null)
                    {
                        Log.Logger.Error("[{LogCategory}] Connection 생성 실패. 요청 정보 확인 필요", "LoggerClient/LogDetail");
                        return null;
                    }

                    try
                    {
                        var dmlScript = GetSqlScript("Get", dataProvider.ToString(), tableName);

                        if (databaseFactory.Connection.IsConnectionOpen() == false)
                        {
                            await databaseFactory.Connection.OpenAsync();
                        }

                        var dynamicParameters = new DynamicParameters();
                        dynamicParameters.Add("@ApplicationID", applicationID, DbType.String, ParameterDirection.Input);
                        dynamicParameters.Add("@LogNo", logNo, DbType.Int32, ParameterDirection.Input);

                        using var reader = await databaseFactory.Connection.ExecuteReaderAsync(dmlScript, dynamicParameters);
                        using var ds = DataTableHelper.DataReaderToDataSet(reader);
                        result = ds;
                    }
                    catch (FileNotFoundException fileNotFoundException)
                    {
                        Log.Logger.Error("[{LogCategory}] " + fileNotFoundException.Message, "LoggerClient/LogDetail");
                    }
                    finally
                    {
                        // 명시적으로 연결 닫기
                        if (databaseFactory.Connection?.IsConnectionOpen() == true)
                        {
                            await databaseFactory.Connection.CloseAsync();
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
            for (var i = 0; i < ModuleConfiguration.DataSource.Count; i++)
            {
                var dataSource = ModuleConfiguration.DataSource[i];
                using var cancellationTokenSource = new CancellationTokenSource();

                try
                {
                    var connectionString = dataSource.ConnectionString;
                    var provider = dataSource.DataProvider;
                    var tableName = dataSource.TableName;
                    var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), provider);

                    using var databaseFactory = new DatabaseFactory(connectionString, dataProvider);
                    if (databaseFactory.Connection == null)
                    {
                        Log.Logger.Error("[{LogCategory}] Connection 생성 실패. 요청 정보 확인 필요", "LoggerClient/Delete");
                        continue;
                    }

                    try
                    {
                        var dmlScript = GetSqlScript("Delete", dataProvider.ToString(), tableName, dataSource.RemovePeriod);

                        cancellationTokenSource.CancelAfter(60000);
                        if (databaseFactory.Connection.IsConnectionOpen() == false)
                        {
                            await databaseFactory.Connection.OpenAsync(cancellationTokenSource.Token);
                        }

                        await databaseFactory.Connection.ExecuteScalarAsync(dmlScript);
                    }
                    catch (FileNotFoundException fileNotFoundException)
                    {
                        Log.Logger.Error("[{LogCategory}] " + fileNotFoundException.Message, "LoggerClient/Delete");
                    }
                    finally
                    {
                        if (databaseFactory.Connection?.IsConnectionOpen() == true)
                        {
                            await databaseFactory.Connection.CloseAsync();
                        }
                    }
                }
                catch (OperationCanceledException operationCanceledException)
                {
                    logger.Warning(operationCanceledException, $"[{{LogCategory}}] 로그 삭제 타임아웃 applicationID: {dataSource.ApplicationID}, provider: {dataSource.DataProvider}", "LoggerClient/Delete");
                }
                catch (Exception exception)
                {
                    logger.Error(exception, $"[{{LogCategory}}] 로그 삭제 오류 applicationID: {dataSource.ApplicationID}, provider: {dataSource.DataProvider}", "LoggerClient/Delete");
                }
            }
        }
    }
}
