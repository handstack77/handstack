using System.Collections.Generic;
using System.Data;

using Dapper;

using dbclient.Profiler;

using MySql.Data.MySqlClient;

namespace dbclient.NativeParameters
{
    public class MySqlDynamicParameters : SqlMapper.IDynamicParameters
    {
        public readonly DynamicParameters dynamicParameters = new DynamicParameters();
        public readonly List<MySqlParameter> mysqlParameters = new List<MySqlParameter>();

        public void Add(string name, object? value = null, MySqlDbType mysqlDbType = MySqlDbType.VarChar, ParameterDirection direction = ParameterDirection.Input, int? size = null)
        {
            MySqlParameter mysqlParameter;
            if (size.HasValue)
            {
                if (size.Value <= 0)
                {
                    mysqlParameter = new MySqlParameter(name, mysqlDbType);
                    mysqlParameter.Value = value;
                    mysqlParameter.Direction = direction;
                }
                else
                {
                    mysqlParameter = new MySqlParameter(name, mysqlDbType);
                    mysqlParameter.Value = value;
                    mysqlParameter.Direction = direction;
                    mysqlParameter.Size = size.Value;
                }
            }
            else
            {
                mysqlParameter = new MySqlParameter(name, mysqlDbType);
                mysqlParameter.Value = value;
                mysqlParameter.Direction = direction;
            }

            mysqlParameters.Add(mysqlParameter);
        }

        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            ((SqlMapper.IDynamicParameters)dynamicParameters).AddParameters(command, identity);

            dynamic? dynamicCommand = command as MySqlCommand;
            if (dynamicCommand == null)
            {
                dynamicCommand = command as ProfilerDbCommand;
            }

            if (dynamicCommand != null)
            {
                dynamicCommand.Parameters.AddRange(mysqlParameters.ToArray());
            }
        }
    }
}
