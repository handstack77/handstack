using System;

using HandStack.Data.Client;
using HandStack.Data.Enumeration;
using HandStack.Data.ExtensionMethod;
using HandStack.Web;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

namespace checkup.Extensions
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
        public static dynamic? ExecuteMetaSQL(ReturnType returnType, string queryID, object? parameters = null)
        {
            dynamic? result = null;
            var paths = queryID.Split(".");
            if (paths.Length == 3)
            {
                try
                {
                    string? parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);
                    var sqlMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, GlobalConfiguration.ApplicationID, paths[0], paths[1], paths[2], parseParameters);
                    if (sqlMeta != null)
                    {
                        JObject? adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                        string commandText = sqlMeta.Item1;
                        commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                        using (SQLiteClient sqliteClient = new SQLiteClient(ModuleConfiguration.ConnectionString))
                        {
                            switch (returnType)
                            {
                                case ReturnType.NonQuery:
                                    result = sqliteClient.ExecuteNonQuery(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.Scalar:
                                    result = sqliteClient.ExecuteScalar(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataSet:
                                    result = sqliteClient.ExecuteDataSet(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataReader:
                                    result = sqliteClient.ExecuteReader(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.Dynamic:
                                    result = sqliteClient.ExecuteDynamic(commandText, sqlMeta.Item2);
                                    break;
                            }
                        }
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, "[{LogCategory}] " + $"returnType: {returnType}, queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                    throw;
                }
            }

            return result;
        }

        public static dynamic? TenantAppExecuteMetaSQL(string connectionString, ReturnType returnType, string queryID, object? parameters = null)
        {
            dynamic? result = null;
            var paths = queryID.Split(".");
            if (paths.Length == 3)
            {
                try
                {
                    string? parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);
                    var sqlMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, GlobalConfiguration.ApplicationID, paths[0], paths[1], paths[2], parseParameters);
                    if (sqlMeta != null)
                    {
                        JObject? adHocParameters = parseParameters == null ? null : JObject.Parse(parseParameters);
                        string commandText = sqlMeta.Item1;
                        commandText = DatabaseExtensions.RecursiveParameters(commandText, adHocParameters, "", false);

                        using (SQLiteClient sqliteClient = new SQLiteClient(connectionString))
                        {
                            switch (returnType)
                            {
                                case ReturnType.NonQuery:
                                    result = sqliteClient.ExecuteNonQuery(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.Scalar:
                                    result = sqliteClient.ExecuteScalar(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataSet:
                                    result = sqliteClient.ExecuteDataSet(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataReader:
                                    result = sqliteClient.ExecuteReader(commandText, sqlMeta.Item2);
                                    break;
                                case ReturnType.Dynamic:
                                    result = sqliteClient.ExecuteDynamic(commandText, sqlMeta.Item2);
                                    break;
                            }
                        }
                    }
                }
                catch (Exception exception)
                {
                    Log.Error(exception, "[{LogCategory}] " + $"returnType: {returnType}, queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                    throw;
                }
            }

            return result;
        }
    }
}
