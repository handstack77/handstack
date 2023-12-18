using System.Collections.Generic;
using System.Data;
using System.Text;

using Dapper;

using dbclient.Profiler;

using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;

namespace dbclient.NativeParameters
{
    /*
		OracleDynamicParameters dynamicParameters = new OracleDynamicParameters();
		dynamicParameters.Add(":RC1", null, OracleDbType.RefCursor, ParameterDirection.Output);
		dynamicParameters.Add(":RC2", null, OracleDbType.RefCursor, ParameterDirection.Output);
		dynamicParameters.Add(":GROUPCODE", "APS10", OracleDbType.Varchar2, ParameterDirection.Input);
     */
    public class OracleDynamicParameters : SqlMapper.IDynamicParameters
    {
        public readonly DynamicParameters dynamicParameters = new DynamicParameters();
        public readonly List<OracleParameter> oracleParameters = new List<OracleParameter>();

        public void Add(string name, object? value = null, OracleDbType oracleDbType = OracleDbType.Varchar2, ParameterDirection direction = ParameterDirection.Input, int? size = null)
        {
            OracleParameter oracleParameter;
            if (size.HasValue)
            {
                if (size.Value <= 0)
                {
                    oracleParameter = new OracleParameter(name, oracleDbType, value, direction);
                }
                else
                {
                    oracleParameter = new OracleParameter(name, oracleDbType, size.Value, value, direction);
                }
            }
            else
            {
                oracleParameter = new OracleParameter(name, oracleDbType, value, direction);
            }

            oracleParameters.Add(oracleParameter);
        }

        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            ((SqlMapper.IDynamicParameters)dynamicParameters).AddParameters(command, identity);

            dynamic? dynamicCommand = command as OracleCommand;
            if (dynamicCommand == null)
            {
                dynamicCommand = command as ProfilerDbCommand;
            }

            if (dynamicCommand != null)
            {
                dynamicCommand.Parameters.AddRange(oracleParameters.ToArray());
            }
        }
    }

    // connection.Execute("INSERT INTO MESSAGES VALUES (:id, :text)", new {id = 1, text = new OracleClobParameter("my large text") });
    public class OracleClobParameter : SqlMapper.ICustomQueryParameter
    {
        private readonly string? value;

        public OracleClobParameter(object? value)
        {
            this.value = value == null ? null : value.ToString();
        }

        public void AddParameter(IDbCommand command, string name)
        {
            var clob = new OracleClob(command.Connection as OracleConnection);
            var param = new OracleParameter(name, OracleDbType.Clob);
            if (string.IsNullOrEmpty(value) == false)
            {
                var bytes = Encoding.Unicode.GetBytes(value);
                var length = bytes.Length;

                int pos = 0;
                int chunkSize = 1024;

                while (pos < length)
                {
                    chunkSize = chunkSize > (length - pos) ? chunkSize = length - pos : chunkSize;
                    clob.Write(bytes, pos, chunkSize);
                    pos += chunkSize;
                }

                param.Value = clob;
            }

            command.Parameters.Add(param);
        }

        public OracleClob GetClobValue(IDbConnection? connection)
        {
            var clob = new OracleClob(connection as OracleConnection);
            if (string.IsNullOrEmpty(value) == false)
            {
                var bytes = Encoding.Unicode.GetBytes(value);
                var length = bytes.Length;

                int pos = 0;
                int chunkSize = 1024;

                while (pos < length)
                {
                    chunkSize = chunkSize > (length - pos) ? chunkSize = length - pos : chunkSize;
                    clob.Write(bytes, pos, chunkSize);
                    pos += chunkSize;
                }
            }

            return clob;
        }
    }
}
