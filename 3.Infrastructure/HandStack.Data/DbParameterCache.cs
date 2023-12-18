using System;
using System.Collections;
using System.Data;
using System.Data.Common;
using System.Reflection;

using Serilog;

namespace HandStack.Data
{
    public sealed class DbParameterCache
    {
        private static Hashtable parameterCache = Hashtable.Synchronized(new Hashtable());

        private static DbParameter[] CloneParameters(DbParameter[] parameters)
        {
            DbParameter[] discoveredParameters = new DbParameter[parameters.Length];

            parameters.CopyTo(discoveredParameters, 0);

            return discoveredParameters;
        }

        public static DbParameter[]? GetCachedParameterSet(DataProviders dataProviders, string procedureName)
        {
            DbParameter[]? cachedParameters = parameterCache[string.Concat(dataProviders.ToString(), ":", procedureName)] as DbParameter[];
            if (cachedParameters == null)
            {
                return null;
            }
            else
            {
                return CloneParameters(cachedParameters);
            }
        }

        public static void CacheParameterSet(DataProviders dataProviders, string procedureName, params DbParameter[] parameters)
        {
            parameterCache[string.Concat(dataProviders.ToString(), ":", procedureName)] = parameters;
        }

        public static DbParameter[] GetSpParameterSet(DataProviders dataProviders, string connectionString, string procedureName)
        {
            return GetSpParameterSet(dataProviders, connectionString, procedureName, false);
        }

        public static DbParameter[] GetSpParameterSet(DataProviders dataProviders, string connectionString, string procedureName, bool outputParameter)
        {
            string hashKey = string.Concat(dataProviders.ToString(), ":", procedureName, outputParameter == true ? ":OutputParameter" : "");
            DbParameter[]? cachedParameters = parameterCache[hashKey] as DbParameter[];
            if (cachedParameters == null)
            {
                cachedParameters = (DbParameter[])(parameterCache[hashKey] = DiscoverSpParameterSet(dataProviders, connectionString, procedureName, outputParameter));
            }

            return CloneParameters(cachedParameters);
        }

        private static DbParameter[] DiscoverSpParameterSet(DataProviders dataProviders, string connectionString, string procedureName, bool outputParameter)
        {
            DbParameter[] result = new DbParameter[0]; ;
            using (DatabaseFactory databaseFactory = new DatabaseFactory(connectionString, dataProviders))
            using (DbCommand? parameterCommand = databaseFactory.Command)
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

                    DbParameter[] DiscoveredParameters = new DbParameter[parameterCommand.Parameters.Count]; ;

                    parameterCommand.Parameters.CopyTo(DiscoveredParameters, 0);
                    parameterCommand.Parameters.Clear();
                    result = DiscoveredParameters;
                }
            }

            return result;
        }

        public static void DeriveParameters(DbProviderFactory providerFactory, IDbCommand dbCommand)
        {
            DbCommandBuilder? commandBuilder = providerFactory.CreateCommandBuilder();
            if (commandBuilder != null)
            {
                Type commandType = commandBuilder.GetType();
                MethodInfo? method = commandType.GetMethod("DeriveParameters", BindingFlags.Public | BindingFlags.Static);

                if (method != null)
                {
                    method.Invoke(null, new object[] { dbCommand });
                }
                else
                {
                    Log.Logger.Error("[{LogCategory}] 데이터베이스 제공자에서 Stored Procedre의 매개 변수 정보를 가져오는 기능을 지원 안함", "DbParameterCache/DeriveParameters");
                }
            }
        }
    }
}
