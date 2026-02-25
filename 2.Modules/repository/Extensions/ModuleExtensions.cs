using System;
using System.Collections.Generic;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Client;
using HandStack.Data.Enumeration;
using HandStack.Data.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;

using Newtonsoft.Json;

using repository.Entity;

using Serilog;

namespace repository.Extensions
{
    public static class ModuleExtensions
    {
        /*
        var dynamicFiles = ModuleExtensions.ExecuteMetaSQL(ReturnType.Dynamic, repository, "STR.SLT010.LD01", new
        {
            ApplicationID = applicationID,
            RepositoryNo = repositoryID,
            DependencyID = dependencyID
        });

        if (dynamicFiles != null)
        {
            foreach (var item in dynamicFiles)
            {
            }
        }
         */
        public static dynamic? ExecuteMetaSQL(ReturnType returnType, Repository repository, string queryID, object? parameters = null)
        {
            dynamic? result = null;

            if (string.IsNullOrWhiteSpace(repository.SQLiteConnectionString))
            {
                Log.Warning("[{LogCategory}] " + $"applicationID: {repository.ApplicationID}, repository: {repository.RepositoryID} SQLite 연결문자열 확인 필요", "ModuleExtensions/ExecuteMetaSQL");
            }
            else
            {
                var paths = queryID.Split(".");
                if (paths.Length == 3)
                {
                    try
                    {
                        var parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);
                        var sqlMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, GlobalConfiguration.ApplicationID, paths[0], paths[1], paths[2], parseParameters);
                        if (sqlMeta != null)
                        {
                            var connectionString = repository.SQLiteConnectionString;
                            if (connectionString.IndexOf("{appBasePath}") > -1)
                            {
                                var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, repository.UserWorkID.ToStringSafe(), repository.ApplicationID);
                                connectionString = connectionString.Replace("{appBasePath}", appBasePath);
                            }

                            using var sqliteClient = new SQLiteClient(connectionString);
                            switch (returnType)
                            {
                                case ReturnType.NonQuery:
                                    result = sqliteClient.ExecuteNonQuery(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                                case ReturnType.Scalar:
                                    result = sqliteClient.ExecuteScalar(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataSet:
                                    result = sqliteClient.ExecuteDataSet(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                                case ReturnType.DataReader:
                                    result = sqliteClient.ExecuteReader(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                                case ReturnType.Dynamic:
                                    result = sqliteClient.ExecuteDynamic(sqlMeta.Item1, sqlMeta.Item2);
                                    break;
                            }
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[{LogCategory}] " + $"returnType: {returnType}, queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                    }
                }
            }

            return result;
        }

        public static List<T>? ExecuteMetaSQL<T>(Repository repository, string queryID, object? parameters = null)
        {
            List<T>? result = null;

            if (string.IsNullOrWhiteSpace(repository.SQLiteConnectionString))
            {
                Log.Warning("[{LogCategory}] " + $"applicationID: {repository.ApplicationID}, repository: {repository.RepositoryID} SQLite 연결문자열 확인 필요", "ModuleExtensions/ExecuteMetaSQL");
            }
            else
            {
                var paths = queryID.Split(".");
                if (paths.Length == 3)
                {
                    try
                    {
                        var parseParameters = parameters == null ? null : JsonConvert.SerializeObject(parameters);
                        var sqlMeta = DatabaseExtensions.GetSQLiteMetaSQL(ModuleConfiguration.DatabaseContractPath, GlobalConfiguration.ApplicationID, paths[0], paths[1], paths[2], parseParameters);
                        if (sqlMeta != null)
                        {
                            var connectionString = repository.SQLiteConnectionString;
                            if (connectionString.IndexOf("{appBasePath}") > -1)
                            {
                                var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, repository.UserWorkID.ToStringSafe(), repository.ApplicationID);
                                connectionString = connectionString.Replace("{appBasePath}", appBasePath);
                            }

                            using var sqliteClient = new SQLiteClient(connectionString);
                            result = sqliteClient.ExecutePocoMappings<T>(sqlMeta.Item1, sqlMeta.Item2);
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[{LogCategory}] " + $"queryID: {queryID}, parameters: {parameters}", "ModuleExtensions/ExecuteMetaSQL");
                    }
                }
            }

            return result;
        }
    }
}

