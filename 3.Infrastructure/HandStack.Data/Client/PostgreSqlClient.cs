using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Dynamic;
using System.Linq;

using HandStack.Core.ExtensionMethod;

using Npgsql;

using NpgsqlTypes;

namespace HandStack.Data.Client
{
    /// <code>
    ///   using (PostgreSqlClient dbClient = new PostgreSqlClient())
    ///   {
    ///       List<NpgsqlParameter> parameters = new List<NpgsqlParameter>();
    ///
    ///       parameters.Add(dbClient.CreateParameter(NpgsqlDbType.VarChar, "DicKey", "ChangeSetup"));
    ///
    ///       using (DataSet result = dbClient.ExecuteDataSet("GetSys_Dictionary", parameters))
    ///       {
    ///           // ......
    ///       }
    ///   }
    /// </code>
    public sealed class PostgreSqlClient : IDisposable
    {
        private string connectionString;

        public string ConnectionString
        {
            get { return connectionString; }
            set { connectionString = value; }
        }

        private DatabaseFactory databaseFactory;

        public DatabaseFactory DbFactory
        {
            get
            {
                return databaseFactory;
            }
        }

        private bool isDisposedResources = false;

        public bool isDeriveParameters = false;

        public bool IsDeriveParameters
        {
            get { return isDeriveParameters; }
            set { isDeriveParameters = value; }
        }

        public PostgreSqlClient(string connectionString)
        {
            this.connectionString = connectionString;

            databaseFactory = new DatabaseFactory(connectionString, DataProviders.PostgreSQL);
            if (databaseFactory.Connection != null && databaseFactory.Command != null)
            {
                databaseFactory.Command.CommandTimeout = databaseFactory.Connection.ConnectionTimeout;
            }
        }

        public void StatisticsEnabled()
        {
            databaseFactory.StatisticsEnabled();
        }

        public IDictionary? RetrieveStatistics()
        {
            return databaseFactory.RetrieveStatistics();
        }

        public NpgsqlParameter? CreateParameter(NpgsqlDbType toDbType, string parameterName, object value)
        {
            return CreateParameter(toDbType, parameterName, value, ParameterDirection.Input);
        }

        public NpgsqlParameter? CreateParameter(NpgsqlDbType toDbType, string parameterName, object value, ParameterDirection direction)
        {
            NpgsqlParameter? parameter = databaseFactory.Command?.CreateParameter() as NpgsqlParameter;
            if (parameter != null)
            {
                parameter.NpgsqlDbType = toDbType;
                parameter.Direction = direction;

                parameter.ParameterName = parameterName;
                parameter.Value = value;
            }
            return parameter;
        }

        public string ExecuteCommandText(string procedureName, List<NpgsqlParameter>? parameters)
        {
            string CommandParameters = "";

            if (parameters == null || parameters.Count == 0)
            {
                return string.Concat("exec ", procedureName, ";");
            }

            if (isDeriveParameters == true)
            {
                NpgsqlParameter[] parameterSet = GetSpParameterSet(procedureName);

                foreach (NpgsqlParameter parameter in parameterSet)
                {
                    if (SetDbParameterData(parameter, parameters) == true)
                    {
                        CommandParameters += string.Concat(parameter.ParameterName, "='", parameter.Value.ToStringSafe().Replace("'", "''"), "', ");
                    }
                }
            }
            else
            {
                foreach (NpgsqlParameter parameter in parameters)
                {
                    if (parameter.ParameterName.IndexOf("@") > -1)
                    {
                        CommandParameters += string.Concat(parameter.ParameterName, "='", parameter.Value.ToStringSafe().Replace("'", "''"), "', ");
                    }
                    else
                    {
                        CommandParameters += string.Concat("@", parameter.ParameterName, "='", parameter.Value.ToStringSafe().Replace("'", "''"), "', ");
                    }
                }
            }

            if (CommandParameters.Length > 0)
            {
                CommandParameters = CommandParameters.Substring(0, CommandParameters.Length - 2);
            }

            return string.Concat("exec ", procedureName, " ", CommandParameters, ";");
        }

        public DataSet? ExecuteDataSet(string commandText, CommandType dbCommandType, bool hasSchema = false)
        {
            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, hasSchema);
        }

        public DataSet? ExecuteDataSet(string commandText, CommandType dbCommandType, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string commandText, List<NpgsqlParameter>? parameters, CommandType dbCommandType, bool hasSchema = false)
        {
            if (parameters != null)
            {
                foreach (NpgsqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, hasSchema);
        }

        public DataSet? ExecuteDataSet(string commandText, List<NpgsqlParameter>? parameters, ExecutingConnectionState connectionState, CommandType dbCommandType, bool hasSchema = false)
        {
            if (parameters != null)
            {
                foreach (NpgsqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<NpgsqlParameter>? parameters, bool hasSchema = false)
        {
            return ExecuteDataSet(procedureName, parameters, ExecutingConnectionState.CloseOnExit, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<NpgsqlParameter>? parameters, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<NpgsqlParameter>? parameters, ExecutingConnectionState connectionState, out NpgsqlCommand? outputDbCommand, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            using (DataSet? result = databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema))
            {
                outputDbCommand = databaseFactory.OutputCommand as NpgsqlCommand;
                return result;
            }
        }

        public int ExecuteNonQuery(string commandText, CommandType dbCommandType)
        {
            return databaseFactory.ExecuteNonQuery(commandText, dbCommandType);
        }

        public int ExecuteNonQuery(string commandText, List<NpgsqlParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (NpgsqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteNonQuery(commandText, dbCommandType);
        }

        public int ExecuteNonQuery(string procedureName, List<NpgsqlParameter>? parameters)
        {
            return ExecuteNonQuery(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public int ExecuteNonQuery(string procedureName, List<NpgsqlParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
        }

        public int ExecuteNonQuery(string procedureName, List<NpgsqlParameter>? parameters, ExecutingConnectionState connectionState, out NpgsqlCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            int result = databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as NpgsqlCommand;

            return result;
        }

        public NpgsqlDataReader? ExecuteReader(string commandText, CommandType dbCommandType)
        {
            return ExecuteReader(commandText, null, dbCommandType) as NpgsqlDataReader;
        }

        public NpgsqlDataReader? ExecuteReader(string commandText, List<NpgsqlParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (NpgsqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteReader(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit) as NpgsqlDataReader;
        }

        public NpgsqlDataReader? ExecuteReader(string procedureName, List<NpgsqlParameter>? parameters)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteReader(procedureName, CommandType.Text, ExecutingConnectionState.CloseOnExit) as NpgsqlDataReader;
        }

        public T? ExecutePocoMapping<T>(string commandText, List<NpgsqlParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            T? results = default(T);
            if (parameters != null)
            {
                foreach (NpgsqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            using (var reader = databaseFactory.ExecuteReader(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit))
            {
                if (reader != null && reader.HasRows)
                {
                    reader.Read();
                    results = Activator.CreateInstance<T>();

                    List<string> columnNames = new List<string>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        columnNames.Add(reader.GetName(i));
                    }

                    if (results != null)
                    {
                        reader.ToObject(columnNames, results);
                    }
                }
            }

            return results;
        }

        public List<T>? ExecutePocoMappings<T>(string commandText, List<NpgsqlParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            List<T>? results = null;
            if (parameters != null)
            {
                foreach (NpgsqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            using (var reader = databaseFactory.ExecuteReader(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit))
            {
                if (reader != null && reader.HasRows)
                {
                    results = reader.ToObjectList<T>();
                }
            }

            return results;
        }

        public List<dynamic> ExecuteDynamic(string commandText, List<NpgsqlParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            List<dynamic> results = new List<dynamic>();
            if (parameters != null)
            {
                foreach (NpgsqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            using (var reader = databaseFactory.ExecuteReader(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit))
            {
                if (reader != null)
                {
                    var schemaTable = reader.GetSchemaTable();
                    if (schemaTable != null)
                    {
                        List<string> columnNames = new List<string>();
                        foreach (DataRow row in schemaTable.Rows)
                        {
                            columnNames.Add(row.GetStringSafe("ColumnName"));
                        }

                        while (reader.Read())
                        {
                            var data = new ExpandoObject() as IDictionary<string, object?>;
                            foreach (string columnName in columnNames)
                            {
                                var val = reader[columnName];
                                data.Add(columnName, Convert.IsDBNull(val) ? null : val);
                            }

                            results.Add((ExpandoObject)data);
                        }
                    }
                }
            }

            return results;
        }

        public object? ExecuteScalar(string commandText, CommandType dbCommandType)
        {
            return databaseFactory.ExecuteScalar(commandText, dbCommandType);
        }

        public object? ExecuteScalar(string commandText, List<NpgsqlParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (NpgsqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteScalar(commandText, dbCommandType);
        }

        public object? ExecuteScalar(string procedureName, List<NpgsqlParameter>? parameters)
        {
            return ExecuteScalar(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public object? ExecuteScalar(string procedureName, List<NpgsqlParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
        }

        public object? ExecuteScalar(string procedureName, List<NpgsqlParameter>? parameters, ExecutingConnectionState connectionState, out NpgsqlCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            object? result = databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as NpgsqlCommand;
            return result;
        }

        private NpgsqlParameter[] GetSpParameterSet(string procedureName)
        {
            DbParameter[] result = DbParameterCache.GetSpParameterSet(DataProviders.PostgreSQL, connectionString, procedureName);

            NpgsqlParameter[] parameters = new NpgsqlParameter[result.Length];

            for (int i = 0; i < result.Length; i++)
            {
                parameters[i] = (NpgsqlParameter)result[i];
            }

            return parameters;
        }

        private void SetDbFactoryCommand(string procedureName, List<NpgsqlParameter>? parameters)
        {
            if (isDeriveParameters == true)
            {
                if (parameters != null)
                {
                    NpgsqlParameter[] parameterSet = GetSpParameterSet(procedureName);

                    foreach (NpgsqlParameter parameter in parameterSet)
                    {
                        if (SetDbParameterData(parameter, parameters) == true)
                        {
                            databaseFactory.AddParameter(parameter);
                        }
                    }
                }
            }
            else
            {
                if (parameters != null)
                {
                    foreach (NpgsqlParameter parameter in parameters)
                    {
                        databaseFactory.AddParameter(parameter);
                    }
                }
            }
        }

        private bool SetDbParameterData(NpgsqlParameter parameter, List<NpgsqlParameter>? ListParameters)
        {
            if (ListParameters == null)
            {
                return false;
            }

            bool isMatchingParameter = false;
            object? dbValue = null;

            var result = from p in ListParameters
                         where p.ParameterName.Equals(parameter.ParameterName, StringComparison.CurrentCultureIgnoreCase)
                         select p;

            if (result.Count() > 0)
            {
                NpgsqlParameter? listParameter = null;
                foreach (NpgsqlParameter nvp in result)
                {
                    listParameter = nvp;
                    break;
                }

                dbValue = listParameter?.Value;
                isMatchingParameter = true;
            }
            else
            {
                switch (parameter.NpgsqlDbType)
                {
                    case NpgsqlDbType.Bigint:
                        dbValue = 0;
                        break;
                    case NpgsqlDbType.Double:
                        dbValue = 0;
                        break;
                    case NpgsqlDbType.Integer:
                        dbValue = 0;
                        break;
                    case NpgsqlDbType.Numeric:
                        dbValue = 0;
                        break;
                    case NpgsqlDbType.Real:
                        dbValue = 0;
                        break;
                    case NpgsqlDbType.Smallint:
                        dbValue = 0;
                        break;
                    case NpgsqlDbType.Money:
                        dbValue = 0;
                        break;
                    case NpgsqlDbType.Boolean:
                        dbValue = false;
                        break;
                    case NpgsqlDbType.Box:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Circle:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Line:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.LSeg:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Path:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Point:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Polygon:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Char:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.Text:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.Varchar:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.Name:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.Citext:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.InternalChar:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.Bytea:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Date:
                        dbValue = DateTime.Now;
                        break;
                    case NpgsqlDbType.Time:
                        dbValue = DateTime.Now;
                        break;
                    case NpgsqlDbType.Timestamp:
                        dbValue = DateTime.Now;
                        break;
                    case NpgsqlDbType.Interval:
                        dbValue = 0;
                        break;
                    case NpgsqlDbType.Inet:
                        dbValue = DateTime.Now;
                        break;
                    case NpgsqlDbType.Cidr:
                        dbValue = DateTime.Now;
                        break;
                    case NpgsqlDbType.MacAddr:
                        dbValue = DateTime.Now;
                        break;
                    case NpgsqlDbType.MacAddr8:
                        dbValue = DateTime.Now;
                        break;
                    case NpgsqlDbType.Bit:
                        dbValue = false;
                        break;
                    case NpgsqlDbType.Varbit:
                        dbValue = false;
                        break;
                    case NpgsqlDbType.TsVector:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.TsQuery:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.Uuid:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.Xml:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.Json:
                        dbValue = "";
                        break;
                    case NpgsqlDbType.Jsonb:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Hstore:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Array:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Range:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Refcursor:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Oidvector:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Int2Vector:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Oid:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Xid:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Cid:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Regtype:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Tid:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Unknown:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Geometry:
                        dbValue = DBNull.Value;
                        break;
                    case NpgsqlDbType.Geography:
                        dbValue = DBNull.Value;
                        break;
                    default:
                        dbValue = DBNull.Value;
                        break;
                }

                isMatchingParameter = false;
            }

            parameter.Value = dbValue;
            return isMatchingParameter;
        }

        public void BeginTransaction()
        {
            databaseFactory.BeginTransaction();
        }

        public void BeginTransaction(IsolationLevel isolationLevel)
        {
            databaseFactory.BeginTransaction(isolationLevel);
        }

        public void CommitTransaction()
        {
            databaseFactory.CommitTransaction();
        }

        public void RollbackTransaction()
        {
            databaseFactory.RollbackTransaction();
        }

        public void Dispose()
        {
            Dispose(true);

            GC.SuppressFinalize(this);
        }

        private void Dispose(bool isFromDispose)
        {
            if (isDisposedResources == false)
            {
                if (isFromDispose)
                {
                    if (databaseFactory != null)
                    {
                        databaseFactory.Dispose();
                    }

                    GC.SuppressFinalize(this);
                }

                isDisposedResources = true;
            }
        }
    }
}
