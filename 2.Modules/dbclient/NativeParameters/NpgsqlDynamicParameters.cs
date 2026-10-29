using System.Collections.Generic;
using System.Data;

using Dapper;

using dbclient.Profiler;

using HandStack.Data.ExtensionMethod;

using Npgsql;

using NpgsqlTypes;

namespace dbclient.NativeParameters
{
    public class NpgsqlDynamicParameters : SqlMapper.IDynamicParameters
    {
        public readonly DynamicParameters dynamicParameters = new();
        public readonly List<NpgsqlParameter> npgsqlParameters = [];

        public void Add(string name, object? value = null, NpgsqlDbType npgsqlDbType = NpgsqlDbType.Varchar, ParameterDirection direction = ParameterDirection.Input, int? size = null)
        {
            var npgsqlParameter = new NpgsqlParameter(name, npgsqlDbType)
            {
                Value = value,
                Direction = direction
            };
            npgsqlParameter.SetParameterSize(size);
            npgsqlParameters.Add(npgsqlParameter);
        }

        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            ((SqlMapper.IDynamicParameters)dynamicParameters).AddParameters(command, identity);

            dynamic? dynamicCommand = command as NpgsqlCommand;
            dynamicCommand ??= command as ProfilerDbCommand;

            dynamicCommand?.Parameters.AddRange(npgsqlParameters.ToArray());
        }
    }
}
