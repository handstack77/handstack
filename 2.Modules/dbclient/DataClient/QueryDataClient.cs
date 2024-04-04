using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml.Serialization;

using Dapper;

using dbclient.Encapsulation;
using dbclient.Entity;
using dbclient.Extensions;
using dbclient.NativeParameters;
using dbclient.Profiler;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Core.Helpers;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MySql.Data.MySqlClient;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using NpgsqlTypes;

using Oracle.ManagedDataAccess.Client;

namespace dbclient.DataClient
{
    /// <code>
    /// using (QueryDataClient queryDataClient = new QueryDataClient())
    /// {
    ///     List<DynamicParameter> parameters = new List<DynamicParameter>();
    ///     parameters.Add("#ApplicationID", 0);
    ///     parameters.Add("@ApplicationID", 0);
    ///     parameters.Add("@BusinessID", 0);
    ///     parameters.Add("@CodeGroupID", "hello world");
    ///     
    ///	    var dynamicResult = queryDataClient.ExecuteDirectSQLMap("DZAAA001L00", parameters);
    ///	    if (string.IsNullOrEmpty(dynamicResult.ExceptionText) == true)
    ///	    {
    ///	    	List<DomainClient> clients = queryDataClient.DbConnection.Query<DomainClient>(dynamicResult.ParseSQL, dynamicResult.DynamicParameters).AsList();
    ///	    }
    /// }
    /// </code>
    public class QueryDataClient : IQueryDataClient
    {
        public DbConnection? DbConnection { get; private set; } = null;

        private Encoding encoding = Encoding.UTF8;

        private Serilog.ILogger logger { get; }

        private DbClientLoggerClient loggerClient { get; }

        private TransactionClient businessApiClient { get; }

        public QueryDataClient(Serilog.ILogger logger, TransactionClient businessApiClient, DbClientLoggerClient loggerClient)
        {
            this.logger = logger;
            this.businessApiClient = businessApiClient;
            this.loggerClient = loggerClient;
        }

        public DynamicResult ExecuteDirectSQLMap(string queryID, List<DynamicParameter> parameters, bool paddingParameter = false)
        {
            DynamicRequest request = new DynamicRequest();
            DynamicResponse response = new DynamicResponse();
            List<QueryObject> dynamicObjects = new List<QueryObject>();

            dynamicObjects.Add(new QueryObject() { QueryID = queryID, Parameters = parameters });

            request.DynamicObjects = dynamicObjects;

            DynamicResult result = new DynamicResult();
            Dictionary<string, TransactionDynamicObjects> transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();
            Tuple<string, DataProviders>? connectionInfo = null;

            try
            {
                List<string> logQuerys = new List<string>();
                int i = 0;
                foreach (QueryObject queryObject in request.DynamicObjects)
                {
                    var statementMap = DatabaseMapper.GetStatementMap(queryObject.QueryID);
                    if (statementMap == null)
                    {
                        result.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return result;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    connectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, statementMap.DataSourceID);

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionDynamicObjects()
                    {
                        DynamicTransaction = queryObject,
                        Statement = statementMap,
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        string logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteDirectSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDirectSQLMap", request.GlobalID);
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteDirectSQLMap", request.GlobalID);
                        }
                    }
                }

                if (connectionInfo == null)
                {
                    result.ExceptionText = $"{request.RequestID}에 대한 DataSourceID 데이터 원본 정보 필요";
                    return result;
                }

                var databaseProvider = connectionInfo.Item2;

                i = 0;
                List<object> mergeDatas = new List<object>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    QueryObject? queryObject = transactionDynamicObject.Value.DynamicTransaction;
                    StatementMap statementMap = transactionDynamicObject.Value.Statement;

                    if (queryObject == null || statementMap == null)
                    {
                        result.ExceptionText = $"QueryObject 또는 StatementMap 정보 필요";
                        return result;
                    }

                    string parseSQL = DatabaseMapper.Find(statementMap, queryObject);

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                    if (dynamicParameters != null && queryObject.Parameters != null)
                    {
                        List<DbParameterMap> dbParameterMaps = statementMap.DbParameters;
                        foreach (DbParameterMap dbParameterMap in dbParameterMaps)
                        {
                            DynamicParameter? dynamicParameter = GetDbParameterMap(dbParameterMap.Name, queryObject.Parameters);

                            if (dynamicParameter == null)
                            {
                                if (paddingParameter == true)
                                {
                                    dynamicParameter = new DynamicParameter()
                                    {
                                        ParameterName = dbParameterMap.Name,
                                        DbType = dbParameterMap.DbType,
                                        Value = null
                                    };
                                }
                                else
                                {
                                    result.ExceptionText = $"ParameterMap - {dbParameterMap.Name}에 대한 매핑 정보 필요";
                                    return result;
                                }
                            }

                            if (dynamicParameters != null)
                            {
                                dynamicParameters.Add(
                                    dynamicParameter.ParameterName,
                                    dynamicParameter.Value == null && dbParameterMap.DefaultValue != "NULL" ? dbParameterMap.DefaultValue : dynamicParameter.Value,
                                    (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(dbParameterMap.DbType) == true ? dynamicParameter.DbType : dbParameterMap.DbType),
                                    (ParameterDirection)Enum.Parse(typeof(ParameterDirection), dbParameterMap.Direction),
                                    dbParameterMap.Length <= 0 ? -1 : dbParameterMap.Length
                                );
                            }
                        }
                    }

                    result.ParseSQL = parseSQL;
                    result.DynamicParameters = dynamicParameters;

                    response.Acknowledge = AcknowledgeType.Success;
                }
            }
            catch (Exception exception)
            {
                result.ExceptionText = exception.ToMessage();
            }

            return result;
        }

        public async Task ExecuteDynamicSQLMap(DynamicRequest request, DynamicResponse response)
        {
            bool isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            Dictionary<string, TransactionDynamicObjects> transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                List<string> logQuerys = new List<string>();
                int i = 0;
                foreach (QueryObject queryObject in request.DynamicObjects)
                {
                    var statementMap = DatabaseMapper.GetStatementMap(queryObject.QueryID);
                    if (statementMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    var connectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, statementMap.DataSourceID);

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionDynamicObjects()
                    {
                        DynamicTransaction = queryObject,
                        Statement = statementMap,
                        ConnectionString = connectionInfo == null ? "" : connectionInfo.Item1,
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        string logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap", request.GlobalID);
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteDynamicSQLMap", request.GlobalID);
                        }
                    }
                }

                foreach (var item in transactionDynamicObjects)
                {
                    if (string.IsNullOrEmpty(item.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"{item.Key}에 대한 DataSourceID 데이터 원본 확인 필요";
                        return;
                    }
                }

                i = 0;

                Dictionary<int, DataRow?> dataRows = new Dictionary<int, DataRow?>();
                DataTable additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                List<string> mergeMetaDatas = new List<string>();
                List<object> mergeDatas = new List<object>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    QueryObject dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    StatementMap statementMap = transactionDynamicObject.Value.Statement;

                    if (string.IsNullOrEmpty(transactionDynamicObject.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"RequestID: {request.RequestID}에 대한 DataSourceID: {statementMap.DataSourceID} 데이터 원본 정보 필요";
                        isCommandError = true;
                        goto TransactionException;
                    }

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    transactionDynamicObject.Value.ConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                    if (request.IsTransaction == true)
                    {
                        transactionDynamicObject.Value.DatabaseTransaction = transactionDynamicObject.Value.ConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                    }

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);

                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            int baseSequence = statementMap.Seq - 1;
                            DataRow? dataRow = null;
                            if (dataRows.Count > 0 && statementMap.Seq > 0)
                            {
                                dataRow = dataRows.GetValueOrDefault(baseSequence);
                            }

                            for (int baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                BaseFieldMapping baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (string.IsNullOrEmpty(baseFieldMapping.BaseSequence) == false)
                                {
                                    int baseSequenceMapping = int.Parse(baseFieldMapping.BaseSequence);
                                    if (baseSequence != baseSequenceMapping)
                                    {
                                        baseSequence = baseSequenceMapping;
                                        dataRow = dataRows.GetValueOrDefault(baseSequence);
                                    }
                                }

                                if (dataRow == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 매핑 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    string SQLID = "";
                    string executeDataID = dynamicObject.QueryID + "_" + i.ToString();

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        string logData = $"Pretreatment: {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                        });
                    }

                    var pretreatment = DatabaseMapper.FindPretreatment(statementMap, dynamicObject);
                    if (pretreatment.SQL != null && pretreatment.ResultType != null)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                        if (request.IsTransaction == true)
                        {
                            transactionDynamicObject.Value.PretreatmentDatabaseTransaction = transactionDynamicObject.Value.PretreatmentConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                        }

                        if (pretreatment.SQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() != "")
                        {
                            SQLID = executeDataID + "_pretreatment";

                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                                });
                            }

                            ConsoleProfiler pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection, pretreatmentProfiler);

                            try
                            {
                                transactionDynamicObject.Value.PretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.PretreatmentDatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);
                                using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.PretreatmentReader))
                                {
                                    var resultTypes = pretreatment.ResultType.Split(",");
                                    if (resultTypes.Count() != (ds == null ? 0 : ds.Tables.Count))
                                    {
                                        response.ExceptionText = $"Pretreatment - 전처리 쿼리 실행 결과와 {pretreatment.ResultType} 설정 확인 필요";
                                        isCommandError = true;
                                        goto TransactionException;
                                    }

                                    if (ds != null)
                                    {
                                        for (int j = 0; j < ds.Tables.Count; j++)
                                        {
                                            string resultType = resultTypes[j].Trim();
                                            DataTable table = ds.Tables[j];
                                            if (table.Columns.Count == 0)
                                            {
                                                continue;
                                            }

                                            if (resultType == "Row")
                                            {
                                                DataRow rowItem = table.Rows[0];
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                    DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                    if (dynamicParameter == null)
                                                    {
                                                        DataProviders? dataProvider = null;
                                                        if (statementMap.NativeDataClient == true)
                                                        {
                                                            dataProvider = databaseProvider;
                                                        }

                                                        dynamicParameter = new DynamicParameter();
                                                        dynamicParameter.ParameterName = item.ColumnName;
                                                        dynamicParameter.Length = item.MaxLength;
                                                        dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                        dynamicObject.Parameters.Add(dynamicParameter);
                                                    }
                                                    else
                                                    {
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                    }
                                                }
                                            }
                                            else if (resultType == "List")
                                            {
                                                List<object> parameters = new List<object>();
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    DataView dataView = new DataView(table);
                                                    DataTable dataTable = dataView.ToTable(true, item.ColumnName);
                                                    foreach (DataRow row in dataTable.Rows)
                                                    {
                                                        parameters.Add(row[0]);
                                                    }

                                                    if (parameters.Count > 0)
                                                    {
                                                        dynamicParameters?.Add(item.ColumnName, parameters);

                                                        DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                        if (dynamicParameter == null)
                                                        {
                                                            DataProviders? dataProvider = null;
                                                            if (statementMap.NativeDataClient == true)
                                                            {
                                                                dataProvider = databaseProvider;
                                                            }

                                                            dynamicParameter = new DynamicParameter();
                                                            dynamicParameter.ParameterName = item.ColumnName;
                                                            dynamicParameter.Length = item.MaxLength;
                                                            dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                            dynamicParameter.Value = parameters;
                                                            dynamicObject.Parameters.Add(dynamicParameter);
                                                        }
                                                        else
                                                        {
                                                            dynamicParameter.Value = parameters;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                                {
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                                    });
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = $"SQLID: {SQLID}, ExceptionText: {exception.ToMessage()}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMap");
                                });

                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(statementMap.BeforeTransactionCommand) == false)
                    {
                        string logData = "";
                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            logData = $"GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, CommandID={statementMap.BeforeTransactionCommand}, , dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, $"ExecuteDynamicSQLMap/BeforeTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "ExecuteDynamicSQLMap/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "ExecuteDynamicSQLMap/BeforeTransactionCommand", request.GlobalID);
                            }
                        }

                        var transactionCommands = statementMap.BeforeTransactionCommand.Split("|");
                        string beforeCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                        if (string.IsNullOrEmpty(beforeCommandResult) == false)
                        {
                            response.ExceptionText = $"ExecuteDynamicSQLMap.BeforeTransactionCommand Error: {beforeCommandResult}";

                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"ExecuteDynamicSQLMap/BeforeTransactionCommand", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "ExecuteDynamicSQLMap/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "ExecuteDynamicSQLMap/BeforeTransactionCommand", request.GlobalID);
                            }

                            isCommandError = true;
                            goto TransactionException;
                        }
                    }

                    SQLID = executeDataID + "_statement";
                    ConsoleProfiler profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                            });
                        }

                        string parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                        if (string.IsNullOrEmpty(parseSQL) == true || parseSQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() == "")
                        {
                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", empty SQL passing" + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                                });
                            }

                            continue;
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                            });
                        }

                        var connection = new ProfilerDbConnection(transactionDynamicObject.Value.ConnectionFactory.Connection, profiler);
                        transactionDynamicObject.Value.MainReader = await connection.ExecuteReaderAsync(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                            });
                        }

                        if (dynamicObject.IgnoreResult == true)
                        {
                            using (DataTable dataTable = new DataTable())
                            using (DataTable? schemaTable = transactionDynamicObject.Value.MainReader.GetSchemaTable())
                            {
                                if (schemaTable == null)
                                {
                                    continue;
                                }

                                DataRow row;

                                string columnName;
                                DataColumn column;
                                int count = schemaTable.Rows.Count;

                                for (int j = 0; j < count; j++)
                                {
                                    row = schemaTable.Rows[j];
                                    columnName = (string)row["ColumnName"];

                                    column = new DataColumn(columnName, (Type)row["DataType"]);
                                    dataTable.Columns.Add(column);
                                }

                                object[] values = new object[count];

                                try
                                {
                                    dataTable.BeginLoadData();
                                    while (transactionDynamicObject.Value.MainReader.Read())
                                    {
                                        transactionDynamicObject.Value.MainReader.GetValues(values);
                                        dataTable.LoadDataRow(values, true);
                                    }
                                    dataTable.EndLoadData();
                                }
                                finally
                                {
                                    dataTable.EndLoadData();
                                }

                                if (dataTable.Rows.Count > 0)
                                {
                                    dataRows[statementMap.Seq] = dataTable.Rows[dataTable.Rows.Count - 1];
                                }
                                else
                                {
                                    dataRows[statementMap.Seq] = null;
                                }
                            }
                        }
                        else
                        {
                            using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.MainReader))
                            {
                                JsonObjectType jsonObjectType = JsonObjectType.FormJson;

                                if (ds != null)
                                {
                                    for (int j = 0; j < ds.Tables.Count; j++)
                                    {
                                        DataTable table = ds.Tables[j];
                                        if (table.Columns.Count == 0)
                                        {
                                            continue;
                                        }

                                        if (dynamicObject.BaseFieldRelations != null && dynamicObject.BaseFieldRelations.Count() > 0)
                                        {
                                            var baseFieldRelation = dynamicObject.BaseFieldRelations[j];
                                            if (baseFieldRelation != null && baseFieldRelation.BaseSequence >= 0 && ((ds.Tables.Count - 1) >= baseFieldRelation.BaseSequence))
                                            {
                                                var baseTable = ds.Tables[baseFieldRelation.BaseSequence];
                                                if (baseTable != null)
                                                {
                                                    string baseColumnID = string.IsNullOrEmpty(baseFieldRelation.RelationFieldID) == true ? "_Children" : baseFieldRelation.RelationFieldID;
                                                    if (baseTable.Columns.Contains(baseColumnID) == false && baseFieldRelation.RelationMappings.Count > 0)
                                                    {
                                                        baseTable.Columns.Add(baseColumnID, typeof(object));

                                                        var dvChildren = table.AsDataView();
                                                        foreach (DataRow row in baseTable.Rows)
                                                        {
                                                            List<string> rowFilters = new List<string>() { "1<2" };
                                                            foreach (var item in baseFieldRelation.RelationMappings)
                                                            {
                                                                if (baseTable.Columns.Contains(item.BaseFieldID) == true && table.Columns.Contains(item.ChildrenFieldID) == true)
                                                                {
                                                                    rowFilters.Add($" AND {item.BaseFieldID} = '{row[item.ChildrenFieldID]}'");
                                                                }
                                                            }

                                                            if (rowFilters.Count > 1)
                                                            {
                                                                dvChildren.RowFilter = string.Join("", rowFilters);

                                                                DataTable? dtChildren = null;
                                                                if (baseFieldRelation.ColumnNames.Count > 0)
                                                                {
                                                                    dtChildren = dvChildren.ToTable(false, baseFieldRelation.ColumnNames.ToArray());
                                                                }
                                                                else
                                                                {
                                                                    dtChildren = dvChildren.ToTable();
                                                                    foreach (var item in baseFieldRelation.RelationMappings)
                                                                    {
                                                                        dtChildren.Columns.Remove(item.ChildrenFieldID);
                                                                    }
                                                                }

                                                                row[baseColumnID] = dtChildren;
                                                            }
                                                        }

                                                        if (baseFieldRelation.DisposeResult == true)
                                                        {
                                                            ds.Tables.Remove(table);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    for (int j = 0; j < ds.Tables.Count; j++)
                                    {
                                        DataTable table = ds.Tables[j];
                                        if (table.Columns.Count == 0)
                                        {
                                            continue;
                                        }

                                        if (dynamicObject.JsonObjects == null || dynamicObject.JsonObjects.Count == 0)
                                        {
                                            jsonObjectType = dynamicObject.JsonObject;
                                        }
                                        else
                                        {
                                            try
                                            {
                                                jsonObjectType = dynamicObject.JsonObjects[i];
                                            }
                                            catch
                                            {
                                                jsonObjectType = dynamicObject.JsonObject;
                                            }
                                        }

                                        StringBuilder sb = new StringBuilder(256);
                                        for (int k = 0; k < table.Columns.Count; k++)
                                        {
                                            var column = table.Columns[k];
                                            sb.Append($"{column.ColumnName}:{JsonExtensions.toMetaDataType(column.DataType.Name)};");
                                        }

                                        switch (jsonObjectType)
                                        {
                                            case JsonObjectType.FormJson:
                                                mergeMetaDatas.Add(sb.ToString());
                                                mergeDatas.Add(FormJson.ToJsonObject("FormData" + i.ToString(), table));
                                                break;
                                            case JsonObjectType.jqGridJson:
                                                mergeMetaDatas.Add(sb.ToString());
                                                mergeDatas.Add(jqGridJson.ToJsonObject("jqGridData" + i.ToString(), table));
                                                break;
                                            case JsonObjectType.GridJson:
                                                mergeMetaDatas.Add(sb.ToString());
                                                mergeDatas.Add(GridJson.ToJsonObject("GridData" + i.ToString(), table));
                                                break;
                                            case JsonObjectType.ChartJson:
                                                mergeMetaDatas.Add(sb.ToString());
                                                mergeDatas.Add(ChartGridJson.ToJsonObject("ChartData" + i.ToString(), table));
                                                break;
                                            case JsonObjectType.DataSetJson:
                                                mergeMetaDatas.Add(sb.ToString());
                                                mergeDatas.Add(DataTableJson.ToJsonObject("DataSetData" + i.ToString(), table));
                                                break;
                                            case JsonObjectType.AdditionJson:
                                                additionalData.Merge(table);
                                                break;
                                        }

                                        if (table.Rows.Count > 0)
                                        {
                                            dataRows[statementMap.Seq] = table.Rows[table.Rows.Count - 1];
                                        }
                                        else
                                        {
                                            dataRows[statementMap.Seq] = null;
                                        }

                                        i++;
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        string logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";

                        loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                        });

                        if (string.IsNullOrEmpty(statementMap.FallbackTransactionCommand) == false)
                        {
                            logData = $"GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, FallbackTransactionCommand: {statementMap.FallbackTransactionCommand}, dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/FallbackTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/FallbackTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/FallbackTransactionCommand", request.GlobalID);
                            }

                            var transactionCommands = statementMap.FallbackTransactionCommand.Split("|");
                            string fallbackCommandResult = businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                            if (string.IsNullOrEmpty(fallbackCommandResult) == false)
                            {
                                response.ExceptionText = response.ExceptionText + $", ExecuteDynamicSQLMap.FallbackTransactionCommand Error: {fallbackCommandResult}";

                                if (ModuleConfiguration.IsLogServer == true)
                                {
                                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"QueryDataClient/FallbackTransactionCommand", (string error) =>
                                    {
                                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "QueryDataClient/FallbackTransactionCommand");
                                    });
                                }
                                else
                                {
                                    logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "QueryDataClient/FallbackTransactionCommand", request.GlobalID);
                                }
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(response.ExceptionText) == true)
                    {
                        if (string.IsNullOrEmpty(statementMap.AfterTransactionCommand) == false)
                        {
                            var transactionCommands = statementMap.AfterTransactionCommand.Split("|");
                            string afterCommandResult = businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                            if (string.IsNullOrEmpty(afterCommandResult) == false)
                            {
                                response.ExceptionText = $"ExecuteDynamicSQLMap.AfterTransactionCommand Error: GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, CommandID={statementMap.AfterTransactionCommand}, CommandResult={afterCommandResult}";
                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }
                    else
                    {
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.CommitTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.CommitTransaction();
                    }
                }

                if (additionalData.Rows.Count > 0)
                {
                    mergeDatas.Add(GridJson.ToJsonObject("AdditionalData", additionalData));
                }

                response.ResultMeta = mergeMetaDatas;
                response.ResultJson = mergeDatas;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (request.IsTransaction == true)
                    {
                        foreach (var transactionDynamicObject in transactionDynamicObjects)
                        {
                            transactionDynamicObject.Value.PretreatmentReader?.Close();
                            transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                            transactionDynamicObject.Value.MainReader?.Close();
                            transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                        }
                    }

                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMap");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMap", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                    }
                }

                response.ExceptionText = exception.ToMessage();
                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMap");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMap", request.GlobalID);
                }
            }
            finally
            {
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    if (transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection.Close();
                    }
                    transactionDynamicObject.Value.PretreatmentConnectionFactory?.Dispose();

                    if (transactionDynamicObject.Value.ConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.ConnectionFactory.Connection.Close();
                    }
                    transactionDynamicObject.Value.ConnectionFactory?.Dispose();
                }
            }
        }

        public async Task ExecuteDynamicSQLMapToScalar(DynamicRequest request, DynamicResponse response)
        {
            bool isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            Dictionary<string, TransactionDynamicObjects> transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                List<string> logQuerys = new List<string>();
                int i = 0;
                foreach (QueryObject queryObject in request.DynamicObjects)
                {
                    var statementMap = DatabaseMapper.GetStatementMap(queryObject.QueryID);
                    if (statementMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    var connectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, statementMap.DataSourceID);

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionDynamicObjects()
                    {
                        DynamicTransaction = queryObject,
                        Statement = statementMap,
                        ConnectionString = connectionInfo == null ? "" : connectionInfo.Item1,
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });
                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        string logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", (string error) =>
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", request.GlobalID);
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", request.GlobalID);
                        }
                    }
                }

                foreach (var item in transactionDynamicObjects)
                {
                    if (string.IsNullOrEmpty(item.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"{item.Key}에 대한 DataSourceID 데이터 원본 확인 필요";
                        return;
                    }
                }

                i = 0;
                Dictionary<int, DataRow?> dataRows = new Dictionary<int, DataRow?>();
                DataTable additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                object? result = null;
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    QueryObject dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    StatementMap statementMap = transactionDynamicObject.Value.Statement;

                    if (string.IsNullOrEmpty(transactionDynamicObject.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"RequestID: {request.RequestID}에 대한 DataSourceID: {statementMap.DataSourceID} 데이터 원본 정보 필요";
                        isCommandError = true;
                        goto TransactionException;
                    }

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    transactionDynamicObject.Value.ConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                    if (request.IsTransaction == true)
                    {
                        transactionDynamicObject.Value.DatabaseTransaction = transactionDynamicObject.Value.ConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                    }

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);

                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            int baseSequence = statementMap.Seq - 1;
                            DataRow? dataRow = null;
                            if (dataRows.Count > 0 && statementMap.Seq > 0)
                            {
                                dataRow = dataRows.GetValueOrDefault(baseSequence);
                            }

                            for (int baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                BaseFieldMapping baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (string.IsNullOrEmpty(baseFieldMapping.BaseSequence) == false)
                                {
                                    int baseSequenceMapping = int.Parse(baseFieldMapping.BaseSequence);
                                    if (baseSequence != baseSequenceMapping)
                                    {
                                        baseSequence = baseSequenceMapping;
                                        dataRow = dataRows.GetValueOrDefault(baseSequence);
                                    }
                                }

                                if (dataRow == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 매핑 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    string SQLID = "";
                    string executeDataID = dynamicObject.QueryID + "_" + i.ToString();

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        string logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToScalar", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToScalar");
                        });
                    }

                    var pretreatment = DatabaseMapper.FindPretreatment(statementMap, dynamicObject);
                    if (pretreatment.SQL != null && pretreatment.ResultType != null)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                        if (request.IsTransaction == true)
                        {
                            transactionDynamicObject.Value.PretreatmentDatabaseTransaction = transactionDynamicObject.Value.PretreatmentConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                        }

                        if (pretreatment.SQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() != "")
                        {
                            SQLID = executeDataID + "_pretreatment";

                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToScalar", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToScalar");
                                });
                            }

                            ConsoleProfiler pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection, pretreatmentProfiler);

                            try
                            {
                                transactionDynamicObject.Value.PretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.PretreatmentDatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);

                                using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.PretreatmentReader))
                                {
                                    var resultTypes = pretreatment.ResultType.Split(",");
                                    if (resultTypes.Count() != (ds == null ? 0 : ds.Tables.Count))
                                    {
                                        response.ExceptionText = $"Pretreatment - 전처리 쿼리 실행 결과와 {pretreatment.ResultType} 설정 확인 필요";
                                        isCommandError = true;
                                        goto TransactionException;
                                    }

                                    if (ds != null)
                                    {
                                        for (int j = 0; j < ds.Tables.Count; j++)
                                        {
                                            string resultType = resultTypes[j].Trim();
                                            DataTable table = ds.Tables[j];
                                            if (table.Columns.Count == 0)
                                            {
                                                continue;
                                            }

                                            if (resultType == "Row")
                                            {
                                                DataRow rowItem = table.Rows[0];
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                    DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                    if (dynamicParameter == null)
                                                    {
                                                        DataProviders? dataProvider = null;
                                                        if (statementMap.NativeDataClient == true)
                                                        {
                                                            dataProvider = databaseProvider;
                                                        }

                                                        dynamicParameter = new DynamicParameter();
                                                        dynamicParameter.ParameterName = item.ColumnName;
                                                        dynamicParameter.Length = item.MaxLength;
                                                        dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                        dynamicObject.Parameters.Add(dynamicParameter);
                                                    }
                                                    else
                                                    {
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                    }
                                                }
                                            }
                                            else if (resultType == "List")
                                            {
                                                List<object> parameters = new List<object>();
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    DataView dataView = new DataView(table);
                                                    DataTable dataTable = dataView.ToTable(true, item.ColumnName);
                                                    foreach (DataRow row in dataTable.Rows)
                                                    {
                                                        parameters.Add(row[0]);
                                                    }

                                                    if (parameters.Count > 0)
                                                    {
                                                        dynamicParameters?.Add(item.ColumnName, parameters);

                                                        DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                        if (dynamicParameter == null)
                                                        {
                                                            DataProviders? dataProvider = null;
                                                            if (statementMap.NativeDataClient == true)
                                                            {
                                                                dataProvider = databaseProvider;
                                                            }

                                                            dynamicParameter = new DynamicParameter();
                                                            dynamicParameter.ParameterName = item.ColumnName;
                                                            dynamicParameter.Length = item.MaxLength;
                                                            dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                            dynamicParameter.Value = parameters;
                                                            dynamicObject.Parameters.Add(dynamicParameter);
                                                        }
                                                        else
                                                        {
                                                            dynamicParameter.Value = parameters;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                                {
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToScalar", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToScalar");
                                    });
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = $"SQLID: {SQLID}, ExceptionText: {exception.ToMessage()}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLToScalar", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLToScalar");
                                });

                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(statementMap.BeforeTransactionCommand) == false)
                    {
                        string logData = "";
                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            logData = $"GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, CommandID={statementMap.BeforeTransactionCommand}, , dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, $"ExecuteDynamicSQLMapToScalar/BeforeTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "ExecuteDynamicSQLMapToScalar/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "ExecuteDynamicSQLMapToScalar/BeforeTransactionCommand", request.GlobalID);
                            }
                        }

                        var transactionCommands = statementMap.BeforeTransactionCommand.Split("|");
                        string beforeCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                        if (string.IsNullOrEmpty(beforeCommandResult) == false)
                        {
                            response.ExceptionText = $"ExecuteDynamicSQLMapToScalar.BeforeTransactionCommand Error: {beforeCommandResult}";

                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"ExecuteDynamicSQLMapToScalar/BeforeTransactionCommand", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "ExecuteDynamicSQLMapToScalar/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "ExecuteDynamicSQLMapToScalar/BeforeTransactionCommand", request.GlobalID);
                            }

                            isCommandError = true;
                            goto TransactionException;
                        }
                    }

                    SQLID = executeDataID + "_statement";
                    ConsoleProfiler profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar");
                            });
                        }

                        string parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                        if (string.IsNullOrEmpty(parseSQL) == true || parseSQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() == "")
                        {
                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToScalar", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", empty SQL passing" + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar");
                                });
                            }

                            continue;
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar");
                            });
                        }

                        var connection = new ProfilerDbConnection(transactionDynamicObject.Value.ConnectionFactory.Connection, profiler);
                        transactionDynamicObject.Value.MainReader = await connection.ExecuteReaderAsync(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);

                        if (dynamicObject.IgnoreResult == true)
                        {
                            using (DataTable dataTable = new DataTable())
                            using (DataTable? schemaTable = transactionDynamicObject.Value.MainReader.GetSchemaTable())
                            {
                                if (schemaTable == null)
                                {
                                    continue;
                                }

                                DataRow row;

                                string columnName;
                                DataColumn column;
                                int count = schemaTable.Rows.Count;

                                for (int j = 0; j < count; j++)
                                {
                                    row = schemaTable.Rows[j];
                                    columnName = (string)row["ColumnName"];

                                    column = new DataColumn(columnName, (Type)row["DataType"]);
                                    dataTable.Columns.Add(column);
                                }

                                object[] values = new object[count];

                                try
                                {
                                    dataTable.BeginLoadData();
                                    while (transactionDynamicObject.Value.MainReader.Read())
                                    {
                                        transactionDynamicObject.Value.MainReader.GetValues(values);
                                        dataTable.LoadDataRow(values, true);
                                    }
                                }
                                finally
                                {
                                    dataTable.EndLoadData();
                                }

                                if (dataTable.Rows.Count > 0)
                                {
                                    dataRows[statementMap.Seq] = dataTable.Rows[dataTable.Rows.Count - 1];
                                }
                                else
                                {
                                    dataRows[statementMap.Seq] = null;
                                }
                            }
                        }
                        else
                        {
                            using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.MainReader))
                            {
                                if (ds != null && ds.Tables.Count > 0)
                                {
                                    for (int j = 0; j < ds.Tables.Count; j++)
                                    {
                                        i++;
                                    }

                                    DataTable table = ds.Tables[ds.Tables.Count - 1];
                                    if (table.Rows.Count > 0)
                                    {
                                        dataRows[statementMap.Seq] = table.Rows[table.Rows.Count - 1];
                                    }
                                    else
                                    {
                                        dataRows[statementMap.Seq] = null;
                                    }
                                }
                                else
                                {
                                    dataRows[statementMap.Seq] = null;
                                }
                            }
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar");
                            });
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        string logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar");
                        });

                        if (string.IsNullOrEmpty(statementMap.FallbackTransactionCommand) == false)
                        {
                            logData = $"GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, FallbackTransactionCommand: {statementMap.FallbackTransactionCommand}, dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/FallbackTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/FallbackTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/FallbackTransactionCommand", request.GlobalID);
                            }

                            var transactionCommands = statementMap.FallbackTransactionCommand.Split("|");
                            string fallbackCommandResult = businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                            if (string.IsNullOrEmpty(fallbackCommandResult) == false)
                            {
                                response.ExceptionText = response.ExceptionText + $", ExecuteDynamicSQLMapToScalar.FallbackTransactionCommand Error: {fallbackCommandResult}";

                                if (ModuleConfiguration.IsLogServer == true)
                                {
                                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"QueryDataClient/FallbackTransactionCommand", (string error) =>
                                    {
                                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "QueryDataClient/FallbackTransactionCommand");
                                    });
                                }
                                else
                                {
                                    logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "QueryDataClient/FallbackTransactionCommand", request.GlobalID);
                                }
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(response.ExceptionText) == true)
                    {
                        if (string.IsNullOrEmpty(statementMap.AfterTransactionCommand) == false)
                        {
                            var transactionCommands = statementMap.AfterTransactionCommand.Split("|");
                            string afterCommandResult = businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                            if (string.IsNullOrEmpty(afterCommandResult) == false)
                            {
                                response.ExceptionText = $"ExecuteDynamicSQLMapToScalar.AfterTransactionCommand Error: GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, CommandID={statementMap.AfterTransactionCommand}, CommandResult={afterCommandResult}";
                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }
                    else
                    {
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.CommitTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.CommitTransaction();
                    }
                }

                response.ResultObject = result;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (request.IsTransaction == true)
                    {
                        foreach (var transactionDynamicObject in transactionDynamicObjects)
                        {
                            transactionDynamicObject.Value.PretreatmentReader?.Close();
                            transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                            transactionDynamicObject.Value.MainReader?.Close();
                            transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                        }
                    }

                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapScalar", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapScalar");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapScalar", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                    }
                }

                response.ExceptionText = exception.ToMessage();

                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapScalar", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapScalar");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapScalar", request.GlobalID);
                }
            }
            finally
            {
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    if (transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection.Close();
                    }
                    transactionDynamicObject.Value.PretreatmentConnectionFactory?.Dispose();

                    if (transactionDynamicObject.Value.ConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.ConnectionFactory.Connection.Close();
                    }
                    transactionDynamicObject.Value.ConnectionFactory?.Dispose();
                }
            }
        }

        public async Task ExecuteDynamicSQLMapToNonQuery(DynamicRequest request, DynamicResponse response)
        {
            bool isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            Dictionary<string, TransactionDynamicObjects> transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                List<string> logQuerys = new List<string>();
                int i = 0;
                foreach (QueryObject queryObject in request.DynamicObjects)
                {
                    var statementMap = DatabaseMapper.GetStatementMap(queryObject.QueryID);
                    if (statementMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    var connectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, statementMap.DataSourceID);

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionDynamicObjects()
                    {
                        DynamicTransaction = queryObject,
                        Statement = statementMap,
                        ConnectionString = connectionInfo == null ? "" : connectionInfo.Item1,
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        string logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", request.GlobalID);
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", request.GlobalID);
                        }
                    }
                }

                foreach (var item in transactionDynamicObjects)
                {
                    if (string.IsNullOrEmpty(item.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"{item.Key}에 대한 DataSourceID 데이터 원본 확인 필요";
                        return;
                    }
                }

                i = 0;
                Dictionary<int, DataRow?> dataRows = new Dictionary<int, DataRow?>();
                DataTable additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                int result = 0;
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    QueryObject dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    StatementMap statementMap = transactionDynamicObject.Value.Statement;

                    if (string.IsNullOrEmpty(transactionDynamicObject.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"RequestID: {request.RequestID}에 대한 DataSourceID: {statementMap.DataSourceID} 데이터 원본 정보 필요";
                        isCommandError = true;
                        goto TransactionException;
                    }

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    transactionDynamicObject.Value.ConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                    if (request.IsTransaction == true)
                    {
                        transactionDynamicObject.Value.DatabaseTransaction = transactionDynamicObject.Value.ConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                    }

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            int baseSequence = statementMap.Seq - 1;
                            DataRow? dataRow = null;
                            if (dataRows.Count > 0 && statementMap.Seq > 0)
                            {
                                dataRow = dataRows.GetValueOrDefault(baseSequence);
                            }

                            for (int baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                BaseFieldMapping baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (string.IsNullOrEmpty(baseFieldMapping.BaseSequence) == false)
                                {
                                    int baseSequenceMapping = int.Parse(baseFieldMapping.BaseSequence);
                                    if (baseSequence != baseSequenceMapping)
                                    {
                                        baseSequence = baseSequenceMapping;
                                        dataRow = dataRows.GetValueOrDefault(baseSequence);
                                    }
                                }

                                if (dataRow == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 매핑 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    string SQLID = "";
                    string executeDataID = dynamicObject.QueryID + "_" + i.ToString();

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        string logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery");
                        });
                    }

                    var pretreatment = DatabaseMapper.FindPretreatment(statementMap, dynamicObject);
                    if (pretreatment.SQL != null && pretreatment.ResultType != null)
                    {
                        if (pretreatment.SQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() != "")
                        {
                            SQLID = executeDataID + "_pretreatment";

                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery");
                                });
                            }

                            ConsoleProfiler pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection, pretreatmentProfiler);

                            try
                            {
                                transactionDynamicObject.Value.PretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);
                                using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.PretreatmentReader))
                                {
                                    var resultTypes = pretreatment.ResultType.Split(",");
                                    if (resultTypes.Count() != (ds == null ? 0 : ds.Tables.Count))
                                    {
                                        response.ExceptionText = $"Pretreatment - 전처리 쿼리 실행 결과와 {pretreatment.ResultType} 설정 확인 필요";
                                        isCommandError = true;
                                        goto TransactionException;
                                    }

                                    if (ds != null)
                                    {
                                        for (int j = 0; j < ds.Tables.Count; j++)
                                        {
                                            string resultType = resultTypes[j].Trim();
                                            DataTable table = ds.Tables[j];
                                            if (table.Columns.Count == 0)
                                            {
                                                continue;
                                            }

                                            if (resultType == "Row")
                                            {
                                                DataRow rowItem = table.Rows[0];
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                    DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                    if (dynamicParameter == null)
                                                    {
                                                        DataProviders? dataProvider = null;
                                                        if (statementMap.NativeDataClient == true)
                                                        {
                                                            dataProvider = databaseProvider;
                                                        }

                                                        dynamicParameter = new DynamicParameter();
                                                        dynamicParameter.ParameterName = item.ColumnName;
                                                        dynamicParameter.Length = item.MaxLength;
                                                        dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                        dynamicObject.Parameters.Add(dynamicParameter);
                                                    }
                                                    else
                                                    {
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                    }
                                                }
                                            }
                                            else if (resultType == "List")
                                            {
                                                List<object> parameters = new List<object>();
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    DataView dataView = new DataView(table);
                                                    DataTable dataTable = dataView.ToTable(true, item.ColumnName);
                                                    foreach (DataRow row in dataTable.Rows)
                                                    {
                                                        parameters.Add(row[0]);
                                                    }

                                                    if (parameters.Count > 0)
                                                    {
                                                        dynamicParameters?.Add(item.ColumnName, parameters);

                                                        DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                        if (dynamicParameter == null)
                                                        {
                                                            DataProviders? dataProvider = null;
                                                            if (statementMap.NativeDataClient == true)
                                                            {
                                                                dataProvider = databaseProvider;
                                                            }

                                                            dynamicParameter = new DynamicParameter();
                                                            dynamicParameter.ParameterName = item.ColumnName;
                                                            dynamicParameter.Length = item.MaxLength;
                                                            dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                            dynamicParameter.Value = parameters;
                                                            dynamicObject.Parameters.Add(dynamicParameter);
                                                        }
                                                        else
                                                        {
                                                            dynamicParameter.Value = parameters;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                                {
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery");
                                    });
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = $"SQLID: {SQLID}, ExceptionText: {exception.ToMessage()}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLToNonQuery", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLToNonQuery");
                                });

                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(statementMap.BeforeTransactionCommand) == false)
                    {
                        string logData = "";
                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            logData = $"GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, CommandID={statementMap.BeforeTransactionCommand}, , dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, $"ExecuteDynamicSQLMapToNonQuery/BeforeTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "ExecuteDynamicSQLMapToNonQuery/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "ExecuteDynamicSQLMapToNonQuery/BeforeTransactionCommand", request.GlobalID);
                            }
                        }

                        var transactionCommands = statementMap.BeforeTransactionCommand.Split("|");
                        string beforeCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                        if (string.IsNullOrEmpty(beforeCommandResult) == false)
                        {
                            response.ExceptionText = $"ExecuteDynamicSQLMapToNonQuery.BeforeTransactionCommand Error: {beforeCommandResult}";

                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"ExecuteDynamicSQLMapToNonQuery/BeforeTransactionCommand", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "ExecuteDynamicSQLMapToNonQuery/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "ExecuteDynamicSQLMapToNonQuery/BeforeTransactionCommand", request.GlobalID);
                            }

                            isCommandError = true;
                            goto TransactionException;
                        }
                    }

                    SQLID = executeDataID + "_statement";
                    ConsoleProfiler profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                            });
                        }

                        string parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                        if (string.IsNullOrEmpty(parseSQL) == true || parseSQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() == "")
                        {
                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", empty SQL passing" + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                                });
                            }

                            continue;
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                            });
                        }

                        var connection = new ProfilerDbConnection(transactionDynamicObject.Value.ConnectionFactory.Connection, profiler);
                        transactionDynamicObject.Value.MainReader = await connection.ExecuteReaderAsync(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                            });
                        }

                        if (dynamicObject.IgnoreResult == true)
                        {
                            using (DataTable dataTable = new DataTable())
                            using (DataTable? schemaTable = transactionDynamicObject.Value.MainReader.GetSchemaTable())
                            {
                                if (schemaTable == null)
                                {
                                    continue;
                                }

                                DataRow row;

                                string columnName;
                                DataColumn column;
                                int count = schemaTable.Rows.Count;

                                for (int j = 0; j < count; j++)
                                {
                                    row = schemaTable.Rows[j];
                                    columnName = (string)row["ColumnName"];

                                    column = new DataColumn(columnName, (Type)row["DataType"]);
                                    dataTable.Columns.Add(column);
                                }

                                object[] values = new object[count];

                                try
                                {
                                    result = result + transactionDynamicObject.Value.MainReader.RecordsAffected;
                                    dataTable.BeginLoadData();
                                    while (transactionDynamicObject.Value.MainReader.Read())
                                    {
                                        transactionDynamicObject.Value.MainReader.GetValues(values);
                                        dataTable.LoadDataRow(values, true);
                                    }
                                }
                                finally
                                {
                                    dataTable.EndLoadData();
                                }

                                if (dataTable.Rows.Count > 0)
                                {
                                    dataRows[statementMap.Seq] = dataTable.Rows[dataTable.Rows.Count - 1];
                                }
                                else
                                {
                                    dataRows[statementMap.Seq] = null;
                                }
                            }
                        }
                        else
                        {
                            using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.MainReader))
                            {
                                if (ds != null && ds.Tables.Count > 0)
                                {
                                    for (int j = 0; j < ds.Tables.Count; j++)
                                    {
                                        i++;
                                    }

                                    DataTable table = ds.Tables[ds.Tables.Count - 1];
                                    if (table.Rows.Count > 0)
                                    {
                                        dataRows[statementMap.Seq] = table.Rows[table.Rows.Count - 1];
                                    }
                                    else
                                    {
                                        dataRows[statementMap.Seq] = null;
                                    }
                                }
                                else
                                {
                                    dataRows[statementMap.Seq] = null;
                                }
                            }

                            result = result + transactionDynamicObject.Value.MainReader.RecordsAffected;
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        string logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                        });

                        if (string.IsNullOrEmpty(statementMap.FallbackTransactionCommand) == false)
                        {
                            logData = $"GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, FallbackTransactionCommand: {statementMap.FallbackTransactionCommand}, dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/FallbackTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/FallbackTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/FallbackTransactionCommand", request.GlobalID);
                            }

                            var transactionCommands = statementMap.FallbackTransactionCommand.Split("|");
                            string fallbackCommandResult = businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                            if (string.IsNullOrEmpty(fallbackCommandResult) == false)
                            {
                                response.ExceptionText = response.ExceptionText + $", ExecuteDynamicSQLMapToNonQuery.FallbackTransactionCommand Error: {fallbackCommandResult}";

                                if (ModuleConfiguration.IsLogServer == true)
                                {
                                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"QueryDataClient/FallbackTransactionCommand", (string error) =>
                                    {
                                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "QueryDataClient/FallbackTransactionCommand");
                                    });
                                }
                                else
                                {
                                    logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "QueryDataClient/FallbackTransactionCommand", request.GlobalID);
                                }
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(response.ExceptionText) == true)
                    {
                        if (string.IsNullOrEmpty(statementMap.AfterTransactionCommand) == false)
                        {
                            var transactionCommands = statementMap.AfterTransactionCommand.Split("|");
                            string afterCommandResult = businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                            if (string.IsNullOrEmpty(afterCommandResult) == false)
                            {
                                response.ExceptionText = $"ExecuteDynamicSQLMapToNonQuery.AfterTransactionCommand Error: GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, CommandID={statementMap.AfterTransactionCommand}, CommandResult={afterCommandResult}";
                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }
                    else
                    {
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.CommitTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.CommitTransaction();
                    }
                }

                response.ResultInteger = result;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (request.IsTransaction == true)
                    {
                        foreach (var transactionDynamicObject in transactionDynamicObjects)
                        {
                            transactionDynamicObject.Value.PretreatmentReader?.Close();
                            transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                            transactionDynamicObject.Value.MainReader?.Close();
                            transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                        }
                    }

                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                    }
                }

                response.ExceptionText = exception.ToMessage();
                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", request.GlobalID);
                }
            }
            finally
            {
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    if (transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection.Close();
                    }
                    transactionDynamicObject.Value.PretreatmentConnectionFactory?.Dispose();

                    if (transactionDynamicObject.Value.ConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.ConnectionFactory.Connection.Close();
                    }
                    transactionDynamicObject.Value.ConnectionFactory?.Dispose();
                }
            }
        }

        public async Task ExecuteDynamicSQLMapToXml(DynamicRequest request, DynamicResponse response)
        {
            bool isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            Dictionary<string, TransactionDynamicObjects> transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                List<string> logQuerys = new List<string>();
                int i = 0;
                foreach (QueryObject queryObject in request.DynamicObjects)
                {
                    var statementMap = DatabaseMapper.GetStatementMap(queryObject.QueryID);
                    if (statementMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    var connectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, statementMap.DataSourceID);

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionDynamicObjects()
                    {
                        DynamicTransaction = queryObject,
                        Statement = statementMap,
                        ConnectionString = connectionInfo == null ? "" : connectionInfo.Item1,
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        string logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", request.GlobalID);
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", request.GlobalID);
                        }
                    }
                }

                foreach (var item in transactionDynamicObjects)
                {
                    if (string.IsNullOrEmpty(item.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"{item.Key}에 대한 DataSourceID 데이터 원본 확인 필요";
                        return;
                    }
                }

                i = 0;
                List<DataTable> results = new List<DataTable>();
                Dictionary<int, DataRow?> dataRows = new Dictionary<int, DataRow?>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    QueryObject dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    StatementMap statementMap = transactionDynamicObject.Value.Statement;

                    if (string.IsNullOrEmpty(transactionDynamicObject.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"RequestID: {request.RequestID}에 대한 DataSourceID: {statementMap.DataSourceID} 데이터 원본 정보 필요";
                        isCommandError = true;
                        goto TransactionException;
                    }

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    transactionDynamicObject.Value.ConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                    if (request.IsTransaction == true)
                    {
                        transactionDynamicObject.Value.DatabaseTransaction = transactionDynamicObject.Value.ConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                    }

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            int baseSequence = statementMap.Seq - 1;
                            DataRow? dataRow = null;
                            if (dataRows.Count > 0 && statementMap.Seq > 0)
                            {
                                dataRow = dataRows.GetValueOrDefault(baseSequence);
                            }

                            for (int baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                BaseFieldMapping baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (string.IsNullOrEmpty(baseFieldMapping.BaseSequence) == false)
                                {
                                    int baseSequenceMapping = int.Parse(baseFieldMapping.BaseSequence);
                                    if (baseSequence != baseSequenceMapping)
                                    {
                                        baseSequence = baseSequenceMapping;
                                        dataRow = dataRows.GetValueOrDefault(baseSequence);
                                    }
                                }

                                if (dataRow == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 매핑 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - QueryID: '{dynamicObject.QueryID}', Sequence: '{baseSequence}'에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    string SQLID = "";
                    string executeDataID = dynamicObject.QueryID + "_" + i.ToString();
                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        string logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToXml", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToXml");
                        });
                    }

                    var pretreatment = DatabaseMapper.FindPretreatment(statementMap, dynamicObject);
                    if (pretreatment.SQL != null && pretreatment.ResultType != null)
                    {
                        if (pretreatment.SQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() != "")
                        {
                            SQLID = executeDataID + "_pretreatment";

                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToXml", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToXml");
                                });
                            }

                            ConsoleProfiler pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection, pretreatmentProfiler);

                            try
                            {
                                transactionDynamicObject.Value.PretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);
                                using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.PretreatmentReader))
                                {
                                    var resultTypes = pretreatment.ResultType.Split(",");
                                    if (resultTypes.Count() != (ds == null ? 0 : ds.Tables.Count))
                                    {
                                        response.ExceptionText = $"Pretreatment - 전처리 쿼리 실행 결과와 {pretreatment.ResultType} 설정 확인 필요";
                                        isCommandError = true;
                                        goto TransactionException;
                                    }

                                    if (ds != null)
                                    {
                                        for (int j = 0; j < ds.Tables.Count; j++)
                                        {
                                            string resultType = resultTypes[j].Trim();
                                            DataTable table = ds.Tables[j];
                                            if (table.Columns.Count == 0)
                                            {
                                                continue;
                                            }

                                            if (resultType == "Row")
                                            {
                                                DataRow rowItem = table.Rows[0];
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                    DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                    if (dynamicParameter == null)
                                                    {
                                                        DataProviders? dataProvider = null;
                                                        if (statementMap.NativeDataClient == true)
                                                        {
                                                            dataProvider = databaseProvider;
                                                        }

                                                        dynamicParameter = new DynamicParameter();
                                                        dynamicParameter.ParameterName = item.ColumnName;
                                                        dynamicParameter.Length = item.MaxLength;
                                                        dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                        dynamicObject.Parameters.Add(dynamicParameter);
                                                    }
                                                    else
                                                    {
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                    }
                                                }
                                            }
                                            else if (resultType == "List")
                                            {
                                                List<object> parameters = new List<object>();
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    DataView dataView = new DataView(table);
                                                    DataTable dataTable = dataView.ToTable(true, item.ColumnName);
                                                    foreach (DataRow row in dataTable.Rows)
                                                    {
                                                        parameters.Add(row[0]);
                                                    }

                                                    if (parameters.Count > 0)
                                                    {
                                                        dynamicParameters?.Add(item.ColumnName, parameters);

                                                        DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                        if (dynamicParameter == null)
                                                        {
                                                            DataProviders? dataProvider = null;
                                                            if (statementMap.NativeDataClient == true)
                                                            {
                                                                dataProvider = databaseProvider;
                                                            }

                                                            dynamicParameter = new DynamicParameter();
                                                            dynamicParameter.ParameterName = item.ColumnName;
                                                            dynamicParameter.Length = item.MaxLength;
                                                            dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                            dynamicParameter.Value = parameters;
                                                            dynamicObject.Parameters.Add(dynamicParameter);
                                                        }
                                                        else
                                                        {
                                                            dynamicParameter.Value = parameters;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                                {
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToXml", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToXml");
                                    });
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = $"SQLID: {SQLID}, ExceptionText: {exception.ToMessage()}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLToXml", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLToXml");
                                });

                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(statementMap.BeforeTransactionCommand) == false)
                    {
                        string logData = "";
                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            logData = $"GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, CommandID={statementMap.BeforeTransactionCommand}, , dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, $"ExecuteDynamicSQLMapToXml/BeforeTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "ExecuteDynamicSQLMapToXml/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "ExecuteDynamicSQLMapToXml/BeforeTransactionCommand", request.GlobalID);
                            }
                        }

                        var transactionCommands = statementMap.BeforeTransactionCommand.Split("|");
                        string beforeCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                        if (string.IsNullOrEmpty(beforeCommandResult) == false)
                        {
                            response.ExceptionText = $"ExecuteDynamicSQLMapToXml.BeforeTransactionCommand Error: {beforeCommandResult}";

                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"ExecuteDynamicSQLMapToXml/BeforeTransactionCommand", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "ExecuteDynamicSQLMapToXml/BeforeTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "ExecuteDynamicSQLMapToXml/BeforeTransactionCommand", request.GlobalID);
                            }

                            isCommandError = true;
                            goto TransactionException;
                        }
                    }

                    SQLID = executeDataID + "_statement";
                    ConsoleProfiler profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                            });
                        }

                        string parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                        if (string.IsNullOrEmpty(parseSQL) == true || parseSQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() == "")
                        {
                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToXml", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", empty SQL passing" + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                                });
                            }

                            continue;
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                            });
                        }

                        var connection = new ProfilerDbConnection(transactionDynamicObject.Value.ConnectionFactory.Connection, profiler);
                        transactionDynamicObject.Value.MainReader = await connection.ExecuteReaderAsync(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);

                        if (dynamicObject.IgnoreResult == true)
                        {
                            using (DataTable dataTable = new DataTable())
                            using (DataTable? schemaTable = transactionDynamicObject.Value.MainReader.GetSchemaTable())
                            {
                                if (schemaTable == null)
                                {
                                    continue;
                                }

                                DataRow row;

                                string columnName;
                                DataColumn column;
                                int count = schemaTable.Rows.Count;

                                for (int j = 0; j < count; j++)
                                {
                                    row = schemaTable.Rows[j];
                                    columnName = (string)row["ColumnName"];

                                    column = new DataColumn(columnName, (Type)row["DataType"]);
                                    dataTable.Columns.Add(column);
                                }

                                object[] values = new object[count];

                                try
                                {
                                    dataTable.BeginLoadData();
                                    while (transactionDynamicObject.Value.MainReader.Read())
                                    {
                                        transactionDynamicObject.Value.MainReader.GetValues(values);
                                        dataTable.LoadDataRow(values, true);
                                    }
                                }
                                finally
                                {
                                    dataTable.EndLoadData();
                                }

                                if (dataTable.Rows.Count > 0)
                                {
                                    dataRows[statementMap.Seq] = dataTable.Rows[dataTable.Rows.Count - 1];
                                }
                                else
                                {
                                    dataRows[statementMap.Seq] = null;
                                }
                            }
                        }
                        else
                        {
                            using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.MainReader, "Table" + statementMap.Seq.ToString(), 1))
                            {
                                if (ds != null)
                                {
                                    for (int j = 0; j < ds.Tables.Count; j++)
                                    {
                                        DataTable table = ds.Tables[j];
                                        if (table.Columns.Count == 0)
                                        {
                                            continue;
                                        }

                                        if (dynamicObject.BaseFieldRelations != null && dynamicObject.BaseFieldRelations.Count() > 0)
                                        {
                                            var baseFieldRelation = dynamicObject.BaseFieldRelations[j];
                                            if (baseFieldRelation != null && baseFieldRelation.BaseSequence >= 0 && ((ds.Tables.Count - 1) >= baseFieldRelation.BaseSequence))
                                            {
                                                var baseTable = ds.Tables[baseFieldRelation.BaseSequence];
                                                if (baseTable != null)
                                                {
                                                    string baseColumnID = string.IsNullOrEmpty(baseFieldRelation.RelationFieldID) == true ? "_Children" : baseFieldRelation.RelationFieldID;
                                                    if (baseTable.Columns.Contains(baseColumnID) == false && baseFieldRelation.RelationMappings.Count > 0)
                                                    {
                                                        baseTable.Columns.Add(baseColumnID, typeof(object));

                                                        var dvChildren = table.AsDataView();
                                                        foreach (DataRow row in baseTable.Rows)
                                                        {
                                                            List<string> rowFilters = new List<string>() { "1<2" };
                                                            foreach (var item in baseFieldRelation.RelationMappings)
                                                            {
                                                                if (baseTable.Columns.Contains(item.BaseFieldID) == true && table.Columns.Contains(item.ChildrenFieldID) == true)
                                                                {
                                                                    rowFilters.Add($" AND {item.BaseFieldID} = '{row[item.ChildrenFieldID]}'");
                                                                }
                                                            }

                                                            if (rowFilters.Count > 1)
                                                            {
                                                                dvChildren.RowFilter = string.Join("", rowFilters);

                                                                DataTable? dtChildren = null;
                                                                if (baseFieldRelation.ColumnNames.Count > 0)
                                                                {
                                                                    dtChildren = dvChildren.ToTable(false, baseFieldRelation.ColumnNames.ToArray());
                                                                }
                                                                else
                                                                {
                                                                    dtChildren = dvChildren.ToTable();
                                                                    foreach (var item in baseFieldRelation.RelationMappings)
                                                                    {
                                                                        dtChildren.Columns.Remove(item.ChildrenFieldID);
                                                                    }
                                                                }

                                                                row[baseColumnID] = dtChildren;
                                                            }
                                                        }

                                                        if (baseFieldRelation.DisposeResult == true)
                                                        {
                                                            ds.Tables.Remove(table);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    for (int j = 0; j < ds.Tables.Count; j++)
                                    {
                                        DataTable table = ds.Tables[j];
                                        if (table.Columns.Count == 0)
                                        {
                                            continue;
                                        }

                                        if (table.Rows.Count > 0)
                                        {
                                            dataRows[statementMap.Seq] = table.Rows[table.Rows.Count - 1];
                                        }
                                        else
                                        {
                                            dataRows[statementMap.Seq] = null;
                                        }

                                        results.Add(table.Copy());

                                        i++;
                                    }
                                }
                            }
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                            });
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        string logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                        });

                        if (string.IsNullOrEmpty(statementMap.FallbackTransactionCommand) == false)
                        {
                            logData = $"GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, FallbackTransactionCommand: {statementMap.FallbackTransactionCommand}, dynamicParameters={JsonConvert.SerializeObject(dynamicParameters)}";
                            if (ModuleConfiguration.IsLogServer == true)
                            {
                                loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/FallbackTransactionCommand", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/FallbackTransactionCommand");
                                });
                            }
                            else
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/FallbackTransactionCommand", request.GlobalID);
                            }

                            var transactionCommands = statementMap.FallbackTransactionCommand.Split("|");
                            string fallbackCommandResult = businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                            if (string.IsNullOrEmpty(fallbackCommandResult) == false)
                            {
                                response.ExceptionText = response.ExceptionText + $", ExecuteDynamicSQLMapToXml.FallbackTransactionCommand Error: {fallbackCommandResult}";

                                if (ModuleConfiguration.IsLogServer == true)
                                {
                                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, $"{response.ExceptionText}, {logData}", $"QueryDataClient/FallbackTransactionCommand", (string error) =>
                                    {
                                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + $"{response.ExceptionText}, {logData}", "QueryDataClient/FallbackTransactionCommand");
                                    });
                                }
                                else
                                {
                                    logger.Error("[{LogCategory}] [{GlobalID}] " + $"{response.ExceptionText}, {logData}", "QueryDataClient/FallbackTransactionCommand", request.GlobalID);
                                }
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(response.ExceptionText) == true)
                    {
                        if (string.IsNullOrEmpty(statementMap.AfterTransactionCommand) == false)
                        {
                            var transactionCommands = statementMap.AfterTransactionCommand.Split("|");
                            string afterCommandResult = businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
                            if (string.IsNullOrEmpty(afterCommandResult) == false)
                            {
                                response.ExceptionText = $"ExecuteDynamicSQLMapToXml.AfterTransactionCommand Error: GlobalID={request.GlobalID}, QueryID={dynamicObject.QueryID}, CommandID={statementMap.AfterTransactionCommand}, CommandResult={afterCommandResult}";
                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }
                    else
                    {
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.CommitTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.CommitTransaction();
                    }
                }

                using (DataSet? ds = new DataSet())
                using (var memoryStream = new MemoryStream())
                using (TextWriter streamWriter = new StreamWriter(memoryStream))
                {
                    ds.Tables.AddRange(results.ToArray());
                    var xmlSerializer = new XmlSerializer(typeof(DataSet));
                    xmlSerializer.Serialize(streamWriter, ds);
                    response.ResultObject = Encoding.UTF8.GetString(memoryStream.ToArray());
                }

                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (request.IsTransaction == true)
                    {
                        foreach (var transactionDynamicObject in transactionDynamicObjects)
                        {
                            transactionDynamicObject.Value.PretreatmentReader?.Close();
                            transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                            transactionDynamicObject.Value.MainReader?.Close();
                            transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                        }
                    }

                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToXml", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                    }
                }

                response.ExceptionText = exception.ToMessage();

                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLMapToXml", request.GlobalID);
                }
            }
            finally
            {
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    if (transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection.Close();
                    }
                    transactionDynamicObject.Value.PretreatmentConnectionFactory?.Dispose();

                    if (transactionDynamicObject.Value.ConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.ConnectionFactory.Connection.Close();
                    }
                    transactionDynamicObject.Value.ConnectionFactory?.Dispose();
                }
            }
        }

        public async Task ExecuteCodeHelpSQLMap(DynamicRequest request, DynamicResponse response)
        {
            bool isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            Dictionary<string, TransactionDynamicObjects> transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                List<string> logQuerys = new List<string>();
                int i = 0;
                foreach (QueryObject queryObject in request.DynamicObjects)
                {
                    var statementMap = DatabaseMapper.GetStatementMap(queryObject.QueryID);
                    if (statementMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    var connectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, statementMap.DataSourceID);

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionDynamicObjects()
                    {
                        DynamicTransaction = queryObject,
                        Statement = statementMap,
                        ConnectionString = connectionInfo == null ? "" : connectionInfo.Item1,
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        string logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteCodeHelpSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteCodeHelpSQLMap", request.GlobalID);
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteCodeHelpSQLMap", request.GlobalID);
                        }
                    }
                }

                foreach (var item in transactionDynamicObjects)
                {
                    if (string.IsNullOrEmpty(item.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"{item.Key}에 대한 DataSourceID 데이터 원본 확인 필요";
                        return;
                    }
                }

                i = 0;
                ResponseCodeObject responseCodeObject = new ResponseCodeObject();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    QueryObject queryObject = transactionDynamicObject.Value.DynamicTransaction;
                    StatementMap statementMap = transactionDynamicObject.Value.Statement;

                    if (string.IsNullOrEmpty(transactionDynamicObject.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"RequestID: {request.RequestID}에 대한 DataSourceID: {statementMap.DataSourceID} 데이터 원본 정보 필요";
                        isCommandError = true;
                        goto TransactionException;
                    }

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    transactionDynamicObject.Value.ConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                    if (request.IsTransaction == true)
                    {
                        transactionDynamicObject.Value.DatabaseTransaction = transactionDynamicObject.Value.ConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                    }

                    string SQLID = queryObject.QueryID + "_" + i.ToString();
                    ConsoleProfiler profiler = new ConsoleProfiler(request.RequestID, queryObject.QueryID + "_" + i.ToString() + "_statment", ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(queryObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteCodeHelpSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteCodeHelpSQLMap");
                            });
                        }

                        string parseSQL = DatabaseMapper.Find(statementMap, queryObject);
                        dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, queryObject, statementMap, dynamicParameters);
                        var connection = new ProfilerDbConnection(transactionDynamicObject.Value.ConnectionFactory.Connection, profiler);

                        using (IDataReader dataReader = await connection.ExecuteReaderAsync(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                        {

                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteCodeHelpSQLMap", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteCodeHelpSQLMap");
                                });
                            }

                            using DataSet? ds = DataTableHelper.DataReaderToDataSet(dataReader);
                            {
                                if (ds == null || ds.Tables.Count < 2)
                                {
                                    response.ExceptionText = $"TransactionID: {statementMap.TransactionID}, StatementID: {statementMap.StatementID}에 대한 데이터 정보 확인 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                DataTable table = ds.Tables[0];
                                if (table.Rows.Count == 1)
                                {
                                    DataRow item = table.Rows[0];
                                    Tuple<string, DataProviders>? businessConnectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, item.GetStringSafe("DataSourceID"));

                                    if (businessConnectionInfo == null)
                                    {
                                        response.ExceptionText = $"DataSourceID - {statementMap.ApplicationID}_{statementMap.ProjectID}_{item.GetStringSafe("DataSourceID")}에 대한 데이터 원본 정보 필요";
                                        isCommandError = true;
                                        goto TransactionException;
                                    }

                                    string? commandText = item["CommandText"]?.ToStringSafe();
                                    string? parameters = queryObject.Parameters[2]?.Value == null ? "" : queryObject.Parameters[2]?.Value?.ToStringSafe();

                                    DynamicParameters businessParameters = new DynamicParameters();
                                    JObject adHocParameters = new JObject();

                                    if (parameters != null)
                                    {
                                        string[] codeHelpParameters = parameters.Split(';');
                                        foreach (string codeHelpParameter in codeHelpParameters)
                                        {
                                            if (codeHelpParameter.Length > 0)
                                            {
                                                string parameterName = codeHelpParameter.Split(':')[0].Trim();
                                                string parameterValue = codeHelpParameter.Split(':')[1].Trim();

                                                businessParameters.Add(
                                                    parameterName,
                                                    parameterValue,
                                                    DbType.String,
                                                    ParameterDirection.Input,
                                                    -1
                                                );

                                                adHocParameters.Add(GetParameterName(parameterName), string.IsNullOrEmpty(parameterValue) == true ? null : JToken.FromObject(parameterValue));
                                            }
                                        }
                                    }

                                    responseCodeObject.Comment = item.GetStringSafe("Comment");
                                    responseCodeObject.CodeColumnID = item.GetStringSafe("CodeColumnID");
                                    responseCodeObject.ValueColumnID = item.GetStringSafe("ValueColumnID");
                                    responseCodeObject.CreatedAt = item.GetStringSafe("CreatedAt");
                                    responseCodeObject.Scheme = new List<Scheme>();

                                    DataTable schemeDataTable = ds.Tables[1];
                                    foreach (DataRow row in schemeDataTable.Rows)
                                    {
                                        string val = row.GetStringSafe("HiddenYN");

                                        responseCodeObject.Scheme.Add(new Scheme()
                                        {
                                            ColumnID = row.GetStringSafe("ColumnID"),
                                            ColumnText = row.GetStringSafe("ColumnText"),
                                            HiddenYN = (val == "true" || val == "True" || val == "TRUE" || val == "Y" || val == "1")
                                        });
                                    }

                                    string keyString = "";
                                    commandText = DatabaseMapper.RecursiveParameters(commandText.ToStringSafe(), adHocParameters, keyString);

                                    logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request QueryID: {queryObject.QueryID}, SQL: {commandText}", "QueryDataClient/ExecuteCodeHelpSQLMap", request.GlobalID);

                                    DatabaseFactory businessDatabase = new DatabaseFactory(businessConnectionInfo.Item1, businessConnectionInfo.Item2);
                                    if (businessDatabase.Connection != null)
                                    {
                                        using (var businessReader = await businessDatabase.Connection.ExecuteReaderAsync(commandText, businessParameters))
                                        using (DataSet? dsCodes = DataTableHelper.DataReaderToDataSet(businessReader))
                                        {
                                            if (dsCodes == null || dsCodes.Tables.Count == 0)
                                            {
                                            }
                                            else
                                            {
                                                responseCodeObject.DataSource = dsCodes.Tables[0];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        string logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteCodeHelpSQLMap", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteCodeHelpSQLMap");
                        });
                    }

                    if (string.IsNullOrEmpty(response.ExceptionText) == true)
                    {
                    }
                    else
                    {
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                response.ResultJson = responseCodeObject;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteCodeHelpSQLMap", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteCodeHelpSQLMap");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteCodeHelpSQLMap", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();

                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteCodeHelpSQLMap", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteCodeHelpSQLMap");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteCodeHelpSQLMap", request.GlobalID);
                }
            }
            finally
            {
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    if (transactionDynamicObject.Value.ConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.ConnectionFactory.Connection.Close();
                    }
                    transactionDynamicObject.Value.ConnectionFactory?.Dispose();
                }
            }
        }

        public async Task ExecuteSchemeOnlySQLMap(DynamicRequest request, DynamicResponse response)
        {
            bool isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            Dictionary<string, TransactionDynamicObjects> transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                List<string> logQuerys = new List<string>();
                int i = 0;
                foreach (QueryObject queryObject in request.DynamicObjects)
                {
                    var statementMap = DatabaseMapper.GetStatementMap(queryObject.QueryID);
                    if (statementMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    var connectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, statementMap.DataSourceID);

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionDynamicObjects()
                    {
                        DynamicTransaction = queryObject,
                        Statement = statementMap,
                        ConnectionString = connectionInfo == null ? "" : connectionInfo.Item1,
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        string logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", request.GlobalID);
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", request.GlobalID);
                        }
                    }
                }

                foreach (var item in transactionDynamicObjects)
                {
                    if (string.IsNullOrEmpty(item.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"{item.Key}에 대한 DataSourceID 데이터 원본 확인 필요";
                        return;
                    }
                }

                i = 0;
                DataRow? dataRow = null;
                DataTable additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                Dictionary<string, List<DatabaseColumn>> mergeDatas = new Dictionary<string, List<DatabaseColumn>>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    QueryObject dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    StatementMap statementMap = transactionDynamicObject.Value.Statement;

                    if (string.IsNullOrEmpty(transactionDynamicObject.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"RequestID: {request.RequestID}에 대한 DataSourceID: {statementMap.DataSourceID} 데이터 원본 정보 필요";
                        isCommandError = true;
                        goto TransactionException;
                    }

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    transactionDynamicObject.Value.ConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                    if (request.IsTransaction == true)
                    {
                        transactionDynamicObject.Value.DatabaseTransaction = transactionDynamicObject.Value.ConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                    }

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        // 이전 실행 결과값으로 현재 요청 매개변수로 적용
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            if (dataRow == null)
                            {
                                response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 매핑 정보 필요";
                                isCommandError = true;
                                goto TransactionException;
                            }

                            for (int baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                BaseFieldMapping baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    string SQLID = "";
                    string executeDataID = dynamicObject.QueryID + "_" + i.ToString();
                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        string logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                        });
                    }

                    var pretreatment = DatabaseMapper.FindPretreatment(statementMap, dynamicObject);
                    if (pretreatment.SQL != null && pretreatment.ResultType != null)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                        if (request.IsTransaction == true)
                        {
                            transactionDynamicObject.Value.PretreatmentDatabaseTransaction = transactionDynamicObject.Value.PretreatmentConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                        }

                        if (pretreatment.SQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() != "")
                        {
                            SQLID = executeDataID + "_pretreatment";

                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                string logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                                });
                            }

                            ConsoleProfiler pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection, pretreatmentProfiler);

                            try
                            {
                                transactionDynamicObject.Value.PretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);

                                using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.PretreatmentReader))
                                {
                                    var resultTypes = pretreatment.ResultType.Split(",");
                                    if (resultTypes.Count() != (ds == null ? 0 : ds.Tables.Count))
                                    {
                                        response.ExceptionText = $"Pretreatment - 전처리 쿼리 실행 결과와 {pretreatment.ResultType} 설정 확인 필요";
                                        isCommandError = true;
                                        goto TransactionException;
                                    }

                                    if (ds != null)
                                    {
                                        for (int j = 0; j < ds.Tables.Count; j++)
                                        {
                                            string resultType = resultTypes[j].Trim();
                                            DataTable table = ds.Tables[j];
                                            if (table.Columns.Count == 0)
                                            {
                                                continue;
                                            }

                                            if (resultType == "Row")
                                            {
                                                DataRow rowItem = table.Rows[0];
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                    DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                    if (dynamicParameter == null)
                                                    {
                                                        DataProviders? dataProvider = null;
                                                        if (statementMap.NativeDataClient == true)
                                                        {
                                                            dataProvider = databaseProvider;
                                                        }

                                                        dynamicParameter = new DynamicParameter();
                                                        dynamicParameter.ParameterName = item.ColumnName;
                                                        dynamicParameter.Length = item.MaxLength;
                                                        dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                        dynamicObject.Parameters.Add(dynamicParameter);
                                                    }
                                                    else
                                                    {
                                                        dynamicParameter.Value = rowItem[item.ColumnName];
                                                    }
                                                }
                                            }
                                            else if (resultType == "List")
                                            {
                                                List<object> parameters = new List<object>();
                                                DataColumnCollection colItems = table.Columns;
                                                foreach (DataColumn item in colItems)
                                                {
                                                    DataView dataView = new DataView(table);
                                                    DataTable dataTable = dataView.ToTable(true, item.ColumnName);
                                                    foreach (DataRow row in dataTable.Rows)
                                                    {
                                                        parameters.Add(row[0]);
                                                    }

                                                    if (parameters.Count > 0)
                                                    {
                                                        dynamicParameters?.Add(item.ColumnName, parameters);

                                                        DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                        if (dynamicParameter == null)
                                                        {
                                                            DataProviders? dataProvider = null;
                                                            if (statementMap.NativeDataClient == true)
                                                            {
                                                                dataProvider = databaseProvider;
                                                            }

                                                            dynamicParameter = new DynamicParameter();
                                                            dynamicParameter.ParameterName = item.ColumnName;
                                                            dynamicParameter.Length = item.MaxLength;
                                                            dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                            dynamicParameter.Value = parameters;
                                                            dynamicObject.Parameters.Add(dynamicParameter);
                                                        }
                                                        else
                                                        {
                                                            dynamicParameter.Value = parameters;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                string logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                                {
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                                    });
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = $"SQLID: {SQLID}, ExceptionText: {exception.ToMessage()}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                                });

                                isCommandError = true;
                                goto TransactionException;
                            }
                        }
                    }

                    SQLID = dynamicObject.QueryID + "_" + i.ToString();
                    ConsoleProfiler profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        SQLID = dynamicObject.QueryID + "_" + i.ToString();
                        string logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                        });
                    }

                    string parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                    var connection = new ProfilerDbConnection(transactionDynamicObject.Value.ConnectionFactory.Connection, profiler);
                    transactionDynamicObject.Value.MainReader = await connection.ExecuteReaderAsync(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);

                    if (dynamicObject.IgnoreResult == true)
                    {
                        using (DataTable dataTable = new DataTable())
                        using (DataTable? schemaTable = transactionDynamicObject.Value.MainReader.GetSchemaTable())
                        {
                            if (schemaTable == null)
                            {
                                continue;
                            }

                            DataRow row;

                            string columnName;
                            DataColumn column;
                            int count = schemaTable.Rows.Count;

                            for (int j = 0; j < count; j++)
                            {
                                row = schemaTable.Rows[j];
                                columnName = (string)row["ColumnName"];

                                column = new DataColumn(columnName, (Type)row["DataType"]);
                                dataTable.Columns.Add(column);
                            }

                            object[] values = new object[count];

                            try
                            {
                                dataTable.BeginLoadData();
                                while (transactionDynamicObject.Value.MainReader.Read())
                                {
                                    transactionDynamicObject.Value.MainReader.GetValues(values);
                                    dataTable.LoadDataRow(values, true);
                                }
                            }
                            finally
                            {
                                dataTable.EndLoadData();
                            }

                            if (dataTable.Rows.Count > 0)
                            {
                                dataRow = dataTable.Rows[0];
                            }
                            else
                            {
                                dataRow = null;
                            }
                        }
                    }
                    else
                    {
                        using (DataSet? ds = DataTableHelper.DataReaderToSchemeOnly(transactionDynamicObject.Value.MainReader, "Table", 1))
                        {
                            JsonObjectType jsonObjectType = JsonObjectType.FormJson;

                            if (ds != null)
                            {
                                for (int j = 0; j < ds.Tables.Count; j++)
                                {
                                    DataTable table = ds.Tables[j];
                                    if (table.Columns.Count == 0)
                                    {
                                        continue;
                                    }

                                    if (dynamicObject.JsonObjects == null || dynamicObject.JsonObjects.Count == 0)
                                    {
                                        jsonObjectType = dynamicObject.JsonObject;
                                    }
                                    else
                                    {
                                        try
                                        {
                                            jsonObjectType = dynamicObject.JsonObjects[i];
                                        }
                                        catch
                                        {
                                            jsonObjectType = dynamicObject.JsonObject;
                                        }
                                    }

                                    switch (jsonObjectType)
                                    {
                                        case JsonObjectType.FormJson:
                                            // mergeDatas.Add("FormData" + i.ToString(), table.GetMetaColumns());
                                            mergeDatas.Add("FormData" + i.ToString(), table.GetDbColumns());
                                            break;
                                        case JsonObjectType.jqGridJson:
                                            // mergeDatas.Add("jqGridData" + i.ToString(), table.GetMetaColumns());
                                            mergeDatas.Add("jqGridData" + i.ToString(), table.GetDbColumns());
                                            break;
                                        case JsonObjectType.GridJson:
                                            // mergeDatas.Add("GridData" + i.ToString(), table.GetMetaColumns());
                                            mergeDatas.Add("GridData" + i.ToString(), table.GetDbColumns());
                                            break;
                                        case JsonObjectType.ChartJson:
                                            // mergeDatas.Add("ChartData" + i.ToString(), table.GetMetaColumns());
                                            mergeDatas.Add("ChartData" + i.ToString(), table.GetDbColumns());
                                            break;
                                        case JsonObjectType.DataSetJson:
                                            // mergeDatas.Add("DataTable" + i.ToString(), table.GetMetaColumns());
                                            mergeDatas.Add("DataTable" + i.ToString(), table.GetDbColumns());
                                            break;
                                    }

                                    if (table.Rows.Count > 0)
                                    {
                                        dataRow = table.Rows[0];
                                    }
                                    else
                                    {
                                        dataRow = null;
                                    }

                                    i++;
                                }
                            }
                        }
                    }
                }

                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.CommitTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.CommitTransaction();
                    }
                }

                response.ResultJson = mergeDatas;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (request.IsTransaction == true)
                    {
                        foreach (var transactionDynamicObject in transactionDynamicObjects)
                        {
                            transactionDynamicObject.Value.PretreatmentReader?.Close();
                            transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                            transactionDynamicObject.Value.MainReader?.Close();
                            transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                        }
                    }

                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                if (request.IsTransaction == true)
                {
                    foreach (var transactionDynamicObject in transactionDynamicObjects)
                    {
                        transactionDynamicObject.Value.PretreatmentReader?.Close();
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                        transactionDynamicObject.Value.MainReader?.Close();
                        transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();
                    }
                }

                response.ExceptionText = exception.ToMessage();

                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap", request.GlobalID);
                }
            }
            finally
            {
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    if (transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection.Close();
                    }
                    transactionDynamicObject.Value.PretreatmentConnectionFactory?.Dispose();

                    if (transactionDynamicObject.Value.ConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.ConnectionFactory.Connection.Close();
                    }
                    transactionDynamicObject.Value.ConnectionFactory?.Dispose();
                }
            }
        }

        public async Task ExecuteDynamicSQLText(DynamicRequest request, DynamicResponse response)
        {
            SQLMapMeta result = new SQLMapMeta();
            bool isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            Dictionary<string, TransactionDynamicObjects> transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                List<string> logQuerys = new List<string>();
                int i = 0;
                foreach (QueryObject queryObject in request.DynamicObjects)
                {
                    var statementMap = DatabaseMapper.GetStatementMap(queryObject.QueryID);
                    if (statementMap == null)
                    {
                        response.ExceptionText = $"QueryID - {queryObject.QueryID}에 대한 매핑 정보 필요";
                        return;
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        if (logQuerys.Contains(queryObject.QueryID) == false)
                        {
                            logQuerys.Add(queryObject.QueryID);
                        }
                    }

                    var connectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, statementMap.DataSourceID);

                    transactionDynamicObjects.Add(string.Concat(queryObject.QueryID, "_", i.ToString()), new TransactionDynamicObjects()
                    {
                        DynamicTransaction = queryObject,
                        Statement = statementMap,
                        ConnectionString = connectionInfo == null ? "" : connectionInfo.Item1,
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        string logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "Y", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteDynamicSQLText", (string error) =>
                            {
                                logger.Information("[{LogCategory}] [{GlobalID}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLText", request.GlobalID);
                            });
                        }
                        else
                        {
                            logger.Information("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteDynamicSQLText", request.GlobalID);
                        }
                    }
                }

                foreach (var item in transactionDynamicObjects)
                {
                    if (string.IsNullOrEmpty(item.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"{item.Key}에 대한 DataSourceID 데이터 원본 확인 필요";
                        return;
                    }
                }

                i = 0;
                DataRow? dataRow = null;
                DataTable additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                List<object> mergeDatas = new List<object>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    QueryObject dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    StatementMap statementMap = transactionDynamicObject.Value.Statement;

                    if (string.IsNullOrEmpty(transactionDynamicObject.Value.ConnectionString) == true)
                    {
                        response.ExceptionText = $"RequestID: {request.RequestID}에 대한 DataSourceID: {statementMap.DataSourceID} 데이터 원본 정보 필요";
                        isCommandError = true;
                        goto TransactionException;
                    }

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    transactionDynamicObject.Value.ConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                    if (request.IsTransaction == true)
                    {
                        transactionDynamicObject.Value.DatabaseTransaction = transactionDynamicObject.Value.ConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                    }

                    StatementMap? cloneStatement = statementMap.ShallowCopy();
                    if (cloneStatement != null)
                    {
                        cloneStatement.SQL = cloneStatement.SQL.EncodeBase64();
                        if (result.Statements.Contains(cloneStatement) == false)
                        {
                            result.Statements.Add(cloneStatement);
                        }
                    }

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        // 이전 실행 결과값으로 현재 요청 매개변수로 적용
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            if (dataRow == null)
                            {
                                response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 매핑 정보 필요";
                                isCommandError = true;
                                goto TransactionException;
                            }

                            for (int baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                BaseFieldMapping baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(transactionDynamicObject.Value.ConnectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    string SQLID = "";
                    string executeDataID = dynamicObject.QueryID + "_" + i.ToString();
                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        string logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLText", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLText");
                        });
                    }

                    var pretreatment = DatabaseMapper.FindPretreatment(statementMap, dynamicObject);
                    if (pretreatment.SQL != null && pretreatment.ResultType != null)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                        if (request.IsTransaction == true)
                        {
                            transactionDynamicObject.Value.PretreatmentDatabaseTransaction = transactionDynamicObject.Value.PretreatmentConnectionFactory.BeginTransaction(IsolationLevel.ReadCommitted);
                        }

                        if (pretreatment.SQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() != "")
                        {
                            string pretreatmentSQLID = executeDataID + "_pretreatment";
                            result.DefinedSQL.Add(pretreatmentSQLID, pretreatment.SQL.EncodeBase64());

                            Dictionary<string, object?>? pretreatmentParametersDictionary = null;
                            if (dynamicParameters is SqlServerDynamicParameters)
                            {
                                pretreatmentParametersDictionary = ((SqlServerDynamicParameters)dynamicParameters).ToParametersDictionary();
                            }
                            else if (dynamicParameters is OracleDynamicParameters)
                            {
                                pretreatmentParametersDictionary = ((OracleDynamicParameters)dynamicParameters).ToParametersDictionary();
                            }
                            else if (dynamicParameters is MySqlDynamicParameters)
                            {
                                pretreatmentParametersDictionary = ((MySqlDynamicParameters)dynamicParameters).ToParametersDictionary();
                            }
                            else if (dynamicParameters is NpgsqlDynamicParameters)
                            {
                                pretreatmentParametersDictionary = ((NpgsqlDynamicParameters)dynamicParameters).ToParametersDictionary();
                            }
                            else if (dynamicParameters is SQLiteDynamicParameters)
                            {
                                pretreatmentParametersDictionary = ((SQLiteDynamicParameters)dynamicParameters).ToParametersDictionary();
                            }
                            else
                            {
                                pretreatmentParametersDictionary = dynamicParameters?.ToParametersDictionary();
                            }

                            result.Parameters.Add(pretreatmentSQLID, pretreatmentParametersDictionary);

                            ConsoleProfiler pretreatmentProfiler = new ConsoleProfiler(request.RequestID, pretreatmentSQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection, pretreatmentProfiler);

                            try
                            {
                                transactionDynamicObject.Value.PretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);
                            }
                            catch (Exception exception)
                            {
                                string logData = $"ExecuteSQL: {pretreatmentProfiler.ExecuteSQL}, Exception{exception.ToMessage()}";

                                if (ModuleConfiguration.IsLogServer == true)
                                {
                                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteDynamicSQLText", (string error) =>
                                    {
                                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLText");
                                    });
                                }
                                else
                                {
                                    logger.Error("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteDynamicSQLText", request.GlobalID);
                                }

                                result.ExecuteSQL.Add(pretreatmentSQLID, pretreatmentProfiler.ExecuteSQL.ToStringSafe().EncodeBase64());
                            }

                            using (DataSet? ds = DataTableHelper.DataReaderToDataSet(transactionDynamicObject.Value.PretreatmentReader))
                            {
                                var resultTypes = pretreatment.ResultType.Split(",");
                                if (resultTypes.Count() != (ds == null ? 0 : ds.Tables.Count))
                                {
                                    response.ExceptionText = $"Pretreatment - 전처리 쿼리 실행 결과와 {pretreatment.ResultType} 설정 확인 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                if (ds != null)
                                {
                                    for (int j = 0; j < ds.Tables.Count; j++)
                                    {
                                        string resultType = resultTypes[j].Trim();
                                        DataTable table = ds.Tables[j];
                                        if (table.Columns.Count == 0)
                                        {
                                            continue;
                                        }

                                        if (resultType == "Row")
                                        {
                                            DataRow rowItem = table.Rows[0];
                                            DataColumnCollection colItems = table.Columns;
                                            foreach (DataColumn item in colItems)
                                            {
                                                PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                if (dynamicParameter == null)
                                                {
                                                    DataProviders? dataProvider = null;
                                                    if (statementMap.NativeDataClient == true)
                                                    {
                                                        dataProvider = databaseProvider;
                                                    }

                                                    dynamicParameter = new DynamicParameter();
                                                    dynamicParameter.ParameterName = item.ColumnName;
                                                    dynamicParameter.Length = item.MaxLength;
                                                    dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                    dynamicParameter.Value = rowItem[item.ColumnName];
                                                    dynamicObject.Parameters.Add(dynamicParameter);
                                                }
                                                else
                                                {
                                                    dynamicParameter.Value = rowItem[item.ColumnName];
                                                }
                                            }
                                        }
                                        else if (resultType == "List")
                                        {
                                            List<object> parameters = new List<object>();
                                            DataColumnCollection colItems = table.Columns;
                                            foreach (DataColumn item in colItems)
                                            {
                                                DataView dataView = new DataView(table);
                                                DataTable dataTable = dataView.ToTable(true, item.ColumnName);
                                                foreach (DataRow row in dataTable.Rows)
                                                {
                                                    parameters.Add(row[0]);
                                                }

                                                if (parameters.Count > 0)
                                                {
                                                    dynamicParameters?.Add(item.ColumnName, parameters);

                                                    DynamicParameter? dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

                                                    if (dynamicParameter == null)
                                                    {
                                                        DataProviders? dataProvider = null;
                                                        if (statementMap.NativeDataClient == true)
                                                        {
                                                            dataProvider = databaseProvider;
                                                        }

                                                        dynamicParameter = new DynamicParameter();
                                                        dynamicParameter.ParameterName = item.ColumnName;
                                                        dynamicParameter.Length = item.MaxLength;
                                                        dynamicParameter.DbType = GetProviderDbType(item, dataProvider);
                                                        dynamicParameter.Value = parameters;
                                                        dynamicObject.Parameters.Add(dynamicParameter);
                                                    }
                                                    else
                                                    {
                                                        dynamicParameter.Value = parameters;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    SQLID = executeDataID + "_statement";
                    ConsoleProfiler profiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            string logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLText", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLText");
                            });
                        }

                        string parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                        result.DefinedSQL.Add(SQLID, parseSQL.EncodeBase64());

                        Dictionary<string, object?>? parametersDictionary = null;
                        if (dynamicParameters is SqlServerDynamicParameters)
                        {
                            parametersDictionary = ((SqlServerDynamicParameters)dynamicParameters).ToParametersDictionary();
                        }
                        else if (dynamicParameters is OracleDynamicParameters)
                        {
                            parametersDictionary = ((OracleDynamicParameters)dynamicParameters).ToParametersDictionary();
                        }
                        else if (dynamicParameters is MySqlDynamicParameters)
                        {
                            parametersDictionary = ((MySqlDynamicParameters)dynamicParameters).ToParametersDictionary();
                        }
                        else if (dynamicParameters is NpgsqlDynamicParameters)
                        {
                            parametersDictionary = ((NpgsqlDynamicParameters)dynamicParameters).ToParametersDictionary();
                        }
                        else if (dynamicParameters is SQLiteDynamicParameters)
                        {
                            parametersDictionary = ((SQLiteDynamicParameters)dynamicParameters).ToParametersDictionary();
                        }
                        else
                        {
                            parametersDictionary = ((DynamicParameters?)dynamicParameters)?.ToParametersDictionary();
                        }

                        result.Parameters.Add(SQLID, parametersDictionary);

                        var connection = new ProfilerDbConnection(transactionDynamicObject.Value.ConnectionFactory.Connection, profiler);
                        transactionDynamicObject.Value.MainReader = await connection.ExecuteReaderAsync(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, transactionDynamicObject.Value.DatabaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout);

                        if (dynamicObject.IgnoreResult == true)
                        {
                            using (DataTable dataTable = new DataTable())
                            using (DataTable? schemaTable = transactionDynamicObject.Value.MainReader.GetSchemaTable())
                            {
                                if (schemaTable == null)
                                {
                                    continue;
                                }

                                DataRow row;

                                string columnName;
                                DataColumn column;
                                int count = schemaTable.Rows.Count;

                                for (int j = 0; j < count; j++)
                                {
                                    row = schemaTable.Rows[j];
                                    columnName = (string)row["ColumnName"];

                                    column = new DataColumn(columnName, (Type)row["DataType"]);
                                    dataTable.Columns.Add(column);
                                }

                                object[] values = new object[count];

                                try
                                {
                                    dataTable.BeginLoadData();
                                    while (transactionDynamicObject.Value.MainReader.Read())
                                    {
                                        transactionDynamicObject.Value.MainReader.GetValues(values);
                                        dataTable.LoadDataRow(values, true);
                                    }
                                }
                                finally
                                {
                                    dataTable.EndLoadData();
                                }

                                if (dataTable.Rows.Count > 0)
                                {
                                    dataRow = dataTable.Rows[0];
                                }
                                else
                                {
                                    dataRow = null;
                                }
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        string logData = $"ExecuteSQL: {profiler.ExecuteSQL}, ExceptionText: {exception.ToMessage()}";

                        if (ModuleConfiguration.IsLogServer == true)
                        {
                            loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, logData, "QueryDataClient/ExecuteDynamicSQLText", (string error) =>
                            {
                                logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLText");
                            });
                        }
                        else
                        {
                            logger.Error("[{LogCategory}] [{GlobalID}] " + logData, "QueryDataClient/ExecuteDynamicSQLText", request.GlobalID);
                        }

                        result.ExecuteSQL.Add(SQLID, profiler.ExecuteSQL.ToStringSafe().EncodeBase64());
                    }
                }

                response.ResultJson = result;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLText", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLText");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLText", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                response.ResultJson = result;
                response.ExceptionText = exception.ToMessage();

                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLText", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLText");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "QueryDataClient/ExecuteDynamicSQLText", request.GlobalID);
                }
            }
            finally
            {
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    transactionDynamicObject.Value.PretreatmentReader?.Close();
                    transactionDynamicObject.Value.PretreatmentConnectionFactory?.RollbackTransaction();
                    transactionDynamicObject.Value.MainReader?.Close();
                    transactionDynamicObject.Value.ConnectionFactory?.RollbackTransaction();

                    if (transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.PretreatmentConnectionFactory?.Connection.Close();
                    }
                    transactionDynamicObject.Value.PretreatmentConnectionFactory?.Dispose();

                    if (transactionDynamicObject.Value.ConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        transactionDynamicObject.Value.ConnectionFactory.Connection.Close();
                    }
                    transactionDynamicObject.Value.ConnectionFactory?.Dispose();
                }
            }
        }

        private string GetProviderDbType(DataColumn column, DataProviders? databaseProvider = null)
        {
            string result = "";

            if (databaseProvider == null)
            {
                result = "String";
                switch (column.DataType.Name)
                {
                    case "Int16":
                    case "Int32":
                    case "Int64":
                    case "Decimal":
                    case "Double":
                    case "Single":
                    case "Boolean":
                    case "DateTime":
                    case "DateTimeOffset":
                    case "Byte":
                        result = column.DataType.Name;
                        break;
                    case "TimeSpan":
                        result = "Time";
                        break;
                    case "Byte[]":
                        result = "Binary";
                        break;
                    case "Guid":
                        result = "Guid";
                        break;
                }
            }
            else
            {
                switch (databaseProvider)
                {
                    case DataProviders.SqlServer:
                        result = "NVarChar";
                        switch (column.DataType.Name)
                        {
                            case "Int16":
                                result = "SmallInt";
                                break;
                            case "Int32":
                                result = "Int";
                                break;
                            case "Int64":
                                result = "BigInt";
                                break;
                            case "Decimal":
                                result = "Decimal";
                                break;
                            case "Double":
                                result = "Float";
                                break;
                            case "Single":
                                result = "Real";
                                break;
                            case "Boolean":
                                result = "Bit";
                                break;
                            case "DateTime":
                                result = "DateTime";
                                break;
                            case "DateTimeOffset":
                                result = "DateTimeOffset";
                                break;
                            case "TimeSpan":
                                result = "Time";
                                break;
                            case "Byte":
                                result = "TinyInt";
                                break;
                            case "Byte[]":
                                result = "VarBinary";
                                break;
                            case "Guid":
                                result = "UniqueIdentifier";
                                break;
                        }
                        break;
                    case DataProviders.Oracle:
                        result = "NVarchar2";
                        switch (column.DataType.Name)
                        {
                            case "Int16":
                                result = "Int16";
                                break;
                            case "Int32":
                                result = "Int32";
                                break;
                            case "Int64":
                                result = "Int64";
                                break;
                            case "Decimal":
                                result = "Decimal";
                                break;
                            case "Double":
                                result = "Double";
                                break;
                            case "Single":
                                result = "Double";
                                break;
                            case "Boolean":
                                result = "Boolean";
                                break;
                            case "DateTime":
                                result = "Date";
                                break;
                            case "DateTimeOffset":
                                result = "TimeStampTZ";
                                break;
                            case "TimeSpan":
                                result = "IntervalDS";
                                break;
                            case "Byte":
                                result = "Byte";
                                break;
                            case "Byte[]":
                                result = "Raw";
                                break;
                            case "Guid":
                                result = "Varchar2";
                                break;
                        }
                        break;
                    case DataProviders.MySQL:
                        result = "Text";
                        switch (column.DataType.Name)
                        {
                            case "Int16":
                                result = "Int16";
                                break;
                            case "Int32":
                                result = "Int32";
                                break;
                            case "Int64":
                                result = "Int64";
                                break;
                            case "Decimal":
                                result = "Decimal";
                                break;
                            case "Double":
                                result = "Double";
                                break;
                            case "Single":
                                result = "Float";
                                break;
                            case "Boolean":
                                result = "Bit";
                                break;
                            case "DateTime":
                                result = "DateTime";
                                break;
                            case "DateTimeOffset":
                                result = "Timestamp";
                                break;
                            case "TimeSpan":
                                result = "Time";
                                break;
                            case "Byte":
                                result = "Byte";
                                break;
                            case "Byte[]":
                                result = "VarBinary";
                                break;
                            case "Guid":
                                result = "Guid";
                                break;
                        }
                        break;
                    case DataProviders.PostgreSQL:
                        result = "Varchar";
                        switch (column.DataType.Name)
                        {
                            case "Int16":
                                result = "Smallint";
                                break;
                            case "Int32":
                                result = "Integer";
                                break;
                            case "Int64":
                                result = "Bigint";
                                break;
                            case "Decimal":
                                result = "Numeric";
                                break;
                            case "Double":
                                result = "Double";
                                break;
                            case "Single":
                                result = "Real";
                                break;
                            case "Boolean":
                                result = "Boolean";
                                break;
                            case "DateTime":
                                result = "Timestamp";
                                break;
                            case "DateTimeOffset":
                                result = "TimestampTZ";
                                break;
                            case "TimeSpan":
                                result = "Time";
                                break;
                            case "Byte":
                                result = "Char";
                                break;
                            case "Byte[]":
                                result = "Bytea";
                                break;
                            case "Guid":
                                result = "Uuid";
                                break;
                        }
                        break;
                }
            }

            return result;
        }

        public static string ReplaceEvalString(string evalString, JObject parameters)
        {
            foreach (var parameter in parameters)
            {
                if (parameter.Value != null)
                {
                    string replacePrefix = "";
                    string replacePostfix = "";
                    Regex paramRegex;

                    if (parameter.Value.Type.ToString() == "Object")
                    {
                        replacePostfix = "";
                        paramRegex = new Regex("(^|[^a-zA-Z0-9])(" + parameter.Key + "\\.)([a-zA-Z0-9]+)");
                    }
                    else
                    {
                        replacePostfix = " ";
                        paramRegex = new Regex("(^|[^a-zA-Z0-9])(" + parameter.Key + ")($|[^a-zA-Z0-9])");
                    }

                    if (paramRegex.IsMatch(evalString) == true)
                    {
                        evalString = paramRegex.Replace(evalString, "$1" + replacePrefix + "$2" + replacePostfix + "$3");
                    }
                }
            }

            return evalString;
        }

        private DynamicParameter? GetDbParameterMap(string parameterName, List<DynamicParameter>? dynamicParameters)
        {
            DynamicParameter? result = null;

            if (dynamicParameters != null)
            {
                var maps = from p in dynamicParameters
                           where p.ParameterName == GetParameterName(parameterName)
                           select p;

                if (maps.Count() > 0)
                {
                    foreach (var item in maps)
                    {
                        result = item;
                        break;
                    }
                }
            }

            return result;
        }

        private string GetParameterName(string parameterName)
        {
            return parameterName.Replace("@", "").Replace("#", "").Replace(":", "");
        }

        private dynamic? CreateDynamicParameters(DataProviders databaseProvider, StatementMap statementMap)
        {
            dynamic? dynamicParameters = null;
            if (statementMap.NativeDataClient == true)
            {
                switch (databaseProvider)
                {
                    case DataProviders.SqlServer:
                        dynamicParameters = new SqlServerDynamicParameters();
                        break;
                    case DataProviders.Oracle:
                        dynamicParameters = new OracleDynamicParameters();
                        break;
                    case DataProviders.MySQL:
                        dynamicParameters = new MySqlDynamicParameters();
                        break;
                    case DataProviders.PostgreSQL:
                        dynamicParameters = new NpgsqlDynamicParameters();
                        break;
                    case DataProviders.SQLite:
                        dynamicParameters = new SQLiteDynamicParameters();
                        break;
                }
            }
            else
            {
                dynamicParameters = new DynamicParameters();
            }

            return dynamicParameters;
        }

        private void SetDbParameterMapping(DatabaseFactory databaseFactory, DataProviders databaseProvider, QueryObject queryObject, StatementMap statementMap, dynamic dynamicParameters)
        {
            List<DbParameterMap> dbParameterMaps = statementMap.DbParameters;
            foreach (DbParameterMap dbParameterMap in dbParameterMaps)
            {
                if (dbParameterMap.Direction.IndexOf("Input") > -1)
                {
                    DynamicParameter? dynamicParameter = GetDbParameterMap(dbParameterMap.Name, queryObject.Parameters);

                    if (dynamicParameter == null)
                    {
                        continue;
                    }

                    if (statementMap.NativeDataClient == true)
                    {
                        dynamic? dynamicValue = null;
                        dynamic? dynamicDbType = null;
                        switch (databaseProvider)
                        {
                            case DataProviders.SqlServer:
                                dynamicDbType = (SqlDbType)Enum.Parse(typeof(SqlDbType), string.IsNullOrEmpty(dbParameterMap.DbType) == true ? dynamicParameter.DbType : dbParameterMap.DbType);
                                dynamicValue = dynamicParameter.Value;
                                break;
                            case DataProviders.Oracle:
                                dynamicDbType = (OracleDbType)Enum.Parse(typeof(OracleDbType), string.IsNullOrEmpty(dbParameterMap.DbType) == true ? dynamicParameter.DbType : dbParameterMap.DbType);
                                if (dynamicDbType == OracleDbType.Clob)
                                {
                                    OracleClobParameter oracleClobParameter = new OracleClobParameter(dynamicParameter.Value);
                                    if (databaseFactory.Connection != null && databaseFactory.Connection.IsConnectionOpen() == false)
                                    {
                                        databaseFactory.Connection.EnsureOpen();
                                    }
                                    dynamicValue = oracleClobParameter.GetClobValue(databaseFactory.Connection);
                                }
                                else
                                {
                                    dynamicValue = dynamicParameter.Value;
                                }
                                break;
                            case DataProviders.MySQL:
                                dynamicDbType = (MySqlDbType)Enum.Parse(typeof(MySqlDbType), string.IsNullOrEmpty(dbParameterMap.DbType) == true ? dynamicParameter.DbType : dbParameterMap.DbType);
                                dynamicValue = dynamicParameter.Value;
                                break;
                            case DataProviders.PostgreSQL:
                                dynamicDbType = (NpgsqlDbType)Enum.Parse(typeof(NpgsqlDbType), string.IsNullOrEmpty(dbParameterMap.DbType) == true ? dynamicParameter.DbType : dbParameterMap.DbType);
                                dynamicValue = dynamicParameter.Value;
                                break;
                            case DataProviders.SQLite:
                                dynamicDbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(dbParameterMap.DbType) == true ? dynamicParameter.DbType : dbParameterMap.DbType);
                                dynamicValue = dynamicParameter.Value;
                                break;
                        }

                        dynamicParameters.Add(
                            dynamicParameter.ParameterName,
                            dynamicValue == null ? DBNull.Value : dynamicValue,
                            dynamicDbType,
                            (ParameterDirection)Enum.Parse(typeof(ParameterDirection), dbParameterMap.Direction),
                            dbParameterMap.Length <= 0 ? -1 : dbParameterMap.Length
                        );
                    }
                    else
                    {
                        DbType dynamicDbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(dbParameterMap.DbType) == true ? dynamicParameter.DbType : dbParameterMap.DbType);

                        if (dynamicDbType == DbType.String)
                        {
                            if (dynamicParameter.Value == null)
                            {
                                if (dbParameterMap.DefaultValue == "NULL")
                                {
                                    dynamicParameter.Value = DBNull.Value;
                                }
                                else if (string.IsNullOrEmpty(dbParameterMap.DefaultValue) == false)
                                {
                                    dynamicParameter.Value = dbParameterMap.DefaultValue;
                                }
                                else
                                {
                                    dynamicParameter.Value = "";
                                }
                            }
                        }
                        else
                        {
                            if (dynamicParameter.Value == null || dynamicParameter.Value.ToStringSafe() == "")
                            {
                                if (dbParameterMap.DefaultValue == "NULL")
                                {
                                    dynamicParameter.Value = DBNull.Value;
                                }
                                else if (string.IsNullOrEmpty(dbParameterMap.DefaultValue) == false)
                                {
                                    dynamicParameter.Value = dbParameterMap.DefaultValue;
                                }
                            }
                        }

                        dynamicParameters.Add(
                            dynamicParameter.ParameterName,
                            dynamicParameter.Value,
                            dynamicDbType,
                            (ParameterDirection)Enum.Parse(typeof(ParameterDirection), dbParameterMap.Direction),
                            dbParameterMap.Length <= 0 ? -1 : dbParameterMap.Length
                        );
                    }
                }
                else
                {
                    if (statementMap.NativeDataClient == true)
                    {
                        dynamic? dynamicDbType = null;
                        switch (databaseProvider)
                        {
                            case DataProviders.SqlServer:
                                dynamicDbType = (SqlDbType)Enum.Parse(typeof(SqlDbType), dbParameterMap.DbType);
                                break;
                            case DataProviders.Oracle:
                                dynamicDbType = (OracleDbType)Enum.Parse(typeof(OracleDbType), dbParameterMap.DbType);
                                break;
                            case DataProviders.MySQL:
                                dynamicDbType = (MySqlDbType)Enum.Parse(typeof(MySqlDbType), dbParameterMap.DbType);
                                break;
                            case DataProviders.PostgreSQL:
                                dynamicDbType = (NpgsqlDbType)Enum.Parse(typeof(NpgsqlDbType), dbParameterMap.DbType);
                                break;
                            case DataProviders.SQLite:
                                dynamicDbType = (DbType)Enum.Parse(typeof(DbType), dbParameterMap.DbType);
                                break;
                        }

                        dynamicParameters.Add(
                            GetParameterName(dbParameterMap.Name),
                            null,
                            dynamicDbType,
                            (ParameterDirection)Enum.Parse(typeof(ParameterDirection), dbParameterMap.Direction),
                            dbParameterMap.Length <= 0 ? -1 : dbParameterMap.Length
                        );
                    }
                    else
                    {
                        DbType dynamicDbType = (DbType)Enum.Parse(typeof(DbType), dbParameterMap.DbType);

                        dynamicParameters.Add(
                            GetParameterName(dbParameterMap.Name),
                            null,
                            dynamicDbType,
                            (ParameterDirection)Enum.Parse(typeof(ParameterDirection), dbParameterMap.Direction),
                            dbParameterMap.Length <= 0 ? -1 : dbParameterMap.Length
                        );
                    }
                }
            }
        }

        private void PretreatmentAddParameter(DataProviders databaseProvider, StatementMap statementMap, dynamic dynamicParameters, DataRow rowItem, DataColumn item)
        {
            if (statementMap.NativeDataClient == true)
            {
                dynamic? dynamicDbType = null;
                switch (databaseProvider)
                {
                    case DataProviders.SqlServer:
                        dynamicDbType = (SqlDbType)Enum.Parse(typeof(SqlDbType), GetProviderDbType(item, databaseProvider));
                        break;
                    case DataProviders.Oracle:
                        dynamicDbType = (OracleDbType)Enum.Parse(typeof(OracleDbType), GetProviderDbType(item, databaseProvider));
                        break;
                    case DataProviders.MySQL:
                        dynamicDbType = (MySqlDbType)Enum.Parse(typeof(MySqlDbType), GetProviderDbType(item, databaseProvider));
                        break;
                    case DataProviders.PostgreSQL:
                        dynamicDbType = (NpgsqlDbType)Enum.Parse(typeof(NpgsqlDbType), GetProviderDbType(item, databaseProvider));
                        break;
                    case DataProviders.SQLite:
                        dynamicDbType = (DbType)Enum.Parse(typeof(DbType), GetProviderDbType(item, databaseProvider));
                        break;
                }

                dynamicParameters.Add(
                    item.ColumnName,
                    rowItem[item.ColumnName],
                    dynamicDbType,
                    ParameterDirection.Input,
                    item.MaxLength
                );
            }
            else
            {
                DbType dynamicDbType = (DbType)Enum.Parse(typeof(DbType), GetProviderDbType(item));

                dynamicParameters.Add(
                    item.ColumnName,
                    rowItem[item.ColumnName],
                    dynamicDbType,
                    ParameterDirection.Input,
                    item.MaxLength
                );
            }
        }

        private static Tuple<string, DataProviders>? GetConnectionInfomation(QueryObject queryObject, string applicationID, string projectID, string dataSourceID)
        {
            Tuple<string, DataProviders>? result = null;
            if (string.IsNullOrEmpty(dataSourceID) == false)
            {
                DataSourceMap? dataSourceMap = DatabaseMapper.GetDataSourceMap(queryObject, applicationID, projectID, dataSourceID);
                if (dataSourceMap != null)
                {
                    result = new Tuple<string, DataProviders>(dataSourceMap.ConnectionString, dataSourceMap.DataProvider);
                }
            }

            return result;
        }

        private void CloseDatabaseFactory(DatabaseFactory? databaseFactory, bool isTransaction)
        {
            if (databaseFactory != null)
            {
                if (isTransaction == true)
                {
                    databaseFactory.RollbackTransaction();
                }

                if (databaseFactory.Connection != null && databaseFactory.Connection.IsConnectionOpen() == true)
                {
                    databaseFactory.Connection.Close();
                }

                databaseFactory.Dispose();
            }
        }

        public void Dispose()
        {
            if (this.DbConnection != null)
            {
                if (this.DbConnection.State != ConnectionState.Closed)
                {
                    this.DbConnection.Close();
                    this.DbConnection.Dispose();
                    this.DbConnection = null;
                }
            }
        }
    }
}
