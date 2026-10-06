using System.Collections.Generic;
using System.Data;

using Dapper;

using dbclient.Profiler;

using Microsoft.Data.SqlClient;

namespace dbclient.NativeParameters
{
    public class SqlServerDynamicParameters : SqlMapper.IDynamicParameters
    {
        public readonly DynamicParameters dynamicParameters = new();
        public readonly List<SqlParameter> sqlParameters = [];

        public void Add(string name, object? value = null, SqlDbType sqlDbType = SqlDbType.VarChar, ParameterDirection direction = ParameterDirection.Input, int? size = null)
        {
            SqlParameter sqlParameter;
            if (size.HasValue)
            {
                if (size.Value <= 0)
                {
                    sqlParameter = new SqlParameter(name, sqlDbType)
                    {
                        Value = value,
                        Direction = direction
                    };
                }
                else
                {
                    sqlParameter = new SqlParameter(name, sqlDbType)
                    {
                        Value = value,
                        Direction = direction,
                        Size = size.Value
                    };
                }
            }
            else
            {
                sqlParameter = new SqlParameter(name, sqlDbType)
                {
                    Value = value,
                    Direction = direction
                };
            }

            sqlParameters.Add(sqlParameter);
        }

        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            ((SqlMapper.IDynamicParameters)dynamicParameters).AddParameters(command, identity);

            dynamic? dynamicCommand = command as SqlCommand;
            dynamicCommand ??= command as ProfilerDbCommand;

            dynamicCommand?.Parameters.AddRange(sqlParameters.ToArray());
        }
    }
}
