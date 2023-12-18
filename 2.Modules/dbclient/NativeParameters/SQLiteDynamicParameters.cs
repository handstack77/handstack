using System.Collections.Generic;
using System.Data;
using System.Data.SQLite;

using Dapper;

using dbclient.Profiler;

namespace dbclient.NativeParameters
{
    public class SQLiteDynamicParameters : SqlMapper.IDynamicParameters
    {
        public readonly DynamicParameters dynamicParameters = new DynamicParameters();
        public readonly List<SQLiteParameter> sqlliteParameters = new List<SQLiteParameter>();

        public void Add(string name, object? value = null, DbType sqlliteDbType = DbType.String, ParameterDirection direction = ParameterDirection.Input, int? size = null)
        {
            SQLiteParameter sqlliteParameter;
            if (size.HasValue)
            {
                if (size.Value <= 0)
                {
                    sqlliteParameter = new SQLiteParameter(name, sqlliteDbType);
                    sqlliteParameter.Value = value;
                    sqlliteParameter.Direction = direction;
                }
                else
                {
                    sqlliteParameter = new SQLiteParameter(name, sqlliteDbType);
                    sqlliteParameter.Value = value;
                    sqlliteParameter.Direction = direction;
                    sqlliteParameter.Size = size.Value;
                }
            }
            else
            {
                sqlliteParameter = new SQLiteParameter(name, sqlliteDbType);
                sqlliteParameter.Value = value;
                sqlliteParameter.Direction = direction;
            }

            sqlliteParameters.Add(sqlliteParameter);
        }

        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            ((SqlMapper.IDynamicParameters)dynamicParameters).AddParameters(command, identity);

            dynamic? dynamicCommand = command as SQLiteCommand;
            if (dynamicCommand == null)
            {
                dynamicCommand = command as ProfilerDbCommand;
            }

            if (dynamicCommand != null)
            {
                dynamicCommand.Parameters.AddRange(sqlliteParameters.ToArray());
            }
        }
    }
}
