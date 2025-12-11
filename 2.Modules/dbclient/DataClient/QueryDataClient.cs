using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Globalization;
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
using HandStack.Core.Helpers;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MySql.Data.MySqlClient;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using NpgsqlTypes;

using Oracle.ManagedDataAccess.Client;

using Serilog;

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
            var request = new DynamicRequest();
            var response = new DynamicResponse();
            var dynamicObjects = new List<QueryObject>();

            dynamicObjects.Add(new QueryObject() { QueryID = queryID, Parameters = parameters });

            request.DynamicObjects = dynamicObjects;

            var result = new DynamicResult();
            var transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();
            Tuple<string, DataProviders, string>? connectionInfo = null;

            try
            {
                var logQuerys = new List<string>();
                var i = 0;
                foreach (var queryObject in request.DynamicObjects)
                {
                    if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                    {
                        queryObject.TenantID = tenantID;
                    }

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
                        var logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
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
                var mergeDatas = new List<object>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    var queryObject = transactionDynamicObject.Value.DynamicTransaction;
                    var statementMap = transactionDynamicObject.Value.Statement;

                    if (queryObject == null || statementMap == null)
                    {
                        result.ExceptionText = $"QueryObject 또는 StatementMap 정보 필요";
                        return result;
                    }

                    var parseSQL = DatabaseMapper.Find(statementMap, queryObject);

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                    if (dynamicParameters != null && queryObject.Parameters != null)
                    {
                        var dbParameterMaps = statementMap.DbParameters;
                        foreach (var dbParameterMap in dbParameterMaps)
                        {
                            var dynamicParameter = GetDbParameterMap(dbParameterMap.Name, queryObject.Parameters);

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
            var isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            var transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();
            var databaseTransactionObjects = new List<DatabaseTransactionObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                var logQuerys = new List<string>();
                var i = 0;
                foreach (var queryObject in request.DynamicObjects)
                {
                    if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                    {
                        queryObject.TenantID = tenantID;
                    }

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
                        ConnectionString = connectionInfo == null ? "" : (connectionInfo.Item2 == DataProviders.SQLite ? connectionInfo.Item1.Replace("\\", "/") : connectionInfo.Item1),
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2,
                        TransactionIsolationLevel = connectionInfo == null ? "ReadCommitted" : connectionInfo.Item3
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        var logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
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
                var dataRows = new Dictionary<int, DataRow?>();
                var additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                var mergeMetaDatas = new List<string>();
                var mergeDatas = new List<object>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    var dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    var statementMap = transactionDynamicObject.Value.Statement;

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    var databaseTransactionObject = CreateDatabaseTransactionFactory(request, databaseTransactionObjects, transactionDynamicObject, statementMap, databaseProvider);
                    var connectionFactory = databaseTransactionObject.ConnectionFactory!;
                    var databaseTransaction = databaseTransactionObject.DatabaseTransaction;

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);

                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            var baseSequence = statementMap.Seq - 1;
                            DataRow? dataRow = null;
                            if (dataRows.Count > 0 && statementMap.Seq > 0)
                            {
                                dataRow = dataRows.GetValueOrDefault(baseSequence);
                            }

                            for (var baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                var baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (string.IsNullOrEmpty(baseFieldMapping.BaseSequence) == false)
                                {
                                    var baseSequenceMapping = int.Parse(baseFieldMapping.BaseSequence);
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

                                var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    var SQLID = "";
                    var executeDataID = dynamicObject.QueryID + "_" + i.ToString();

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        var logData = $"Pretreatment: {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
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
                                var sqlLogData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, sqlLogData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + sqlLogData, "QueryDataClient/ExecuteDynamicSQLMap");
                                });
                            }

                            var pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(connectionFactory.Connection, pretreatmentProfiler);
                            using (var pretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                            {
                                try
                                {
                                    using (var ds = DataTableHelper.DataReaderToDataSet(pretreatmentReader))
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
                                            for (var j = 0; j < ds.Tables.Count; j++)
                                            {
                                                var resultType = resultTypes[j].Trim();
                                                var table = ds.Tables[j];
                                                if (table.Columns.Count == 0)
                                                {
                                                    continue;
                                                }

                                                if (resultType == "Row")
                                                {
                                                    var rowItem = table.Rows[0];
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                        var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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
                                                    var parameters = new List<object>();
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        var dataView = new DataView(table);
                                                        var dataTable = dataView.ToTable(true, item.ColumnName);
                                                        foreach (DataRow row in dataTable.Rows)
                                                        {
                                                            parameters.Add(row[0]);
                                                        }

                                                        if (parameters.Count > 0)
                                                        {
                                                            dynamicParameters?.Add(item.ColumnName, parameters);

                                                            var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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
                                    pretreatmentReader?.Close();
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
                                finally
                                {
                                    pretreatmentReader?.Close();
                                }
                            }

                            var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                                });
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(statementMap.BeforeTransactionCommand) == false)
                    {
                        var logData = "";
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
                        var beforeCommandResult = await businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                    var profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                            });
                        }

                        var parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                        if (string.IsNullOrEmpty(parseSQL) == true || parseSQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() == "")
                        {
                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", empty SQL passing" + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                                });
                            }

                            continue;
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                            });
                        }

                        var connection = new ProfilerDbConnection(connectionFactory.Connection, profiler);
                        using (var mainReader = connection.ExecuteReader(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                        {
                            try
                            {
                                if (dynamicObject.IgnoreResult == true)
                                {
                                    using var dataTable = new DataTable();
                                    using var schemaTable = mainReader.GetSchemaTable();
                                    if (schemaTable == null)
                                    {
                                        continue;
                                    }

                                    DataRow row;

                                    string columnName;
                                    DataColumn column;
                                    var count = schemaTable.Rows.Count;

                                    for (var j = 0; j < count; j++)
                                    {
                                        row = schemaTable.Rows[j];
                                        columnName = (string)row["ColumnName"];

                                        column = new DataColumn(columnName, (Type)row["DataType"]);
                                        dataTable.Columns.Add(column);
                                    }

                                    var values = new object[count];

                                    try
                                    {
                                        dataTable.BeginLoadData();
                                        while (mainReader.Read())
                                        {
                                            mainReader.GetValues(values);
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
                                else
                                {
                                    using var ds = DataTableHelper.DataReaderToDataSet(mainReader);
                                    var jsonObjectType = JsonObjectType.FormJson;

                                    if (ds != null)
                                    {
                                        for (var j = 0; j < ds.Tables.Count; j++)
                                        {
                                            var table = ds.Tables[j];
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
                                                        var baseColumnID = string.IsNullOrEmpty(baseFieldRelation.RelationFieldID) == true ? "_Children" : baseFieldRelation.RelationFieldID;
                                                        if (baseTable.Columns.Contains(baseColumnID) == false && baseFieldRelation.RelationMappings.Count > 0)
                                                        {
                                                            baseTable.Columns.Add(baseColumnID, typeof(object));

                                                            var dvChildren = table.AsDataView();
                                                            foreach (DataRow row in baseTable.Rows)
                                                            {
                                                                var rowFilters = new List<string>() { "1<2" };
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
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        for (var j = 0; j < ds.Tables.Count; j++)
                                        {
                                            var table = ds.Tables[j];
                                            if (table.Columns.Count == 0)
                                            {
                                                continue;
                                            }

                                            if (dynamicObject.BaseFieldRelations != null && dynamicObject.BaseFieldRelations.Count() > 0)
                                            {
                                                var baseFieldRelation = dynamicObject.BaseFieldRelations[j];
                                                if (baseFieldRelation != null)
                                                {
                                                    if (baseFieldRelation.DisposeResult == true)
                                                    {
                                                        ds.Tables.Remove(table);
                                                    }
                                                }
                                            }
                                        }

                                        for (var j = 0; j < ds.Tables.Count; j++)
                                        {
                                            var table = ds.Tables[j];
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

                                            var sb = new StringBuilder(256);
                                            for (var k = 0; k < table.Columns.Count; k++)
                                            {
                                                var column = table.Columns[k];
                                                string metaDataType = JsonExtensions.toMetaDataType(column.DataType.Name);
                                                if (metaDataType == "string")
                                                {
                                                    sb.Append($"{column.ColumnName}:{metaDataType}|{column.MaxLength};");
                                                }
                                                else
                                                {
                                                    sb.Append($"{column.ColumnName}:{metaDataType};");
                                                }
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
                            catch (Exception exception)
                            {
                                response.ExceptionText = exception.ToMessage();
                                var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";

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
                                    var fallbackCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                            finally
                            {
                                mainReader?.Close();
                            }
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMap");
                            });
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";

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
                            var fallbackCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                            var afterCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                        if (response.ExceptionText.Length > 600)
                        {
                            response.ExceptionText = response.ExceptionText.Substring(0, 600) + "...";
                        }
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                if (request.IsTransaction == true)
                {
                    CommitTransactions(databaseTransactionObjects);
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
                        RollbackTransactions(databaseTransactionObjects);
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
                    RollbackTransactions(databaseTransactionObjects);
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
                CloseDatabaseConnections(databaseTransactionObjects);
            }
        }

        public async Task ExecuteDynamicSQLMapToScalar(DynamicRequest request, DynamicResponse response)
        {
            var isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            var transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();
            var databaseTransactionObjects = new List<DatabaseTransactionObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                var logQuerys = new List<string>();
                var i = 0;
                foreach (var queryObject in request.DynamicObjects)
                {
                    if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                    {
                        queryObject.TenantID = tenantID;
                    }

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
                        ConnectionString = connectionInfo == null ? "" : (connectionInfo.Item2 == DataProviders.SQLite ? connectionInfo.Item1.Replace("\\", "/") : connectionInfo.Item1),
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });
                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        var logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
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
                var dataRows = new Dictionary<int, DataRow?>();
                var additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                object? result = null;
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    var dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    var statementMap = transactionDynamicObject.Value.Statement;

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    var databaseTransactionObject = CreateDatabaseTransactionFactory(request, databaseTransactionObjects, transactionDynamicObject, statementMap, databaseProvider);
                    var connectionFactory = databaseTransactionObject.ConnectionFactory!;
                    var databaseTransaction = databaseTransactionObject.DatabaseTransaction;

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);

                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            var baseSequence = statementMap.Seq - 1;
                            DataRow? dataRow = null;
                            if (dataRows.Count > 0 && statementMap.Seq > 0)
                            {
                                dataRow = dataRows.GetValueOrDefault(baseSequence);
                            }

                            for (var baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                var baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (string.IsNullOrEmpty(baseFieldMapping.BaseSequence) == false)
                                {
                                    var baseSequenceMapping = int.Parse(baseFieldMapping.BaseSequence);
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

                                var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    var SQLID = "";
                    var executeDataID = dynamicObject.QueryID + "_" + i.ToString();

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        var logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToScalar", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToScalar");
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
                                var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToScalar", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToScalar");
                                });
                            }

                            var pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(connectionFactory.Connection, pretreatmentProfiler);
                            using (var pretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                            {
                                try
                                {
                                    using (var ds = DataTableHelper.DataReaderToDataSet(pretreatmentReader))
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
                                            for (var j = 0; j < ds.Tables.Count; j++)
                                            {
                                                var resultType = resultTypes[j].Trim();
                                                var table = ds.Tables[j];
                                                if (table.Columns.Count == 0)
                                                {
                                                    continue;
                                                }

                                                if (resultType == "Row")
                                                {
                                                    var rowItem = table.Rows[0];
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                        var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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
                                                    var parameters = new List<object>();
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        var dataView = new DataView(table);
                                                        var dataTable = dataView.ToTable(true, item.ColumnName);
                                                        foreach (DataRow row in dataTable.Rows)
                                                        {
                                                            parameters.Add(row[0]);
                                                        }

                                                        if (parameters.Count > 0)
                                                        {
                                                            dynamicParameters?.Add(item.ColumnName, parameters);

                                                            var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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

                                    var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
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
                                finally
                                {
                                    pretreatmentReader?.Close();
                                }
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(statementMap.BeforeTransactionCommand) == false)
                    {
                        var logData = "";
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
                        var beforeCommandResult = await businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                    var profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar");
                            });
                        }

                        var parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                        if (string.IsNullOrEmpty(parseSQL) == true || parseSQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() == "")
                        {
                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToScalar", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", empty SQL passing" + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar");
                                });
                            }

                            continue;
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar");
                            });
                        }

                        var connection = new ProfilerDbConnection(connectionFactory.Connection, profiler);
                        using (var mainReader = connection.ExecuteReader(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                        {
                            try
                            {
                                if (dynamicObject.IgnoreResult == true)
                                {
                                    using var dataTable = new DataTable();
                                    using var schemaTable = mainReader.GetSchemaTable();
                                    if (schemaTable == null)
                                    {
                                        continue;
                                    }

                                    DataRow row;

                                    string columnName;
                                    DataColumn column;
                                    var count = schemaTable.Rows.Count;

                                    for (var j = 0; j < count; j++)
                                    {
                                        row = schemaTable.Rows[j];
                                        columnName = (string)row["ColumnName"];

                                        column = new DataColumn(columnName, (Type)row["DataType"]);
                                        dataTable.Columns.Add(column);
                                    }

                                    var values = new object[count];

                                    try
                                    {
                                        dataTable.BeginLoadData();
                                        while (mainReader.Read())
                                        {
                                            mainReader.GetValues(values);
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
                                else
                                {
                                    using var ds = DataTableHelper.DataReaderToDataSet(mainReader);
                                    if (ds != null && ds.Tables.Count > 0)
                                    {
                                        for (var j = 0; j < ds.Tables.Count; j++)
                                        {
                                            i++;
                                        }

                                        var table = ds.Tables[ds.Tables.Count - 1];
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

                                if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                                {
                                    var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToScalar");
                                    });
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = exception.ToMessage();
                                var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
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
                                    var fallbackCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                            finally
                            {
                                mainReader?.Close();
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
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
                            var fallbackCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                            var afterCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                        if (response.ExceptionText.Length > 600)
                        {
                            response.ExceptionText = response.ExceptionText.Substring(0, 600) + "...";
                        }
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                if (request.IsTransaction == true)
                {
                    CommitTransactions(databaseTransactionObjects);
                }

                response.ResultObject = result;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (request.IsTransaction == true)
                    {
                        RollbackTransactions(databaseTransactionObjects);
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
                    RollbackTransactions(databaseTransactionObjects);
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
                CloseDatabaseConnections(databaseTransactionObjects);
            }
        }

        public async Task ExecuteDynamicSQLMapToNonQuery(DynamicRequest request, DynamicResponse response)
        {
            var isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            var transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();
            var databaseTransactionObjects = new List<DatabaseTransactionObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                var logQuerys = new List<string>();
                var i = 0;
                foreach (var queryObject in request.DynamicObjects)
                {
                    if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                    {
                        queryObject.TenantID = tenantID;
                    }

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
                        ConnectionString = connectionInfo == null ? "" : (connectionInfo.Item2 == DataProviders.SQLite ? connectionInfo.Item1.Replace("\\", "/") : connectionInfo.Item1),
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        var logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
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
                var dataRows = new Dictionary<int, DataRow?>();
                var additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                var result = 0;
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    var dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    var statementMap = transactionDynamicObject.Value.Statement;

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    var databaseTransactionObject = CreateDatabaseTransactionFactory(request, databaseTransactionObjects, transactionDynamicObject, statementMap, databaseProvider);
                    var connectionFactory = databaseTransactionObject.ConnectionFactory!;
                    var databaseTransaction = databaseTransactionObject.DatabaseTransaction;

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            var baseSequence = statementMap.Seq - 1;
                            DataRow? dataRow = null;
                            if (dataRows.Count > 0 && statementMap.Seq > 0)
                            {
                                dataRow = dataRows.GetValueOrDefault(baseSequence);
                            }

                            for (var baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                var baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (string.IsNullOrEmpty(baseFieldMapping.BaseSequence) == false)
                                {
                                    var baseSequenceMapping = int.Parse(baseFieldMapping.BaseSequence);
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

                                var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    var SQLID = "";
                    var executeDataID = dynamicObject.QueryID + "_" + i.ToString();

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        var logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
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
                                var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery");
                                });
                            }

                            var pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(connectionFactory.Connection, pretreatmentProfiler);
                            using (var pretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                            {
                                try
                                {
                                    using (var ds = DataTableHelper.DataReaderToDataSet(pretreatmentReader))
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
                                            for (var j = 0; j < ds.Tables.Count; j++)
                                            {
                                                var resultType = resultTypes[j].Trim();
                                                var table = ds.Tables[j];
                                                if (table.Columns.Count == 0)
                                                {
                                                    continue;
                                                }

                                                if (resultType == "Row")
                                                {
                                                    var rowItem = table.Rows[0];
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                        var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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
                                                    var parameters = new List<object>();
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        var dataView = new DataView(table);
                                                        var dataTable = dataView.ToTable(true, item.ColumnName);
                                                        foreach (DataRow row in dataTable.Rows)
                                                        {
                                                            parameters.Add(row[0]);
                                                        }

                                                        if (parameters.Count > 0)
                                                        {
                                                            dynamicParameters?.Add(item.ColumnName, parameters);

                                                            var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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

                                    var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
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
                                finally
                                {
                                    pretreatmentReader?.Close();
                                }
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(statementMap.BeforeTransactionCommand) == false)
                    {
                        var logData = "";
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
                        var beforeCommandResult = await businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                    var profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                            });
                        }

                        var parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                        if (string.IsNullOrEmpty(parseSQL) == true || parseSQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() == "")
                        {
                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToNonQuery", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", empty SQL passing" + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                                });
                            }

                            continue;
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                            });
                        }

                        var connection = new ProfilerDbConnection(connectionFactory.Connection, profiler);
                        using (var mainReader = connection.ExecuteReader(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                        {
                            try
                            {
                                if (dynamicObject.IgnoreResult == true)
                                {
                                    using var dataTable = new DataTable();
                                    using var schemaTable = mainReader.GetSchemaTable();
                                    if (schemaTable == null)
                                    {
                                        continue;
                                    }

                                    DataRow row;

                                    string columnName;
                                    DataColumn column;
                                    var count = schemaTable.Rows.Count;

                                    for (var j = 0; j < count; j++)
                                    {
                                        row = schemaTable.Rows[j];
                                        columnName = (string)row["ColumnName"];

                                        column = new DataColumn(columnName, (Type)row["DataType"]);
                                        dataTable.Columns.Add(column);
                                    }

                                    var values = new object[count];

                                    try
                                    {
                                        result = result + mainReader.RecordsAffected;
                                        dataTable.BeginLoadData();
                                        while (mainReader.Read())
                                        {
                                            mainReader.GetValues(values);
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
                                else
                                {
                                    using (var ds = DataTableHelper.DataReaderToDataSet(mainReader))
                                    {
                                        if (ds != null && ds.Tables.Count > 0)
                                        {
                                            for (var j = 0; j < ds.Tables.Count; j++)
                                            {
                                                i++;
                                            }

                                            var table = ds.Tables[ds.Tables.Count - 1];
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

                                    result = result + mainReader.RecordsAffected;
                                }

                                if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                                {
                                    var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToNonQuery");
                                    });
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = exception.ToMessage();
                                var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
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
                                    var fallbackCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                            finally
                            {
                                mainReader?.Close();
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
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
                            var fallbackCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                            var afterCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                        if (response.ExceptionText.Length > 600)
                        {
                            response.ExceptionText = response.ExceptionText.Substring(0, 600) + "...";
                        }
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                if (request.IsTransaction == true)
                {
                    CommitTransactions(databaseTransactionObjects);
                }

                response.ResultInteger = result;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (request.IsTransaction == true)
                    {
                        RollbackTransactions(databaseTransactionObjects);
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
                    RollbackTransactions(databaseTransactionObjects);
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
                CloseDatabaseConnections(databaseTransactionObjects);
            }
        }

        public async Task ExecuteDynamicSQLMapToXml(DynamicRequest request, DynamicResponse response)
        {
            var isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            var transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();
            var databaseTransactionObjects = new List<DatabaseTransactionObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                var logQuerys = new List<string>();
                var i = 0;
                foreach (var queryObject in request.DynamicObjects)
                {
                    if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                    {
                        queryObject.TenantID = tenantID;
                    }

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
                        ConnectionString = connectionInfo == null ? "" : (connectionInfo.Item2 == DataProviders.SQLite ? connectionInfo.Item1.Replace("\\", "/") : connectionInfo.Item1),
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        var logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
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
                var results = new List<DataTable>();
                var dataRows = new Dictionary<int, DataRow?>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    var dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    var statementMap = transactionDynamicObject.Value.Statement;

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    var databaseTransactionObject = CreateDatabaseTransactionFactory(request, databaseTransactionObjects, transactionDynamicObject, statementMap, databaseProvider);
                    var connectionFactory = databaseTransactionObject.ConnectionFactory!;
                    var databaseTransaction = databaseTransactionObject.DatabaseTransaction;

                    dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                    if (dynamicObject.Parameters.Count() > 0)
                    {
                        if (dynamicObject.BaseFieldMappings != null && dynamicObject.BaseFieldMappings.Count() > 0)
                        {
                            var baseSequence = statementMap.Seq - 1;
                            DataRow? dataRow = null;
                            if (dataRows.Count > 0 && statementMap.Seq > 0)
                            {
                                dataRow = dataRows.GetValueOrDefault(baseSequence);
                            }

                            for (var baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                var baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (string.IsNullOrEmpty(baseFieldMapping.BaseSequence) == false)
                                {
                                    var baseSequenceMapping = int.Parse(baseFieldMapping.BaseSequence);
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

                                var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    var SQLID = "";
                    var executeDataID = dynamicObject.QueryID + "_" + i.ToString();
                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        var logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
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
                                var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToXml", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLToXml");
                                });
                            }

                            var pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(connectionFactory.Connection, pretreatmentProfiler);
                            using (var pretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                            {
                                try
                                {
                                    using (var ds = DataTableHelper.DataReaderToDataSet(pretreatmentReader))
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
                                            for (var j = 0; j < ds.Tables.Count; j++)
                                            {
                                                var resultType = resultTypes[j].Trim();
                                                var table = ds.Tables[j];
                                                if (table.Columns.Count == 0)
                                                {
                                                    continue;
                                                }

                                                if (resultType == "Row")
                                                {
                                                    var rowItem = table.Rows[0];
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                        var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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
                                                    var parameters = new List<object>();
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        var dataView = new DataView(table);
                                                        var dataTable = dataView.ToTable(true, item.ColumnName);
                                                        foreach (DataRow row in dataTable.Rows)
                                                        {
                                                            parameters.Add(row[0]);
                                                        }

                                                        if (parameters.Count > 0)
                                                        {
                                                            dynamicParameters?.Add(item.ColumnName, parameters);

                                                            var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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

                                    var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
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
                                finally
                                {
                                    pretreatmentReader?.Close();
                                }
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(statementMap.BeforeTransactionCommand) == false)
                    {
                        var logData = "";
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
                        var beforeCommandResult = await businessApiClient.OnewayTransactionCommandAsync(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                    var profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                            });
                        }

                        var parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
                        if (string.IsNullOrEmpty(parseSQL) == true || parseSQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() == "")
                        {
                            if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                            {
                                var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLToXml", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", empty SQL passing" + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                                });
                            }

                            continue;
                        }

                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                            });
                        }

                        var connection = new ProfilerDbConnection(connectionFactory.Connection, profiler);
                        using (var mainReader = connection.ExecuteReader(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                        {
                            try
                            {
                                if (dynamicObject.IgnoreResult == true)
                                {
                                    using var dataTable = new DataTable();
                                    using var schemaTable = mainReader.GetSchemaTable();
                                    if (schemaTable == null)
                                    {
                                        continue;
                                    }

                                    DataRow row;

                                    string columnName;
                                    DataColumn column;
                                    var count = schemaTable.Rows.Count;

                                    for (var j = 0; j < count; j++)
                                    {
                                        row = schemaTable.Rows[j];
                                        columnName = (string)row["ColumnName"];

                                        column = new DataColumn(columnName, (Type)row["DataType"]);
                                        dataTable.Columns.Add(column);
                                    }

                                    var values = new object[count];

                                    try
                                    {
                                        dataTable.BeginLoadData();
                                        while (mainReader.Read())
                                        {
                                            mainReader.GetValues(values);
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
                                else
                                {
                                    using var ds = DataTableHelper.DataReaderToDataSet(mainReader, "Table" + statementMap.Seq.ToString(), 1);
                                    if (ds != null)
                                    {
                                        for (var j = 0; j < ds.Tables.Count; j++)
                                        {
                                            var table = ds.Tables[j];
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
                                                        var baseColumnID = string.IsNullOrEmpty(baseFieldRelation.RelationFieldID) == true ? "_Children" : baseFieldRelation.RelationFieldID;
                                                        if (baseTable.Columns.Contains(baseColumnID) == false && baseFieldRelation.RelationMappings.Count > 0)
                                                        {
                                                            baseTable.Columns.Add(baseColumnID, typeof(object));

                                                            var dvChildren = table.AsDataView();
                                                            foreach (DataRow row in baseTable.Rows)
                                                            {
                                                                var rowFilters = new List<string>() { "1<2" };
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
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        for (var j = 0; j < ds.Tables.Count; j++)
                                        {
                                            var table = ds.Tables[j];
                                            if (table.Columns.Count == 0)
                                            {
                                                continue;
                                            }

                                            if (dynamicObject.BaseFieldRelations != null && dynamicObject.BaseFieldRelations.Count() > 0)
                                            {
                                                var baseFieldRelation = dynamicObject.BaseFieldRelations[j];
                                                if (baseFieldRelation != null)
                                                {
                                                    if (baseFieldRelation.DisposeResult == true)
                                                    {
                                                        ds.Tables.Remove(table);
                                                    }
                                                }
                                            }
                                        }

                                        for (var j = 0; j < ds.Tables.Count; j++)
                                        {
                                            var table = ds.Tables[j];
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

                                if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                                {
                                    var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLMapToXml", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLMapToXml");
                                    });
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = exception.ToMessage();
                                var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
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
                                    var fallbackCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                            finally
                            {
                                mainReader?.Close();
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
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
                            var fallbackCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                            var afterCommandResult = businessApiClient.OnewayTransactionCommand(transactionCommands, request.GlobalID, dynamicObject.QueryID, dynamicParameters);
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
                        if (response.ExceptionText.Length > 600)
                        {
                            response.ExceptionText = response.ExceptionText.Substring(0, 600) + "...";
                        }
                        isCommandError = true;
                        goto TransactionException;
                    }
                }

                if (request.IsTransaction == true)
                {
                    CommitTransactions(databaseTransactionObjects);
                }

                using (var ds = new DataSet())
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
                        RollbackTransactions(databaseTransactionObjects);
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
                    RollbackTransactions(databaseTransactionObjects);
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
                CloseDatabaseConnections(databaseTransactionObjects);
            }
        }

        public async Task ExecuteCodeHelpSQLMap(DynamicRequest request, DynamicResponse response)
        {
            var isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            var transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();
            var databaseTransactionObjects = new List<DatabaseTransactionObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                var logQuerys = new List<string>();
                var i = 0;
                foreach (var queryObject in request.DynamicObjects)
                {
                    if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                    {
                        queryObject.TenantID = tenantID;
                    }

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
                        ConnectionString = connectionInfo == null ? "" : (connectionInfo.Item2 == DataProviders.SQLite ? connectionInfo.Item1.Replace("\\", "/") : connectionInfo.Item1),
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        var logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
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
                var responseCodeObject = new ResponseCodeObject();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    var queryObject = transactionDynamicObject.Value.DynamicTransaction;
                    var statementMap = transactionDynamicObject.Value.Statement;

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    var databaseTransactionObject = CreateDatabaseTransactionFactory(request, databaseTransactionObjects, transactionDynamicObject, statementMap, databaseProvider);
                    var connectionFactory = databaseTransactionObject.ConnectionFactory!;
                    var databaseTransaction = databaseTransactionObject.DatabaseTransaction;

                    var SQLID = queryObject.QueryID + "_" + i.ToString();
                    var profiler = new ConsoleProfiler(request.RequestID, queryObject.QueryID + "_" + i.ToString() + "_statment", ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(queryObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteCodeHelpSQLMap", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteCodeHelpSQLMap");
                            });
                        }

                        var parseSQL = DatabaseMapper.Find(statementMap, queryObject);
                        dynamic? dynamicParameters = CreateDynamicParameters(databaseProvider, statementMap);
                        SetDbParameterMapping(connectionFactory, databaseProvider, queryObject, statementMap, dynamicParameters);

                        var connection = new ProfilerDbConnection(connectionFactory.Connection, profiler);
                        using (IDataReader dataReader = await connection.ExecuteReaderAsync(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                        {
                            try
                            {
                                if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                                {
                                    var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                                    loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteCodeHelpSQLMap", (string error) =>
                                    {
                                        logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteCodeHelpSQLMap");
                                    });
                                }

                                using var ds = DataTableHelper.DataReaderToDataSet(dataReader);
                                {
                                    if (ds == null || ds.Tables.Count < 2)
                                    {
                                        response.ExceptionText = $"TransactionID: {statementMap.TransactionID}, StatementID: {statementMap.StatementID}에 대한 데이터 정보 확인 필요";
                                        isCommandError = true;
                                        goto TransactionException;
                                    }

                                    var table = ds.Tables[0];
                                    if (table.Rows.Count == 1)
                                    {
                                        var item = table.Rows[0];
                                        var businessConnectionInfo = GetConnectionInfomation(queryObject, statementMap.ApplicationID, statementMap.ProjectID, item.GetStringSafe("DataSourceID"));
                                        if (businessConnectionInfo == null)
                                        {
                                            response.ExceptionText = $"DataSourceID - {statementMap.ApplicationID}_{statementMap.ProjectID}_{item.GetStringSafe("DataSourceID")}에 대한 데이터 원본 정보 필요";
                                            isCommandError = true;
                                            goto TransactionException;
                                        }

                                        var commandText = item["CommandText"]?.ToStringSafe();
                                        var parameters = queryObject.Parameters[2]?.Value == null ? "" : queryObject.Parameters[2]?.Value?.ToStringSafe();

                                        var businessParameters = new DynamicParameters();
                                        var adHocParameters = new JObject();

                                        if (parameters != null)
                                        {
                                            var codeHelpParameters = parameters.Split(';');
                                            foreach (var codeHelpParameter in codeHelpParameters)
                                            {
                                                if (codeHelpParameter.Length > 0)
                                                {
                                                    var parameterName = codeHelpParameter.Split(':')[0].Trim();
                                                    var parameterValue = codeHelpParameter.Split(':')[1].Trim();

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

                                        var schemeDataTable = ds.Tables[1];
                                        foreach (DataRow row in schemeDataTable.Rows)
                                        {
                                            var val = row.GetStringSafe("HiddenYN");

                                            responseCodeObject.Scheme.Add(new Scheme()
                                            {
                                                ColumnID = row.GetStringSafe("ColumnID"),
                                                ColumnText = row.GetStringSafe("ColumnText"),
                                                ColumnType = row.GetStringSafe("ColumnType"),
                                                HiddenYN = val.ToBoolean()
                                            });
                                        }

                                        var keyString = "";
                                        commandText = DatabaseMapper.RecursiveParameters(commandText.ToStringSafe(), adHocParameters, keyString);

                                        var businessDatabase = new DatabaseFactory(businessConnectionInfo.Item1, businessConnectionInfo.Item2);
                                        if (businessDatabase.Connection != null)
                                        {
                                            using (var businessReader = await businessDatabase.Connection.ExecuteReaderAsync(commandText, businessParameters))
                                            using (var dsCodes = DataTableHelper.DataReaderToDataSet(businessReader))
                                            {
                                                try
                                                {
                                                    if (dsCodes == null || dsCodes.Tables.Count == 0)
                                                    {
                                                    }
                                                    else
                                                    {
                                                        responseCodeObject.DataSource = dsCodes.Tables[0];
                                                    }
                                                }
                                                finally
                                                {
                                                    businessReader.Close();
                                                    businessDatabase.Connection.Close();
                                                    businessDatabase.Dispose();
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            catch (Exception exception)
                            {
                                response.ExceptionText = exception.ToMessage();
                                var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteCodeHelpSQLMap", (string error) =>
                                {
                                    logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteCodeHelpSQLMap");
                                });
                            }
                            finally
                            {
                                dataReader?.Close();
                                connection.Close();
                                connectionFactory.Dispose();
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        response.ExceptionText = exception.ToMessage();
                        var logData = $"SQLID: {SQLID}, ExceptionText: {response.ExceptionText}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
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
                        if (response.ExceptionText.Length > 600)
                        {
                            response.ExceptionText = response.ExceptionText.Substring(0, 600) + "...";
                        }
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
                CloseDatabaseConnections(databaseTransactionObjects);
            }
        }

        public async Task ExecuteSchemeOnlySQLMap(DynamicRequest request, DynamicResponse response)
        {
            var isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            var transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();
            var databaseTransactionObjects = new List<DatabaseTransactionObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                var logQuerys = new List<string>();
                var i = 0;
                foreach (var queryObject in request.DynamicObjects)
                {
                    if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                    {
                        queryObject.TenantID = tenantID;
                    }

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
                        ConnectionString = connectionInfo == null ? "" : (connectionInfo.Item2 == DataProviders.SQLite ? connectionInfo.Item1.Replace("\\", "/") : connectionInfo.Item1),
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        var logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
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
                var additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                var mergeDatas = new Dictionary<string, List<DatabaseColumn>>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    var dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    var statementMap = transactionDynamicObject.Value.Statement;

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    var databaseTransactionObject = CreateDatabaseTransactionFactory(request, databaseTransactionObjects, transactionDynamicObject, statementMap, databaseProvider);
                    var connectionFactory = databaseTransactionObject.ConnectionFactory!;
                    var databaseTransaction = databaseTransactionObject.DatabaseTransaction;

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

                            for (var baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                var baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    var SQLID = "";
                    var executeDataID = dynamicObject.QueryID + "_" + i.ToString();
                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        var logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteSchemeOnlySQLMap");
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
                                var logData = $"SQLID: {SQLID}, Parameters: {JsonConvert.SerializeObject(dynamicParameters)}";
                                loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                                {
                                    logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                                });
                            }

                            var pretreatmentProfiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(connectionFactory.Connection, pretreatmentProfiler);
                            using (var pretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                            {
                                try
                                {
                                    using (var ds = DataTableHelper.DataReaderToDataSet(pretreatmentReader))
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
                                            for (var j = 0; j < ds.Tables.Count; j++)
                                            {
                                                var resultType = resultTypes[j].Trim();
                                                var table = ds.Tables[j];
                                                if (table.Columns.Count == 0)
                                                {
                                                    continue;
                                                }

                                                if (resultType == "Row")
                                                {
                                                    var rowItem = table.Rows[0];
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                        var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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
                                                    var parameters = new List<object>();
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        var dataView = new DataView(table);
                                                        var dataTable = dataView.ToTable(true, item.ColumnName);
                                                        foreach (DataRow row in dataTable.Rows)
                                                        {
                                                            parameters.Add(row[0]);
                                                        }

                                                        if (parameters.Count > 0)
                                                        {
                                                            dynamicParameters?.Add(item.ColumnName, parameters);

                                                            var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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

                                    var logData = $"SQLID: {SQLID}, ExecuteSQL: \n\n{pretreatmentProfiler.ExecuteSQL}";
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
                                finally
                                {
                                    pretreatmentReader?.Close();
                                }
                            }
                        }
                    }

                    SQLID = dynamicObject.QueryID + "_" + i.ToString();
                    var profiler = new ConsoleProfiler(request.RequestID, executeDataID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        SQLID = dynamicObject.QueryID + "_" + i.ToString();
                        var logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                        });
                    }

                    var parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);

                    var connection = new ProfilerDbConnection(connectionFactory.Connection, profiler);
                    using (var mainReader = connection.ExecuteReader(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                    {
                        try
                        {
                            if (dynamicObject.IgnoreResult == true)
                            {
                                using var dataTable = new DataTable();
                                using var schemaTable = mainReader.GetSchemaTable();
                                if (schemaTable == null)
                                {
                                    continue;
                                }

                                DataRow row;

                                string columnName;
                                DataColumn column;
                                var count = schemaTable.Rows.Count;

                                for (var j = 0; j < count; j++)
                                {
                                    row = schemaTable.Rows[j];
                                    columnName = (string)row["ColumnName"];

                                    column = new DataColumn(columnName, (Type)row["DataType"]);
                                    dataTable.Columns.Add(column);
                                }

                                var values = new object[count];

                                try
                                {
                                    dataTable.BeginLoadData();
                                    while (mainReader.Read())
                                    {
                                        mainReader.GetValues(values);
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
                            else
                            {
                                using var ds = DataTableHelper.DataReaderToSchemeOnly(mainReader, "Table", 1);
                                var jsonObjectType = JsonObjectType.FormJson;

                                if (ds != null)
                                {
                                    for (var j = 0; j < ds.Tables.Count; j++)
                                    {
                                        var table = ds.Tables[j];
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
                        catch (Exception exception)
                        {
                            response.ExceptionText = $"SQLID: {SQLID}, ExceptionText: {exception.ToMessage()}, ExecuteSQL: \n\n{profiler.ExecuteSQL}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "N", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap", (string error) =>
                            {
                                logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "QueryDataClient/ExecuteSchemeOnlySQLMap");
                            });

                            isCommandError = true;
                            goto TransactionException;
                        }
                        finally
                        {
                            mainReader?.Close();
                        }
                    }
                }

                if (request.IsTransaction == true)
                {
                    CommitTransactions(databaseTransactionObjects);
                }

                response.ResultJson = mergeDatas;
                response.Acknowledge = AcknowledgeType.Success;

TransactionException:
                if (isCommandError == true)
                {
                    if (request.IsTransaction == true)
                    {
                        RollbackTransactions(databaseTransactionObjects);
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
                    RollbackTransactions(databaseTransactionObjects);
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
                CloseDatabaseConnections(databaseTransactionObjects);
            }
        }

        public async Task ExecuteDynamicSQLText(DynamicRequest request, DynamicResponse response)
        {
            var result = new SQLMapMeta();
            var isCommandError = false;
            request.RequestID = request.RequestID == null ? "NULL" : request.RequestID;
            var transactionDynamicObjects = new Dictionary<string, TransactionDynamicObjects>();
            var databaseTransactionObjects = new List<DatabaseTransactionObjects>();

            try
            {
                if (request.DynamicObjects == null || request.DynamicObjects.Count == 0)
                {
                    response.ExceptionText = $"거래 요청 정보 확인 필요 request: {JsonConvert.SerializeObject(request)}";
                    return;
                }

                var logQuerys = new List<string>();
                var i = 0;
                foreach (var queryObject in request.DynamicObjects)
                {
                    if (request.LoadOptions?.TryGetValue("$tenantID", out var tenantID) == true)
                    {
                        queryObject.TenantID = tenantID;
                    }

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
                        ConnectionString = connectionInfo == null ? "" : (connectionInfo.Item2 == DataProviders.SQLite ? connectionInfo.Item1.Replace("\\", "/") : connectionInfo.Item1),
                        DataProvider = connectionInfo == null ? DataProviders.SQLite : connectionInfo.Item2
                    });

                    i = i + 1;
                }

                if (logQuerys.Count > 0)
                {
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        var logData = $"QueryID: {string.Join(", ", logQuerys.ToArray())}";
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
                var additionalData = new DataTable();
                additionalData.Columns.Add("MessageCode", typeof(string));
                additionalData.Columns.Add("MessageText", typeof(string));
                var mergeDatas = new List<object>();
                foreach (var transactionDynamicObject in transactionDynamicObjects)
                {
                    var dynamicObject = transactionDynamicObject.Value.DynamicTransaction;
                    var statementMap = transactionDynamicObject.Value.Statement;

                    var databaseProvider = transactionDynamicObject.Value.DataProvider;
                    var databaseTransactionObject = CreateDatabaseTransactionFactory(request, databaseTransactionObjects, transactionDynamicObject, statementMap, databaseProvider);
                    var connectionFactory = databaseTransactionObject.ConnectionFactory!;
                    var databaseTransaction = databaseTransactionObject.DatabaseTransaction;

                    var cloneStatement = statementMap.ShallowCopy();
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

                            for (var baseFieldIndex = 0; baseFieldIndex < dynamicObject.BaseFieldMappings.Count; baseFieldIndex++)
                            {
                                var baseFieldMapping = dynamicObject.BaseFieldMappings[baseFieldIndex];

                                if (dataRow[baseFieldMapping.SourceFieldID] == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 SourceFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == baseFieldMapping.TargetFieldID).FirstOrDefault();

                                if (dynamicParameter == null)
                                {
                                    response.ExceptionText = $"BaseFieldMappings - {dynamicObject.QueryID}에 대한 TargetFieldID {baseFieldMapping.SourceFieldID} 컬럼 정보 필요";
                                    isCommandError = true;
                                    goto TransactionException;
                                }

                                dynamicParameter.Value = dataRow[baseFieldMapping.SourceFieldID];
                            }
                        }

                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }
                    else
                    {
                        SetDbParameterMapping(connectionFactory, databaseProvider, dynamicObject, statementMap, dynamicParameters);
                    }

                    var SQLID = "";
                    var executeDataID = dynamicObject.QueryID + "_" + i.ToString();
                    if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                    {
                        var logData = $"Pretreatment {executeDataID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                        loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLText", (string error) =>
                        {
                            logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLText");
                        });
                    }

                    var pretreatment = DatabaseMapper.FindPretreatment(statementMap, dynamicObject);
                    if (pretreatment.SQL != null && pretreatment.ResultType != null)
                    {
                        if (pretreatment.SQL.Replace(Environment.NewLine, "").Replace("\t", "").Trim() != "")
                        {
                            var pretreatmentSQLID = executeDataID + "_pretreatment";
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

                            var pretreatmentProfiler = new ConsoleProfiler(request.RequestID, pretreatmentSQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);
                            var pretreatmentConnection = new ProfilerDbConnection(connectionFactory.Connection, pretreatmentProfiler);
                            using (var pretreatmentReader = await pretreatmentConnection.ExecuteReaderAsync(pretreatment.SQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                            {
                                try
                                {
                                    using (var ds = DataTableHelper.DataReaderToDataSet(pretreatmentReader))
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
                                            for (var j = 0; j < ds.Tables.Count; j++)
                                            {
                                                var resultType = resultTypes[j].Trim();
                                                var table = ds.Tables[j];
                                                if (table.Columns.Count == 0)
                                                {
                                                    continue;
                                                }

                                                if (resultType == "Row")
                                                {
                                                    var rowItem = table.Rows[0];
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        PretreatmentAddParameter(databaseProvider, statementMap, dynamicParameters, rowItem, item);

                                                        var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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
                                                    var parameters = new List<object>();
                                                    var colItems = table.Columns;
                                                    foreach (DataColumn item in colItems)
                                                    {
                                                        var dataView = new DataView(table);
                                                        var dataTable = dataView.ToTable(true, item.ColumnName);
                                                        foreach (DataRow row in dataTable.Rows)
                                                        {
                                                            parameters.Add(row[0]);
                                                        }

                                                        if (parameters.Count > 0)
                                                        {
                                                            dynamicParameters?.Add(item.ColumnName, parameters);

                                                            var dynamicParameter = dynamicObject.Parameters.Where(p => p.ParameterName == item.ColumnName).FirstOrDefault();

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
                                catch (Exception exception)
                                {
                                    var logData = $"ExecuteSQL: {pretreatmentProfiler.ExecuteSQL}, Exception{exception.ToMessage()}";

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
                                finally
                                {
                                    pretreatmentReader?.Close();
                                }
                            }
                        }
                    }

                    SQLID = executeDataID + "_statement";
                    var profiler = new ConsoleProfiler(request.RequestID, SQLID, ModuleConfiguration.IsTransactionLogging == true ? ModuleConfiguration.ModuleLogFilePath : null);

                    try
                    {
                        if (ModuleConfiguration.IsTransactionLogging == true || statementMap.TransactionLog == true)
                        {
                            var logData = $"SQLID: {SQLID}, ParseSQL Parameters: {JsonConvert.SerializeObject(dynamicObject)}";
                            loggerClient.TransactionMessageLogging(request.GlobalID, "Y", statementMap.ApplicationID, statementMap.ProjectID, statementMap.TransactionID, statementMap.StatementID, logData, "QueryDataClient/ExecuteDynamicSQLText", (string error) =>
                            {
                                logger.Information("[{LogCategory}] " + "fallback error: " + error + ", " + logData, "QueryDataClient/ExecuteDynamicSQLText");
                            });
                        }

                        var parseSQL = DatabaseMapper.Find(statementMap, dynamicObject);
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

                        var connection = new ProfilerDbConnection(connectionFactory.Connection, profiler);
                        using (var mainReader = connection.ExecuteReader(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters, databaseTransaction, statementMap.Timeout < 0 ? ModuleConfiguration.DefaultCommandTimeout : statementMap.Timeout))
                        {
                            try
                            {
                                if (dynamicObject.IgnoreResult == true)
                                {
                                    using var dataTable = new DataTable();
                                    using var schemaTable = mainReader.GetSchemaTable();
                                    if (schemaTable == null)
                                    {
                                        continue;
                                    }

                                    DataRow row;

                                    string columnName;
                                    DataColumn column;
                                    var count = schemaTable.Rows.Count;

                                    for (var j = 0; j < count; j++)
                                    {
                                        row = schemaTable.Rows[j];
                                        columnName = (string)row["ColumnName"];

                                        column = new DataColumn(columnName, (Type)row["DataType"]);
                                        dataTable.Columns.Add(column);
                                    }

                                    var values = new object[count];

                                    try
                                    {
                                        dataTable.BeginLoadData();
                                        while (mainReader.Read())
                                        {
                                            mainReader.GetValues(values);
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
                            catch (Exception exception)
                            {
                                var logData = $"ExecuteSQL: {profiler.ExecuteSQL}, ExceptionText: {exception.ToMessage()}";

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
                            finally
                            {
                                mainReader?.Close();
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        var logData = $"ExecuteSQL: {profiler.ExecuteSQL}, ExceptionText: {exception.ToMessage()}";

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
                CloseDatabaseConnections(databaseTransactionObjects);
            }
        }

        private string GetProviderDbType(DataColumn column, DataProviders? databaseProvider = null)
        {
            var result = "";

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
                    var replacePrefix = "";
                    var replacePostfix = "";
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

        private void SetDbParameterMapping(DatabaseFactory databaseFactory, DataProviders databaseProvider, QueryObject queryObject, StatementMap statementMap, dynamic? dynamicParameters)
        {
            if (dynamicParameters == null)
            {
                return;
            }

            ISequentialIdGenerator sequentialIdGenerator = new SequentialIdGenerator();
            var dbParameterMaps = statementMap.DbParameters;
            foreach (var dbParameterMap in dbParameterMaps)
            {
                if (dbParameterMap.Direction.IndexOf("Input") > -1)
                {
                    var dynamicParameter = GetDbParameterMap(dbParameterMap.Name, queryObject.Parameters);
                    if (dynamicParameter == null && dbParameterMap.DefaultValue.ToUpper() == "NULL")
                    {
                        continue;
                    }

                    if (dynamicParameter == null || string.IsNullOrEmpty(dynamicParameter.Value.ToStringSafe()) == true)
                    {
                        if (dynamicParameter == null)
                        {
                            dynamicParameter = new DynamicParameter();
                            dynamicParameter.ParameterName = GetParameterName(dbParameterMap.Name);
                            dynamicParameter.Length = dbParameterMap.Length;
                            dynamicParameter.DbType = dbParameterMap.DbType;
                        }

                        switch (dbParameterMap.DefaultValue)
                        {
                            case "@SUID":
                                dynamicParameter.Value = sequentialIdGenerator.NewId().ToString("N");
                                break;
                            case "@GUID":
                                dynamicParameter.Value = Guid.NewGuid();
                                break;
                            case "@NOW":
                                dynamicParameter.Value = DateTime.Now;
                                break;
                            case "@UTCNOW":
                                dynamicParameter.Value = DateTime.UtcNow;
                                break;
                            case "@TRUE":
                                dynamicParameter.Value = true;
                                break;
                            case "@FALSE":
                                dynamicParameter.Value = false;
                                break;
                            case "@DBNULL":
                                dynamicParameter.Value = DBNull.Value;
                                break;
                            case "NULL":
                                dynamicParameter.Value = "";
                                break;
                            default:
                                dynamicParameter.Value = dbParameterMap.DefaultValue;
                                break;
                        }
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
                                    var oracleClobParameter = new OracleClobParameter(dynamicParameter.Value);
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
                        var dynamicDbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(dbParameterMap.DbType) == true ? dynamicParameter.DbType : dbParameterMap.DbType);

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

                        var isTransformed = TransformValue(dbParameterMap, dynamicParameter, dbParameterMaps);
                        if (isTransformed == false)
                        {
                            dynamicParameters.Add(
                                dynamicParameter.ParameterName,
                                dynamicParameter.Value,
                                dynamicDbType,
                                (ParameterDirection)Enum.Parse(typeof(ParameterDirection), dbParameterMap.Direction),
                                dbParameterMap.Length <= 0 ? -1 : dbParameterMap.Length
                            );
                        }
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
                        var dynamicDbType = (DbType)Enum.Parse(typeof(DbType), dbParameterMap.DbType);

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

        private bool TransformValue(DbParameterMap dbParameterMap, DynamicParameter dynamicParameter, List<DbParameterMap> dbParameterMaps)
        {
            var isTransformed = false;
            var transformParts = dbParameterMap.Transform.Split('|');
            var transformCommand = transformParts[0];

            try
            {

                switch (transformCommand)
                {
                    case "@FOREACH":
                        var jsonArrayString = JsonConvert.SerializeObject(dynamicParameter.Value.ToStringSafe().Split(','));
                        dynamicParameter.Value = JArray.Parse(jsonArrayString);
                        isTransformed = true;
                        break;
                    case "@LOWER":
                        dynamicParameter.Value = dynamicParameter.Value.ToStringSafe().ToLower();
                        break;
                    case "@UPPER":
                        dynamicParameter.Value = dynamicParameter.Value.ToStringSafe().ToUpper();
                        break;
                    case "@STRING2DATETIME":
                        // @STRING2DATETIME|format
                        var datetimeString = dynamicParameter.Value.ToStringSafe();

                        if (transformParts.Length >= 2)
                        {
                            var format = transformParts[1];
                            if (DateTime.TryParseExact(datetimeString, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedExact))
                            {
                                dynamicParameter.Value = parsedExact;
                            }
                            else
                            {
                                dynamicParameter.Value = null;
                            }
                        }
                        else
                        {
                            if (DateTime.TryParse(datetimeString, out var parsedDefault))
                            {
                                dynamicParameter.Value = parsedDefault;
                            }
                            else
                            {
                                dynamicParameter.Value = null;
                            }
                        }
                        break;
                    case "@DATETIME2STRING":
                        // @DATETIME2STRING|format
                        if (transformParts.Length >= 2)
                        {
                            var format = transformParts[1];
                            if (DateTime.TryParse(dynamicParameter.Value.ToStringSafe(), out var parsedDateTime))
                            {
                                dynamicParameter.Value = parsedDateTime.ToString(format);
                            }
                            else
                            {
                                dynamicParameter.Value = "";
                            }
                        }
                        break;
                    case "@SUBSTRING":
                        // @SUBSTRING|startIndex|length
                        if (transformParts.Length >= 3)
                        {
                            var startIndex = int.Parse(transformParts[1]);
                            var length = int.Parse(transformParts[2]);
                            var sourceString = dynamicParameter.Value.ToStringSafe();
                            dynamicParameter.Value = sourceString.Length > startIndex ?
                                sourceString.Substring(startIndex, Math.Min(length, sourceString.Length - startIndex)) : "";
                        }
                        break;

                    case "@SUBSTRING_START":
                        // @SUBSTRING_START|startIndex
                        if (transformParts.Length >= 2)
                        {
                            var startIndex = int.Parse(transformParts[1]);
                            var sourceString = dynamicParameter.Value.ToStringSafe();
                            dynamicParameter.Value = sourceString.Length > startIndex ? sourceString.Substring(startIndex) : "";
                        }
                        break;

                    case "@REPLACE":
                        // @REPLACE|oldValue|newValue
                        if (transformParts.Length >= 3)
                        {
                            var oldValue = transformParts[1];
                            var newValue = transformParts[2];
                            dynamicParameter.Value = dynamicParameter.Value.ToStringSafe().Replace(oldValue, newValue);
                        }
                        break;

                    case "@REPLACE_REGEX":
                        // @REPLACE_REGEX|pattern|replacement  
                        if (transformParts.Length >= 3)
                        {
                            var pattern = transformParts[1];
                            var replacement = transformParts[2];
                            dynamicParameter.Value = Regex.Replace(dynamicParameter.Value.ToStringSafe(), pattern, replacement);
                        }
                        break;

                    case "@CONTAINS":
                        // @CONTAINS|searchString
                        if (transformParts.Length >= 2)
                        {
                            var searchString = transformParts[1];
                            dynamicParameter.Value = dynamicParameter.Value.ToStringSafe().Contains(searchString);
                        }
                        break;

                    case "@STARTS_WITH":
                        // @STARTS_WITH|prefix
                        if (transformParts.Length >= 2)
                        {
                            var prefix = transformParts[1];
                            dynamicParameter.Value = dynamicParameter.Value.ToStringSafe().StartsWith(prefix);
                        }
                        break;

                    case "@ENDS_WITH":
                        // @ENDS_WITH|suffix
                        if (transformParts.Length >= 2)
                        {
                            var suffix = transformParts[1];
                            dynamicParameter.Value = dynamicParameter.Value.ToStringSafe().EndsWith(suffix);
                        }
                        break;

                    case "@PADLEFT":
                        // @PADLEFT|totalWidth|paddingChar
                        if (transformParts.Length >= 3)
                        {
                            var totalWidth = int.Parse(transformParts[1]);
                            var paddingChar = transformParts[2].Length > 0 ? transformParts[2][0] : ' ';
                            dynamicParameter.Value = dynamicParameter.Value.ToStringSafe().PadLeft(totalWidth, paddingChar);
                        }
                        break;

                    case "@PADRIGHT":
                        // @PADRIGHT|totalWidth|paddingChar
                        if (transformParts.Length >= 3)
                        {
                            var totalWidth = int.Parse(transformParts[1]);
                            var paddingChar = transformParts[2].Length > 0 ? transformParts[2][0] : ' ';
                            dynamicParameter.Value = dynamicParameter.Value.ToStringSafe().PadRight(totalWidth, paddingChar);
                        }
                        break;

                    case "@SPLIT_CUSTOM":
                        // @SPLIT_CUSTOM|delimiter
                        if (transformParts.Length >= 2)
                        {
                            var delimiter = transformParts[1];
                            dynamicParameter.Value = dynamicParameter.Value.ToStringSafe().Split(new string[] { delimiter }, StringSplitOptions.None);
                        }
                        break;

                    case "@JOIN_CUSTOM":
                        // @JOIN_CUSTOM|separator
                        if (dynamicParameter.Value != null && transformParts.Length >= 2)
                        {
                            var separator = transformParts[1];
                            dynamicParameter.Value = string.Join(separator, (IEnumerable<object>)dynamicParameter.Value);
                        }
                        break;

                    case "@DEFAULT_IF_NULL":
                        // @DEFAULT_IF_NULL|defaultValue
                        if (transformParts.Length >= 2)
                        {
                            var defaultValue = transformParts[1];
                            dynamicParameter.Value = dynamicParameter.Value ?? defaultValue;
                        }
                        break;

                    case "@DEFAULT_IF_EMPTY":
                        // @DEFAULT_IF_EMPTY|defaultValue
                        if (transformParts.Length >= 2)
                        {
                            var defaultValue = transformParts[1];
                            dynamicParameter.Value = string.IsNullOrEmpty(dynamicParameter.Value.ToStringSafe()) ? defaultValue : dynamicParameter.Value;
                        }
                        break;

                    case "@DEFAULT_IF_WHITESPACE":
                        // @DEFAULT_IF_WHITESPACE|defaultValue
                        if (transformParts.Length >= 2)
                        {
                            var defaultValue = transformParts[1];
                            dynamicParameter.Value = string.IsNullOrWhiteSpace(dynamicParameter.Value.ToStringSafe()) ? defaultValue : dynamicParameter.Value;
                        }
                        break;

                    case "@ROUND_DECIMAL":
                        // @ROUND_DECIMAL|decimals
                        if (transformParts.Length >= 2)
                        {
                            var decimals = int.Parse(transformParts[1]);
                            dynamicParameter.Value = Math.Round(Convert.ToDouble(dynamicParameter.Value), decimals);
                        }
                        break;

                    case "@FORMAT_NUMBER":
                        // @FORMAT_NUMBER|format (예: N2, C, P)
                        if (transformParts.Length >= 2)
                        {
                            var format = transformParts[1];
                            dynamicParameter.Value = Convert.ToDouble(dynamicParameter.Value).ToString(format);
                        }
                        break;

                    case "@FORMAT_DATETIME":
                        // @FORMAT_DATETIME|format (예: yyyy-MM-dd, HH:mm:ss)
                        if (transformParts.Length >= 2)
                        {
                            var format = transformParts[1];
                            dynamicParameter.Value = dynamicParameter.Value == null ? null : ((DateTime)dynamicParameter.Value).ToString(format);
                        }
                        break;

                    case "@ADD_DAYS":
                        // @ADD_DAYS|days
                        if (transformParts.Length >= 2)
                        {
                            var days = int.Parse(transformParts[1]);
                            dynamicParameter.Value = dynamicParameter.Value == null ? null : ((DateTime)dynamicParameter.Value).AddDays(days);
                        }
                        break;

                    case "@ADD_HOURS":
                        // @ADD_HOURS|hours
                        if (transformParts.Length >= 2)
                        {
                            var hours = int.Parse(transformParts[1]);
                            dynamicParameter.Value = dynamicParameter.Value == null ? null : ((DateTime)dynamicParameter.Value).AddHours(hours);
                        }
                        break;

                    case "@ADD_MINUTES":
                        // @ADD_MINUTES|minutes
                        if (transformParts.Length >= 2)
                        {
                            var minutes = int.Parse(transformParts[1]);
                            dynamicParameter.Value = dynamicParameter.Value == null ? null : ((DateTime)dynamicParameter.Value).AddMinutes(minutes);
                        }
                        break;

                    case "@RANDOM_STRING":
                        // @RANDOM_STRING|length|characters (characters는 선택사항)
                        if (transformParts.Length >= 2)
                        {
                            var length = int.Parse(transformParts[1]);
                            var characters = transformParts.Length >= 3 ? transformParts[2] : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                            var random = new Random();
                            var result = new StringBuilder(length);
                            for (var i = 0; i < length; i++)
                            {
                                result.Append(characters[random.Next(characters.Length)]);
                            }
                            dynamicParameter.Value = result.ToString();
                        }
                        break;

                    case "@RANDOM_NUMBER":
                        // @RANDOM_NUMBER|min|max
                        if (transformParts.Length >= 3)
                        {
                            var min = int.Parse(transformParts[1]);
                            var max = int.Parse(transformParts[2]);
                            dynamicParameter.Value = new Random().Next(min, max + 1);
                        }
                        else
                        {
                            dynamicParameter.Value = new Random().Next();
                        }
                        break;

                    case "@ARRAY_SLICE":
                        // @ARRAY_SLICE|startIndex|count
                        if (dynamicParameter.Value != null && transformParts.Length >= 3)
                        {
                            var startIndex = int.Parse(transformParts[1]);
                            var count = int.Parse(transformParts[2]);

                            var array = ((IEnumerable<object>)dynamicParameter.Value).ToArray();
                            dynamicParameter.Value = array.Skip(startIndex).Take(count).ToArray();
                        }
                        break;

                    case "@ARRAY_SKIP":
                        // @ARRAY_SKIP|count
                        if (dynamicParameter.Value != null && transformParts.Length >= 2)
                        {
                            var count = int.Parse(transformParts[1]);
                            dynamicParameter.Value = ((IEnumerable<object>)dynamicParameter.Value).Skip(count).ToArray();
                        }
                        break;

                    case "@ARRAY_TAKE":
                        // @ARRAY_TAKE|count
                        if (dynamicParameter.Value != null && transformParts.Length >= 2)
                        {
                            var count = int.Parse(transformParts[1]);
                            dynamicParameter.Value = ((IEnumerable<object>)dynamicParameter.Value).Take(count).ToArray();
                        }
                        break;

                    case "@ARRAY_ELEMENT":
                        // @ARRAY_ELEMENT|index
                        if (dynamicParameter.Value != null && transformParts.Length >= 2)
                        {
                            var index = int.Parse(transformParts[1]);
                            var array = ((IEnumerable<object>)dynamicParameter.Value).ToArray();
                            dynamicParameter.Value = index >= 0 && index < array.Length ? array[index] : null;
                        }
                        break;

                    case "@CLAMP":
                        // @CLAMP|min|max
                        if (transformParts.Length >= 3)
                        {
                            var min = double.Parse(transformParts[1]);
                            var max = double.Parse(transformParts[2]);
                            var value = Convert.ToDouble(dynamicParameter.Value);
                            dynamicParameter.Value = Math.Max(min, Math.Min(max, value));
                        }
                        break;

                    case "@MULTIPLY":
                        // @MULTIPLY|factor
                        if (transformParts.Length >= 2)
                        {
                            var factor = double.Parse(transformParts[1]);
                            dynamicParameter.Value = Convert.ToDouble(dynamicParameter.Value) * factor;
                        }
                        break;

                    case "@ADD":
                        // @ADD|value
                        if (transformParts.Length >= 2)
                        {
                            var addValue = double.Parse(transformParts[1]);
                            dynamicParameter.Value = Convert.ToDouble(dynamicParameter.Value) + addValue;
                        }
                        break;

                    case "@PERCENTAGE":
                        // @PERCENTAGE|total|decimals
                        if (transformParts.Length >= 3)
                        {
                            var total = double.Parse(transformParts[1]);
                            var decimals = int.Parse(transformParts[2]);
                            var percentage = (Convert.ToDouble(dynamicParameter.Value) / total) * 100;
                            dynamicParameter.Value = Math.Round(percentage, decimals);
                        }
                        break;

                    case "@REGEX_MATCH":
                        // @REGEX_MATCH|pattern
                        if (transformParts.Length >= 2)
                        {
                            var pattern = transformParts[1];
                            var match = Regex.Match(dynamicParameter.Value.ToStringSafe(), pattern);
                            dynamicParameter.Value = match.Success ? match.Value : "";
                        }
                        break;

                    case "@REGEX_EXTRACT":
                        // @REGEX_EXTRACT|pattern|groupIndex
                        if (transformParts.Length >= 3)
                        {
                            var pattern = transformParts[1];
                            var groupIndex = int.Parse(transformParts[2]);
                            var match = Regex.Match(dynamicParameter.Value.ToStringSafe(), pattern);
                            dynamicParameter.Value = match.Success && match.Groups.Count > groupIndex ? match.Groups[groupIndex].Value : "";
                        }
                        break;

                    default:
                        break;
                }
            }
            catch (Exception exception)
            {
                logger.Warning("[{LogCategory}] [{ParameterName}] " + $"transformCommand: {transformCommand}: {exception.ToMessage()}", "QueryDataClient/TransformValue", dynamicParameter.ParameterName);
            }

            return isTransformed;
        }

        private void PretreatmentAddParameter(DataProviders databaseProvider, StatementMap statementMap, dynamic? dynamicParameters, DataRow rowItem, DataColumn item)
        {
            if (dynamicParameters == null)
            {
                return;
            }

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
                var dynamicDbType = (DbType)Enum.Parse(typeof(DbType), GetProviderDbType(item));

                dynamicParameters.Add(
                    item.ColumnName,
                    rowItem[item.ColumnName],
                    dynamicDbType,
                    ParameterDirection.Input,
                    item.MaxLength
                );
            }
        }

        private static Tuple<string, DataProviders, string>? GetConnectionInfomation(QueryObject queryObject, string applicationID, string projectID, string dataSourceID)
        {
            Tuple<string, DataProviders, string>? result = null;
            if (string.IsNullOrEmpty(dataSourceID) == false)
            {
                var dataSourceMap = DatabaseMapper.GetDataSourceMap(queryObject, applicationID, projectID, dataSourceID);
                if (dataSourceMap != null)
                {
                    result = new Tuple<string, DataProviders, string>(dataSourceMap.ConnectionString, dataSourceMap.DataProvider, dataSourceMap.TransactionIsolationLevel);
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

        private static void CommitTransactions(List<DatabaseTransactionObjects> databaseTransactionObjects)
        {
            foreach (var databaseTransactionObject in databaseTransactionObjects)
            {
                try
                {
                    databaseTransactionObject.ConnectionFactory?.CommitTransaction();
                }
                catch (Exception exception)
                {
                    Log.Error(exception, $"명령 커밋 중 오류: {exception.Message}");
                }
            }
        }

        private static void RollbackTransactions(List<DatabaseTransactionObjects> databaseTransactionObjects)
        {
            foreach (var databaseTransactionObject in databaseTransactionObjects)
            {
                try
                {
                    databaseTransactionObject.ConnectionFactory?.RollbackTransaction();
                }
                catch (Exception exception)
                {
                    Log.Error(exception, $"명령 롤백 중 오류: {exception.Message}");
                }
            }
        }

        private static void CloseDatabaseConnections(List<DatabaseTransactionObjects> databaseTransactionObjects)
        {
            foreach (var databaseTransactionObject in databaseTransactionObjects)
            {
                try
                {
                    if (databaseTransactionObject.ConnectionFactory?.Connection?.IsConnectionOpen() == true)
                    {
                        databaseTransactionObject.ConnectionFactory?.Connection.Close();
                    }
                    databaseTransactionObject.ConnectionFactory?.Dispose();
                }
                catch (Exception exception)
                {
                    Log.Error(exception, $"연결 종료 중 오류: {exception.Message}");
                }
            }
        }

        private static DatabaseTransactionObjects CreateDatabaseTransactionFactory(DynamicRequest request, List<DatabaseTransactionObjects> databaseTransactionObjects, KeyValuePair<string, TransactionDynamicObjects> transactionDynamicObject, StatementMap statementMap, DataProviders databaseProvider)
        {
            DatabaseTransactionObjects result;
            var statementSeq = transactionDynamicObject.Key.Split("_")[1];
            if (statementSeq == "0")
            {
                var connectionFactory = new DatabaseFactory(transactionDynamicObject.Value.ConnectionString.ToStringSafe(), databaseProvider);
                DbTransaction? databaseTransaction = null;

                if (request.IsTransaction == true)
                {
                    var isolationLevel = string.IsNullOrEmpty(statementMap.TransactionIsolationLevel) == true ? transactionDynamicObject.Value.TransactionIsolationLevel.ToStringSafe() : statementMap.TransactionIsolationLevel;
                    isolationLevel = string.IsNullOrEmpty(isolationLevel) == true ? "ReadCommitted" : isolationLevel;
                    if (Enum.TryParse<IsolationLevel>(isolationLevel, out var transactionIsolationLevel) == true)
                    {
                        databaseTransaction = connectionFactory.BeginTransaction(transactionIsolationLevel);
                    }
                }

                result = new DatabaseTransactionObjects()
                {
                    DataProvider = databaseProvider,
                    ConnectionFactory = connectionFactory,
                    DatabaseTransaction = databaseTransaction
                };

                databaseTransactionObjects.Add(result);
            }
            else
            {
                var baseSequence = databaseTransactionObjects.Count - 1;
                result = databaseTransactionObjects[baseSequence];
            }

            return result;
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
