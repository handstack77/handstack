using System.Collections.Generic;
using System.Data;
using System.Data.SQLite;

using Dapper;

using dbclient.Profiler;

using HandStack.Data.ExtensionMethod;

namespace dbclient.NativeParameters
{
    public class SQLiteDynamicParameters : SqlMapper.IDynamicParameters
    {
        public readonly DynamicParameters dynamicParameters = new();
        public readonly List<SQLiteParameter> sqlliteParameters = [];

        public void Add(string name, object? value = null, DbType sqlliteDbType = DbType.String, ParameterDirection direction = ParameterDirection.Input, int? size = null)
        {
            var sqlliteParameter = new SQLiteParameter(name, sqlliteDbType)
            {
                Value = value,
                Direction = direction
            };
            sqlliteParameter.SetParameterSize(size);
            sqlliteParameters.Add(sqlliteParameter);
        }

        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            ((SqlMapper.IDynamicParameters)dynamicParameters).AddParameters(command, identity);

            dynamic? dynamicCommand = command as SQLiteCommand;
            dynamicCommand ??= command as ProfilerDbCommand;

            dynamicCommand?.Parameters.AddRange(sqlliteParameters.ToArray());
        }
    }
}
