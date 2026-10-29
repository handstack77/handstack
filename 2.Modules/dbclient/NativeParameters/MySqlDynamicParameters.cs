using System.Collections.Generic;
using System.Data;

using Dapper;

using dbclient.Profiler;

using HandStack.Data.ExtensionMethod;

using MySqlConnector;

namespace dbclient.NativeParameters
{
    public class MySqlDynamicParameters : SqlMapper.IDynamicParameters
    {
        public readonly DynamicParameters dynamicParameters = new();
        public readonly List<MySqlParameter> mysqlParameters = [];

        public void Add(string name, object? value = null, MySqlDbType mysqlDbType = MySqlDbType.VarChar, ParameterDirection direction = ParameterDirection.Input, int? size = null)
        {
            var mysqlParameter = new MySqlParameter(name, mysqlDbType)
            {
                Value = value,
                Direction = direction
            };
            mysqlParameter.SetParameterSize(size);
            mysqlParameters.Add(mysqlParameter);
        }

        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            ((SqlMapper.IDynamicParameters)dynamicParameters).AddParameters(command, identity);

            dynamic? dynamicCommand = command as MySqlCommand;
            dynamicCommand ??= command as ProfilerDbCommand;

            dynamicCommand?.Parameters.AddRange(mysqlParameters.ToArray());
        }
    }
}
