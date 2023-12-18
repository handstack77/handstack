using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

using Dapper;

using dbclient.Profiler;

namespace dbclient.NativeParameters
{
    public class SqlServerDynamicParameters : SqlMapper.IDynamicParameters
    {
        public readonly DynamicParameters dynamicParameters = new DynamicParameters();
        public readonly List<SqlParameter> sqlParameters = new List<SqlParameter>();

        public void Add(string name, object? value = null, SqlDbType sqlDbType = SqlDbType.VarChar, ParameterDirection direction = ParameterDirection.Input, int? size = null)
        {
            SqlParameter sqlParameter;
            if (size.HasValue)
            {
                if (size.Value <= 0)
                {
                    sqlParameter = new SqlParameter(name, sqlDbType);
                    sqlParameter.Value = value;
                    sqlParameter.Direction = direction;
                }
                else
                {
                    sqlParameter = new SqlParameter(name, sqlDbType);
                    sqlParameter.Value = value;
                    sqlParameter.Direction = direction;
                    sqlParameter.Size = size.Value;
                }
            }
            else
            {
                sqlParameter = new SqlParameter(name, sqlDbType);
                sqlParameter.Value = value;
                sqlParameter.Direction = direction;
            }

            sqlParameters.Add(sqlParameter);
        }

        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            ((SqlMapper.IDynamicParameters)dynamicParameters).AddParameters(command, identity);

            dynamic? dynamicCommand = command as SqlCommand;
            if (dynamicCommand == null)
            {
                dynamicCommand = command as ProfilerDbCommand;
            }

            if (dynamicCommand != null)
            {
                dynamicCommand.Parameters.AddRange(sqlParameters.ToArray());
            }
        }
    }
}
