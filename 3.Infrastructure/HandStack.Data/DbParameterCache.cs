using System;
using System.Collections.Concurrent;
using System.Data;
using System.Data.Common;
using System.Reflection;

using Serilog;

namespace HandStack.Data
{
    public sealed class DbParameterCache
    {
        private static readonly ConcurrentDictionary<string, DbParameter[]> parameterCache = new(StringComparer.Ordinal);

        private static DbParameter[] CloneParameters(DbParameter[] parameters)
        {
            var discoveredParameters = new DbParameter[parameters.Length];
            Array.Copy(parameters, discoveredParameters, parameters.Length);
            return discoveredParameters;
        }

        public static DbParameter[]? GetCachedParameterSet(DataProviders dataProviders, string procedureName)
        {
            if (!parameterCache.TryGetValue(CreateCacheKey(dataProviders, procedureName), out var cachedParameters))
            {
                return null;
            }

            return CloneParameters(cachedParameters);
        }

        public static void CacheParameterSet(DataProviders dataProviders, string procedureName, params DbParameter[] parameters)
        {
            parameterCache[CreateCacheKey(dataProviders, procedureName)] = parameters;
        }

        public static DbParameter[] GetSpParameterSet(DataProviders dataProviders, string connectionString, string procedureName)
        {
            return GetSpParameterSet(dataProviders, connectionString, procedureName, false);
        }

        public static DbParameter[] GetSpParameterSet(DataProviders dataProviders, string connectionString, string procedureName, bool outputParameter)
        {
            var hashKey = CreateCacheKey(dataProviders, procedureName, outputParameter);
            var cachedParameters = parameterCache.GetOrAdd(hashKey, _ => DiscoverSpParameterSet(dataProviders, connectionString, procedureName, outputParameter));
            return CloneParameters(cachedParameters);
        }

        private static DbParameter[] DiscoverSpParameterSet(DataProviders dataProviders, string connectionString, string procedureName, bool outputParameter)
        {
            var result = Array.Empty<DbParameter>();
            using (var databaseFactory = new DatabaseFactory(connectionString, dataProviders))
            using (var parameterCommand = databaseFactory.Command)
            {
                if (parameterCommand != null)
                {
                    databaseFactory.ConnectionOpen();
                    parameterCommand.CommandType = CommandType.StoredProcedure;
                    parameterCommand.CommandText = procedureName;

                    DeriveParameters(databaseFactory.SqlFactory, parameterCommand);

                    if (dataProviders == DataProviders.SqlServer && outputParameter == false)
                    {
                        parameterCommand.Parameters.RemoveAt(0);
                    }

                    var discoveredParameters = new DbParameter[parameterCommand.Parameters.Count];

                    parameterCommand.Parameters.CopyTo(discoveredParameters, 0);
                    parameterCommand.Parameters.Clear();
                    result = discoveredParameters;
                }
            }

            return result;
        }

        public static void DeriveParameters(DbProviderFactory providerFactory, IDbCommand dbCommand)
        {
            var commandBuilder = providerFactory.CreateCommandBuilder();
            if (commandBuilder != null)
            {
                var commandType = commandBuilder.GetType();
                var method = commandType.GetMethod("DeriveParameters", BindingFlags.Public | BindingFlags.Static);

                if (method != null)
                {
                    method.Invoke(null, [dbCommand]);
                }
                else
                {
                    Log.Logger.Error("[{LogCategory}] 데이터베이스 제공자에서 Stored Procedre의 매개 변수 정보를 가져오는 기능을 지원 안함", "DbParameterCache/DeriveParameters");
                }
            }
        }

        private static string CreateCacheKey(DataProviders dataProviders, string procedureName, bool outputParameter = false)
        {
            return outputParameter == true
                ? $"{dataProviders}:{procedureName}:OutputParameter"
                : $"{dataProviders}:{procedureName}";
        }
    }
}
