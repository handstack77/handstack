using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using Dapper;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Core.Helpers;
using HandStack.Data;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Enumeration;

using MySql.Data.MySqlClient;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using NpgsqlTypes;

using openapi.Encapsulation;
using openapi.Entity;
using openapi.Extensions;
using openapi.NativeParameters;
using openapi.Profiler;

using Oracle.ManagedDataAccess.Client;

using Org.BouncyCastle.Asn1.Ocsp;

using Serilog;

namespace openapi.DataClient
{
    public class OpenAPIClient : IOpenAPIClient
    {
        private ILogger logger { get; }

        private OpenApiLoggerClient loggerClient { get; }

        private TransactionClient businessApiClient { get; }

        public OpenAPIClient(ILogger logger, TransactionClient businessApiClient, OpenApiLoggerClient loggerClient)
        {
            this.logger = logger;
            this.businessApiClient = businessApiClient;
            this.loggerClient = loggerClient;
        }

        public async Task<DataSet?> ExecuteSQL(ApiService apiService, ApiDataSource apiDataSource, Dictionary<string, object?>? parameters)
        {
            using DataSet? result = null;
            bool isCommandError = false;

            try
            {
                ResponseCodeObject responseCodeObject = new ResponseCodeObject();

                try
                {
                    /*
// openapiClient 내 ExecuteMetaSQL 코드 사용
using var dsApiService = ModuleExtensions.ExecuteMetaSQL(ReturnType.DataSet, dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD03", parameters) as DataSet;
if (dsApiService != null && dsApiService.Tables.Count > 0 && dsApiService.Tables[0].Rows.Count > 0)
{

}
*/

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

            return result;
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

        private dynamic? CreateDynamicParameters(DataProviders databaseProvider, bool nativeDataClient = true)
        {
            dynamic? dynamicParameters = null;
            if (nativeDataClient == true)
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

        private void SetDbParameterMapping(DatabaseFactory databaseFactory, DataProviders databaseProvider, bool nativeDataClient, List<DynamicParameter> queryParameters, List<ApiParameter> apiParameters, dynamic dynamicParameters)
        {
            foreach (ApiParameter apiParameter in apiParameters)
            {
                DynamicParameter? dynamicParameter = GetDbParameterMap(apiParameter.ParameterID, queryParameters);

                if (dynamicParameter == null)
                {
                    continue;
                }

                if (nativeDataClient == true)
                {
                    dynamic? dynamicValue = null;
                    dynamic? dynamicDbType = null;
                    switch (databaseProvider)
                    {
                        case DataProviders.SqlServer:
                            dynamicDbType = (SqlDbType)Enum.Parse(typeof(SqlDbType), string.IsNullOrEmpty(apiParameter.ParameterType) == true ? dynamicParameter.DbType : apiParameter.ParameterType);
                            dynamicValue = dynamicParameter.Value;
                            break;
                        case DataProviders.Oracle:
                            dynamicDbType = (OracleDbType)Enum.Parse(typeof(OracleDbType), string.IsNullOrEmpty(apiParameter.ParameterType) == true ? dynamicParameter.DbType : apiParameter.ParameterType);
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
                            dynamicDbType = (MySqlDbType)Enum.Parse(typeof(MySqlDbType), string.IsNullOrEmpty(apiParameter.ParameterType) == true ? dynamicParameter.DbType : apiParameter.ParameterType);
                            dynamicValue = dynamicParameter.Value;
                            break;
                        case DataProviders.PostgreSQL:
                            dynamicDbType = (NpgsqlDbType)Enum.Parse(typeof(NpgsqlDbType), string.IsNullOrEmpty(apiParameter.ParameterType) == true ? dynamicParameter.DbType : apiParameter.ParameterType);
                            dynamicValue = dynamicParameter.Value;
                            break;
                        case DataProviders.SQLite:
                            dynamicDbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(apiParameter.ParameterType) == true ? dynamicParameter.DbType : apiParameter.ParameterType);
                            dynamicValue = dynamicParameter.Value;
                            break;
                    }

                    dynamicParameters.Add(
                        dynamicParameter.ParameterName,
                        dynamicValue == null ? DBNull.Value : dynamicValue,
                        dynamicDbType,
                        (ParameterDirection)Enum.Parse(typeof(ParameterDirection), "Input"),
                        apiParameter.Length <= 0 ? -1 : apiParameter.Length
                    );
                }
                else
                {
                    DbType dynamicDbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(apiParameter.ParameterType) == true ? dynamicParameter.DbType : apiParameter.ParameterType);

                    if (dynamicDbType == DbType.String)
                    {
                        if (dynamicParameter.Value == null)
                        {
                            if (apiParameter.DefaultValue == "NULL")
                            {
                                dynamicParameter.Value = DBNull.Value;
                            }
                            else if (string.IsNullOrEmpty(apiParameter.DefaultValue) == false)
                            {
                                dynamicParameter.Value = apiParameter.DefaultValue;
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
                            if (apiParameter.DefaultValue == "NULL")
                            {
                                dynamicParameter.Value = DBNull.Value;
                            }
                            else if (string.IsNullOrEmpty(apiParameter.DefaultValue) == false)
                            {
                                dynamicParameter.Value = apiParameter.DefaultValue;
                            }
                        }
                    }

                    dynamicParameters.Add(
                        dynamicParameter.ParameterName,
                        dynamicParameter.Value,
                        dynamicDbType,
                        (ParameterDirection)Enum.Parse(typeof(ParameterDirection), "Input"),
                        apiParameter.Length <= 0 ? -1 : apiParameter.Length
                    );
                }
            }
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
    }
}
