﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using Dapper;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Helpers;
using HandStack.Data;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Enumeration;

using Newtonsoft.Json.Linq;

using openapi.Encapsulation;
using openapi.Entity;
using openapi.Enumeration;
using openapi.Extensions;

using Serilog;

namespace openapi.DataClient
{
    public class OpenAPIClient : IOpenAPIClient
    {
        private ILogger logger { get; }

        private OpenApiLoggerClient loggerClient { get; }

        private TransactionClient businessApiClient { get; }

        private DataProviders dataProvider { get; }

        private string transactionID { get; }

        public OpenAPIClient(ILogger logger, TransactionClient businessApiClient, OpenApiLoggerClient loggerClient)
        {
            this.logger = logger;
            this.businessApiClient = businessApiClient;
            this.loggerClient = loggerClient;
            this.dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), ModuleConfiguration.ModuleDataSource.DataProvider);
            this.transactionID = dataProvider.ToEnumString();
        }

        public async Task<Tuple<string, DataSet?>> ExecuteSQL(string commandText, ApiDataSource apiDataSource, List<ApiParameter> apiParameters, Dictionary<string, object?> parameters)
        {
            var result = new Tuple<string, DataSet?>(ResponseApi.I25.ToEnumString(), null);
            DatabaseFactory? connectionFactory = null;

            try
            {
                /*
                // openapiClient 내 ExecuteMetaSQL 코드 사용
                using var dsApiService = ModuleExtensions.ExecuteMetaSQL(ReturnType.DataSet, dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD03", parameters) as DataSet;
                if (dsApiService != null && dsApiService.Tables.Count > 0 && dsApiService.Tables[0].Rows.Count > 0)
                {

                }
                */
                var databaseProvider = (DataProviders)Enum.Parse(typeof(DataProviders), apiDataSource.DataProvider);
                var parseSQL = DatabaseMapper.Find(commandText, parameters);
                var dynamicParameters = new DynamicParameters();
                connectionFactory = new DatabaseFactory(apiDataSource.ConnectionString.ToStringSafe(), databaseProvider);
                SetDbParameterMapping(apiParameters, parameters, dynamicParameters);

                if (connectionFactory.Connection != null)
                {
                    using IDataReader dataReader = await connectionFactory.Connection.ExecuteReaderAsync(parseSQL, (SqlMapper.IDynamicParameters?)dynamicParameters);
                    using var ds = DataTableHelper.DataReaderToDataSet(dataReader);
                    {
                        if (ds == null || ds.Tables.Count == 0)
                        {
                            result = new Tuple<string, DataSet?>(ResponseApi.I25.ToEnumString(), null);
                            goto TransactionException;
                        }

                        result = new Tuple<string, DataSet?>(string.Empty, ds);
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "OpenAPIClient/ExecuteSQL");
                result = new Tuple<string, DataSet?>($"{ResponseApi.E12.ToEnumString()}, {exception.Message}", null);
            }
            finally
            {
                if (connectionFactory != null)
                {
                    if (connectionFactory.Connection?.IsConnectionOpen() == true)
                    {
                        connectionFactory.Connection?.Close();
                    }
                    connectionFactory.Dispose();
                }
            }

TransactionException:
            if (string.IsNullOrEmpty(result.Item1) == false)
            {
                logger.Error("[{LogCategory}] " + result.Item1, "OpenAPIClient/ExecuteSQL");
            }

            return result;
        }

        public void UsageAPIAggregate(string apiServiceID, string accessID, string format)
        {
            try
            {
                ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.MD01", new
                {
                    APIServiceID = apiServiceID,
                    AccessID = accessID,
                    Format = format
                });
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "OpenAPIClient/UsageAPIAggregate");
            }
        }

        public ApiService? GetApiService(string interfaceID)
        {
            ApiService? result = null;
            try
            {
                result = ModuleExtensions.ExecuteMetaSQLPoco<ApiService>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD03", new
                {
                    InterfaceID = interfaceID
                });
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "OpenAPIClient/GetApiService");
            }

            return result;
        }

        public AccessMemberApi? GetAccessMemberApi(string apiServiceID, string accessID)
        {
            AccessMemberApi? result = null;
            try
            {
                result = ModuleExtensions.ExecuteMetaSQLPoco<AccessMemberApi>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD05", new
                {
                    APIServiceID = apiServiceID,
                    AccessID = accessID
                });
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "OpenAPIClient/GetAccessMemberApi");
            }

            return result;
        }

        public ApiDataSource? GetApiDataSource(string dataSourceID)
        {
            ApiDataSource? result = null;
            try
            {
                result = ModuleExtensions.ExecuteMetaSQLPoco<ApiDataSource>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.GD04", new
                {
                    DataSourceID = dataSourceID
                });
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "OpenAPIClient/GetApiDataSource");
            }

            return result;
        }

        public List<ApiParameter>? GetApiParameters(string apiServiceID)
        {
            List<ApiParameter>? result = null;
            try
            {
                result = ModuleExtensions.ExecuteMetaSQLPocos<ApiParameter>(dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.LD01", new
                {
                    APIServiceID = apiServiceID
                });
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "OpenAPIClient/GetApiDataSource");
            }

            return result;
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

        private object? GetDbParameterMap(string parameterName, Dictionary<string, object?> dynamicParameters)
        {
            object? result = null;

            if (dynamicParameters != null)
            {
                var maps = from p in dynamicParameters
                           where p.Key == GetParameterName(parameterName)
                           select p;

                if (maps.Count() > 0)
                {
                    foreach (var item in maps)
                    {
                        result = item.Value;
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

        private void SetDbParameterMapping(List<ApiParameter> apiParameters, Dictionary<string, object?> parameters, dynamic dynamicParameters)
        {
            foreach (var apiParameter in apiParameters)
            {
                var parameterValue = GetDbParameterMap(apiParameter.ParameterID, parameters);

                if (parameterValue == null)
                {
                    continue;
                }

                var dbType = (DbType)Enum.Parse(typeof(DbType), string.IsNullOrEmpty(apiParameter.ParameterType) == true ? "String" : apiParameter.ParameterType);

                if (dbType == DbType.String)
                {
                    if (parameterValue == null)
                    {
                        if (apiParameter.DefaultValue == "NULL")
                        {
                            parameterValue = DBNull.Value;
                        }
                        else if (string.IsNullOrEmpty(apiParameter.DefaultValue) == false)
                        {
                            parameterValue = apiParameter.DefaultValue;
                        }
                        else
                        {
                            parameterValue = "";
                        }
                    }
                }
                else
                {
                    if (parameterValue == null || parameterValue.ToStringSafe() == "")
                    {
                        if (apiParameter.DefaultValue == "NULL")
                        {
                            parameterValue = DBNull.Value;
                        }
                        else if (string.IsNullOrEmpty(apiParameter.DefaultValue) == false)
                        {
                            parameterValue = apiParameter.DefaultValue;
                        }
                    }
                }

                int.TryParse(apiParameter.Length.ToString(), out var parameterLength);
                dynamicParameters.Add(
                    apiParameter.ParameterID,
                    parameterValue,
                    dbType,
                    (ParameterDirection)Enum.Parse(typeof(ParameterDirection), "Input"),
                    apiParameter.Length <= 0 ? -1 : parameterLength
                );
            }
        }

        private string GetModuleTransactionID()
        {
            var result = string.Empty;
            switch (dataProvider)
            {
                case DataProviders.SqlServer:
                    result = "SQS010";
                    break;
                case DataProviders.Oracle:
                    result = "ORA010";
                    break;
                case DataProviders.MySQL:
                    result = "MYS010";
                    break;
                case DataProviders.PostgreSQL:
                    result = "PGS010";
                    break;
                case DataProviders.SQLite:
                    result = "SLT010";
                    break;
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
    }
}
