using System;
using System.Collections.Generic;

using HandStack.Data;
using HandStack.Data.Client;
using HandStack.Data.Enumeration;
using HandStack.Data.ExtensionMethod;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using openapi.Entity;

using Serilog;

namespace openapi.Extensions
{
    public static class ModuleExtensions
    {
        /*
        var scalarResults = ModuleExtensions.ExecuteMetaSQL(ReturnType.Scalar, "SYS.USR010.GD01", new
        {
            PersonID = userID,
        });

        if (scalarResults == null)
        {
            errorText = "SYS.USR010.GD01 확인 필요";
            logger.Error("[{LogCategory}] " + $"{ModuleConfiguration.DatabaseContractPath}: ${errorText}", "AccountController/Email");
            result = Ok(errorText);
        }
        else
        {
            existUser = scalarResults.ToString();
        }
         */
        public static dynamic? ExecuteApiServiceSQL(ReturnType returnType, string dataSourceID, string applicationID, string queryID, object? parameters = null)
        {
            dynamic? result = null;
            var paths = queryID.Split(".");
            if (paths.Length == 3)
            {
                try
                {
                    var dataSource = ModuleConfiguration.ApiDataSource.Find(p => p.DataSourceID == dataSourceID);
                    if (dataSource != null)
                    {
                        var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), dataSource.DataProvider);
                        var connectionString = dataSource.ConnectionString;
                        var parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);

                        switch (dataProvider)
                        {
                            case DataProviders.SqlServer:
                                var sqlServerMeta = DatabaseExtensions.GetSqlClientMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                                if (sqlServerMeta != null)
                                {
                                    var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                    var commandText = sqlServerMeta.Item1;
                                    commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                    using var sqlServerClient = new SqlServerClient(connectionString);
                                    switch (returnType)
                                    {
                                        case ReturnType.NonQuery:
                                            result = sqlServerClient.ExecuteNonQuery(commandText, sqlServerMeta.Item2);
                                            break;
                                        case ReturnType.Scalar:
                                            result = sqlServerClient.ExecuteScalar(commandText, sqlServerMeta.Item2);
                                            break;
                                        case ReturnType.DataSet:
                                            result = sqlServerClient.ExecuteDataSet(commandText, sqlServerMeta.Item2);
                                            break;
                                        case ReturnType.DataReader:
                                            result = sqlServerClient.ExecuteReader(commandText, sqlServerMeta.Item2);
                                            break;
                                        case ReturnType.Dynamic:
                                            result = sqlServerClient.ExecuteDynamic(commandText, sqlServerMeta.Item2);
                                            break;
                                    }
                                }
                                break;
                            case DataProviders.Oracle:
                                var oracleMeta = DatabaseExtensions.GetOracleMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                                if (oracleMeta != null)
                                {
                                    var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                    var commandText = oracleMeta.Item1;
                                    commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                    using var oracleClient = new OracleClient(connectionString);
                                    switch (returnType)
                                    {
                                        case ReturnType.NonQuery:
                                            result = oracleClient.ExecuteNonQuery(commandText, oracleMeta.Item2);
                                            break;
                                        case ReturnType.Scalar:
                                            result = oracleClient.ExecuteScalar(commandText, oracleMeta.Item2);
                                            break;
                                        case ReturnType.DataSet:
                                            result = oracleClient.ExecuteDataSet(commandText, oracleMeta.Item2);
                                            break;
                                        case ReturnType.DataReader:
                                            result = oracleClient.ExecuteReader(commandText, oracleMeta.Item2);
                                            break;
                                        case ReturnType.Dynamic:
                                            result = oracleClient.ExecuteDynamic(commandText, oracleMeta.Item2);
                                            break;
                                    }
                                }
                                break;
                            case DataProviders.MySQL:
                                var mySqlMeta = DatabaseExtensions.GetMySqlMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                                if (mySqlMeta != null)
                                {
                                    var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                    var commandText = mySqlMeta.Item1;
                                    commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                    using var mySqlClient = new MySqlClient(connectionString);
                                    switch (returnType)
                                    {
                                        case ReturnType.NonQuery:
                                            result = mySqlClient.ExecuteNonQuery(commandText, mySqlMeta.Item2);
                                            break;
                                        case ReturnType.Scalar:
                                            result = mySqlClient.ExecuteScalar(commandText, mySqlMeta.Item2);
                                            break;
                                        case ReturnType.DataSet:
                                            result = mySqlClient.ExecuteDataSet(commandText, mySqlMeta.Item2);
                                            break;
                                        case ReturnType.DataReader:
                                            result = mySqlClient.ExecuteReader(commandText, mySqlMeta.Item2);
                                            break;
                                        case ReturnType.Dynamic:
                                            result = mySqlClient.ExecuteDynamic(commandText, mySqlMeta.Item2);
                                            break;
                                    }
                                }
                                break;
                            case DataProviders.PostgreSQL:
                                var postgreSqlMeta = DatabaseExtensions.GetPostreSqlMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                                if (postgreSqlMeta != null)
                                {
                                    var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                    var commandText = postgreSqlMeta.Item1;
                                    commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                    using var postgreSqlClient = new PostgreSqlClient(connectionString);
                                    switch (returnType)
                                    {
                                        case ReturnType.NonQuery:
                                            result = postgreSqlClient.ExecuteNonQuery(commandText, postgreSqlMeta.Item2);
                                            break;
                                        case ReturnType.Scalar:
                                            result = postgreSqlClient.ExecuteScalar(commandText, postgreSqlMeta.Item2);
                                            break;
                                        case ReturnType.DataSet:
                                            result = postgreSqlClient.ExecuteDataSet(commandText, postgreSqlMeta.Item2);
                                            break;
                                        case ReturnType.DataReader:
                                            result = postgreSqlClient.ExecuteReader(commandText, postgreSqlMeta.Item2);
                                            break;
                                        case ReturnType.Dynamic:
                                            result = postgreSqlClient.ExecuteDynamic(commandText, postgreSqlMeta.Item2);
                                            break;
                                    }
                                }
                                break;
                            case DataProviders.SQLite:
                                var sqliteMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                                if (sqliteMeta != null)
                                {
                                    var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                    var commandText = sqliteMeta.Item1;
                                    commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                    using var sqlLiteClient = new SQLiteClient(connectionString);
                                    switch (returnType)
                                    {
                                        case ReturnType.NonQuery:
                                            result = sqlLiteClient.ExecuteNonQuery(commandText, sqliteMeta.Item2);
                                            break;
                                        case ReturnType.Scalar:
                                            result = sqlLiteClient.ExecuteScalar(commandText, sqliteMeta.Item2);
                                            break;
                                        case ReturnType.DataSet:
                                            result = sqlLiteClient.ExecuteDataSet(commandText, sqliteMeta.Item2);
                                            break;
                                        case ReturnType.DataReader:
                                            result = sqlLiteClient.ExecuteReader(commandText, sqliteMeta.Item2);
                                            break;
                                        case ReturnType.Dynamic:
                                            result = sqlLiteClient.ExecuteDynamic(commandText, sqliteMeta.Item2);
                                            break;
                                    }
                                }
                                break;
                        }
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, "[{LogCategory}] " + $"returnType: {returnType}, queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                }
            }

            return result;
        }

        public static dynamic? ExecuteMetaSQL(ReturnType returnType, DataProviders dataProvider, string applicationID, string queryID, object? parameters = null)
        {
            dynamic? result = null;
            var paths = queryID.Split(".");
            if (paths.Length == 3)
            {
                try
                {
                    var parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);

                    switch (dataProvider)
                    {
                        case DataProviders.SqlServer:
                            var sqlServerMeta = DatabaseExtensions.GetSqlClientMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (sqlServerMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = sqlServerMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var sqlServerClient = new SqlServerClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                switch (returnType)
                                {
                                    case ReturnType.NonQuery:
                                        result = sqlServerClient.ExecuteNonQuery(commandText, sqlServerMeta.Item2);
                                        break;
                                    case ReturnType.Scalar:
                                        result = sqlServerClient.ExecuteScalar(commandText, sqlServerMeta.Item2);
                                        break;
                                    case ReturnType.DataSet:
                                        result = sqlServerClient.ExecuteDataSet(commandText, sqlServerMeta.Item2);
                                        break;
                                    case ReturnType.DataReader:
                                        result = sqlServerClient.ExecuteReader(commandText, sqlServerMeta.Item2);
                                        break;
                                    case ReturnType.Dynamic:
                                        result = sqlServerClient.ExecuteDynamic(commandText, sqlServerMeta.Item2);
                                        break;
                                }
                            }
                            break;
                        case DataProviders.Oracle:
                            var oracleMeta = DatabaseExtensions.GetOracleMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (oracleMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = oracleMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var oracleClient = new OracleClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                switch (returnType)
                                {
                                    case ReturnType.NonQuery:
                                        result = oracleClient.ExecuteNonQuery(commandText, oracleMeta.Item2);
                                        break;
                                    case ReturnType.Scalar:
                                        result = oracleClient.ExecuteScalar(commandText, oracleMeta.Item2);
                                        break;
                                    case ReturnType.DataSet:
                                        result = oracleClient.ExecuteDataSet(commandText, oracleMeta.Item2);
                                        break;
                                    case ReturnType.DataReader:
                                        result = oracleClient.ExecuteReader(commandText, oracleMeta.Item2);
                                        break;
                                    case ReturnType.Dynamic:
                                        result = oracleClient.ExecuteDynamic(commandText, oracleMeta.Item2);
                                        break;
                                }
                            }
                            break;
                        case DataProviders.MySQL:
                            var mySqlMeta = DatabaseExtensions.GetMySqlMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (mySqlMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = mySqlMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var mySqlClient = new MySqlClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                switch (returnType)
                                {
                                    case ReturnType.NonQuery:
                                        result = mySqlClient.ExecuteNonQuery(commandText, mySqlMeta.Item2);
                                        break;
                                    case ReturnType.Scalar:
                                        result = mySqlClient.ExecuteScalar(commandText, mySqlMeta.Item2);
                                        break;
                                    case ReturnType.DataSet:
                                        result = mySqlClient.ExecuteDataSet(commandText, mySqlMeta.Item2);
                                        break;
                                    case ReturnType.DataReader:
                                        result = mySqlClient.ExecuteReader(commandText, mySqlMeta.Item2);
                                        break;
                                    case ReturnType.Dynamic:
                                        result = mySqlClient.ExecuteDynamic(commandText, mySqlMeta.Item2);
                                        break;
                                }
                            }
                            break;
                        case DataProviders.PostgreSQL:
                            var postgreSqlMeta = DatabaseExtensions.GetPostreSqlMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (postgreSqlMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = postgreSqlMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var postgreSqlClient = new PostgreSqlClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                switch (returnType)
                                {
                                    case ReturnType.NonQuery:
                                        result = postgreSqlClient.ExecuteNonQuery(commandText, postgreSqlMeta.Item2);
                                        break;
                                    case ReturnType.Scalar:
                                        result = postgreSqlClient.ExecuteScalar(commandText, postgreSqlMeta.Item2);
                                        break;
                                    case ReturnType.DataSet:
                                        result = postgreSqlClient.ExecuteDataSet(commandText, postgreSqlMeta.Item2);
                                        break;
                                    case ReturnType.DataReader:
                                        result = postgreSqlClient.ExecuteReader(commandText, postgreSqlMeta.Item2);
                                        break;
                                    case ReturnType.Dynamic:
                                        result = postgreSqlClient.ExecuteDynamic(commandText, postgreSqlMeta.Item2);
                                        break;
                                }
                            }
                            break;
                        case DataProviders.SQLite:
                            var sqliteMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (sqliteMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = sqliteMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var sqlLiteClient = new SQLiteClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                switch (returnType)
                                {
                                    case ReturnType.NonQuery:
                                        result = sqlLiteClient.ExecuteNonQuery(commandText, sqliteMeta.Item2);
                                        break;
                                    case ReturnType.Scalar:
                                        result = sqlLiteClient.ExecuteScalar(commandText, sqliteMeta.Item2);
                                        break;
                                    case ReturnType.DataSet:
                                        result = sqlLiteClient.ExecuteDataSet(commandText, sqliteMeta.Item2);
                                        break;
                                    case ReturnType.DataReader:
                                        result = sqlLiteClient.ExecuteReader(commandText, sqliteMeta.Item2);
                                        break;
                                    case ReturnType.Dynamic:
                                        result = sqlLiteClient.ExecuteDynamic(commandText, sqliteMeta.Item2);
                                        break;
                                }
                            }
                            break;
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, "[{LogCategory}] " + $"returnType: {returnType}, queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                }
            }

            return result;
        }

        public static T? ExecuteMetaSQLPoco<T>(DataProviders dataProvider, string applicationID, string queryID, object? parameters = null)
        {
            var result = default(T);
            var paths = queryID.Split(".");
            if (paths.Length == 3)
            {
                try
                {
                    var parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);

                    switch (dataProvider)
                    {
                        case DataProviders.SqlServer:
                            var sqlServerMeta = DatabaseExtensions.GetSqlClientMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (sqlServerMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = sqlServerMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var sqlServerClient = new SqlServerClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = sqlServerClient.ExecutePocoMapping<T>(commandText, sqlServerMeta.Item2);
                            }
                            break;
                        case DataProviders.Oracle:
                            var oracleMeta = DatabaseExtensions.GetOracleMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (oracleMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = oracleMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var oracleClient = new OracleClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = oracleClient.ExecutePocoMapping<T>(commandText, oracleMeta.Item2);
                            }
                            break;
                        case DataProviders.MySQL:
                            var mySqlMeta = DatabaseExtensions.GetMySqlMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (mySqlMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = mySqlMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var mySqlClient = new MySqlClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = mySqlClient.ExecutePocoMapping<T>(commandText, mySqlMeta.Item2);
                            }
                            break;
                        case DataProviders.PostgreSQL:
                            var postgreSqlMeta = DatabaseExtensions.GetPostreSqlMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (postgreSqlMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = postgreSqlMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var postgreSqlClient = new PostgreSqlClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = postgreSqlClient.ExecutePocoMapping<T>(commandText, postgreSqlMeta.Item2);
                            }
                            break;
                        case DataProviders.SQLite:
                            var sqliteMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (sqliteMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = sqliteMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var sqlLiteClient = new SQLiteClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = sqlLiteClient.ExecutePocoMapping<T>(commandText, sqliteMeta.Item2);
                            }
                            break;
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, "[{LogCategory}] " + $"queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                }
            }

            return result;
        }

        public static List<T>? ExecuteMetaSQLPocos<T>(DataProviders dataProvider, string applicationID, string queryID, object? parameters = null)
        {
            List<T>? result = null;
            var paths = queryID.Split(".");
            if (paths.Length == 3)
            {
                try
                {
                    var parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);

                    switch (dataProvider)
                    {
                        case DataProviders.SqlServer:
                            var sqlServerMeta = DatabaseExtensions.GetSqlClientMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (sqlServerMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = sqlServerMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var sqlServerClient = new SqlServerClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = sqlServerClient.ExecutePocoMappings<T>(commandText, sqlServerMeta.Item2);
                            }
                            break;
                        case DataProviders.Oracle:
                            var oracleMeta = DatabaseExtensions.GetOracleMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (oracleMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = oracleMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var oracleClient = new OracleClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = oracleClient.ExecutePocoMappings<T>(commandText, oracleMeta.Item2);
                            }
                            break;
                        case DataProviders.MySQL:
                            var mySqlMeta = DatabaseExtensions.GetMySqlMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (mySqlMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = mySqlMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var mySqlClient = new MySqlClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = mySqlClient.ExecutePocoMappings<T>(commandText, mySqlMeta.Item2);
                            }
                            break;
                        case DataProviders.PostgreSQL:
                            var postgreSqlMeta = DatabaseExtensions.GetPostreSqlMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (postgreSqlMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = postgreSqlMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var postgreSqlClient = new PostgreSqlClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = postgreSqlClient.ExecutePocoMappings<T>(commandText, postgreSqlMeta.Item2);
                            }
                            break;
                        case DataProviders.SQLite:
                            var sqliteMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, applicationID, paths[0], paths[1], paths[2], parseParameters);
                            if (sqliteMeta != null)
                            {
                                var adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                                var commandText = sqliteMeta.Item1;
                                commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                                using var sqlLiteClient = new SQLiteClient(ModuleConfiguration.ModuleDataSource.ConnectionString);
                                result = sqlLiteClient.ExecutePocoMappings<T>(commandText, sqliteMeta.Item2);
                            }
                            break;
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, "[{LogCategory}] " + $"queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                }
            }

            return result;
        }
    }
}
