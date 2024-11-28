using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Dynamic;
using System.Linq;

using HandStack.Core.ExtensionMethod;

using MySql.Data.MySqlClient;

namespace HandStack.Data.Client
{
    /// <code>
    ///   using (MySqlClient dbClient = new MySqlClient())
    ///   {
    ///       List<MySqlParameter> parameters = new List<MySqlParameter>();
    ///
    ///       parameters.Add(dbClient.CreateParameter(MySqlDbType.VarChar, "DicKey", "ChangeSetup"));
    ///
    ///       using (DataSet result = dbClient.ExecuteDataSet("GetSys_Dictionary", parameters))
    ///       {
    ///           // ......
    ///       }
    ///   }
    /// </code>
    public sealed class MySqlClient : IDisposable
    {
        private string connectionString;

        public string ConnectionString
        {
            get { return connectionString; }
            set { connectionString = value; }
        }

        private DatabaseFactory databaseFactory;

        private bool isDisposedResources = false;

        public bool isDeriveParameters = false;

        public bool IsDeriveParameters
        {
            get { return isDeriveParameters; }
            set { isDeriveParameters = value; }
        }

        public MySqlClient(string connectionString)
        {
            this.connectionString = connectionString;

            databaseFactory = new DatabaseFactory(connectionString, DataProviders.MySQL);
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

        public MySqlParameter? CreateParameter(MySqlDbType toDbType, string parameterName, object value)
        {
            return CreateParameter(toDbType, parameterName, value, ParameterDirection.Input);
        }

        public MySqlParameter? CreateParameter(MySqlDbType toDbType, string parameterName, object value, ParameterDirection direction)
        {
            MySqlParameter? parameter = databaseFactory.Command?.CreateParameter() as MySqlParameter;
            if (parameter != null)
            {
                parameter.MySqlDbType = toDbType;
                parameter.Direction = direction;

                parameter.ParameterName = parameterName;
                parameter.Value = value;
            }
            return parameter;
        }

        public string ExecuteCommandText(string procedureName, List<MySqlParameter>? parameters)
        {
            string CommandParameters = "";

            if (parameters == null || parameters.Count == 0)
            {
                return string.Concat("exec ", procedureName, ";");
            }

            if (isDeriveParameters == true)
            {
                MySqlParameter[] parameterSet = GetSpParameterSet(procedureName);

                foreach (MySqlParameter parameter in parameterSet)
                {
                    if (SetDbParameterData(parameter, parameters) == true)
                    {
                        CommandParameters += string.Concat(parameter.ParameterName, "='", parameter.Value.ToStringSafe().Replace("'", "''"), "', ");
                    }
                }
            }
            else
            {
                foreach (MySqlParameter parameter in parameters)
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

        public DataSet? ExecuteDataSet(string commandText, List<MySqlParameter>? parameters, CommandType dbCommandType, bool hasSchema = false)
        {
            if (parameters != null)
            {
                foreach (MySqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, hasSchema);
        }

        public DataSet? ExecuteDataSet(string commandText, List<MySqlParameter>? parameters, CommandType dbCommandType, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            if (parameters != null)
            {
                foreach (MySqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<MySqlParameter>? parameters, bool hasSchema = false)
        {
            return ExecuteDataSet(procedureName, parameters, ExecutingConnectionState.CloseOnExit, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<MySqlParameter>? parameters, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<MySqlParameter>? parameters, ExecutingConnectionState connectionState, out MySqlCommand? outputDbCommand, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            using (DataSet? result = databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema))
            {
                outputDbCommand = databaseFactory.OutputCommand as MySqlCommand;
                return result;
            }
        }

        public int ExecuteNonQuery(string commandText, CommandType dbCommandType)
        {
            return databaseFactory.ExecuteNonQuery(commandText, dbCommandType);
        }

        public int ExecuteNonQuery(string commandText, List<MySqlParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (MySqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteNonQuery(commandText, dbCommandType);
        }

        public int ExecuteNonQuery(string procedureName, List<MySqlParameter>? parameters)
        {
            return ExecuteNonQuery(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public int ExecuteNonQuery(string procedureName, List<MySqlParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
        }

        public int ExecuteNonQuery(string procedureName, List<MySqlParameter>? parameters, ExecutingConnectionState connectionState, out MySqlCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            int result = databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as MySqlCommand;

            return result;
        }

        public MySqlDataReader? ExecuteReader(string commandText, CommandType dbCommandType)
        {
            return ExecuteReader(commandText, null, dbCommandType) as MySqlDataReader;
        }

        public MySqlDataReader? ExecuteReader(string commandText, List<MySqlParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (MySqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteReader(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit) as MySqlDataReader;
        }

        public MySqlDataReader? ExecuteReader(string procedureName, List<MySqlParameter>? parameters)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteReader(procedureName, CommandType.Text, ExecutingConnectionState.CloseOnExit) as MySqlDataReader;
        }

        public T? ExecutePocoMapping<T>(string commandText, List<MySqlParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            T? results = default(T);
            if (parameters != null)
            {
                foreach (MySqlParameter parameter in parameters)
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

        public List<T>? ExecutePocoMappings<T>(string commandText, List<MySqlParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            List<T>? results = null;
            if (parameters != null)
            {
                foreach (MySqlParameter parameter in parameters)
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
                else
                {
                    results = new List<T>();
                }
            }

            return results;
        }

        public List<dynamic> ExecuteDynamic(string commandText, List<MySqlParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            List<dynamic> results = new List<dynamic>();
            if (parameters != null)
            {
                foreach (MySqlParameter parameter in parameters)
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

        public object? ExecuteScalar(string commandText, List<MySqlParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (MySqlParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteScalar(commandText, dbCommandType);
        }

        public object? ExecuteScalar(string procedureName, List<MySqlParameter>? parameters)
        {
            return ExecuteScalar(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public object? ExecuteScalar(string procedureName, List<MySqlParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
        }

        public object? ExecuteScalar(string procedureName, List<MySqlParameter>? parameters, ExecutingConnectionState connectionState, out MySqlCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            object? result = databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as MySqlCommand;
            return result;
        }

        private MySqlParameter[] GetSpParameterSet(string procedureName)
        {
            DbParameter[] result = DbParameterCache.GetSpParameterSet(DataProviders.MySQL, connectionString, procedureName);

            MySqlParameter[] parameters = new MySqlParameter[result.Length];

            for (int i = 0; i < result.Length; i++)
            {
                parameters[i] = (MySqlParameter)result[i];
            }

            return parameters;
        }

        private void SetDbFactoryCommand(string procedureName, List<MySqlParameter>? parameters)
        {
            if (isDeriveParameters == true)
            {
                if (parameters != null)
                {
                    MySqlParameter[] parameterSet = GetSpParameterSet(procedureName);

                    foreach (MySqlParameter parameter in parameterSet)
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
                    foreach (MySqlParameter parameter in parameters)
                    {
                        databaseFactory.AddParameter(parameter);
                    }
                }
            }
        }

        private bool SetDbParameterData(MySqlParameter parameter, List<MySqlParameter>? ListParameters)
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
                MySqlParameter? listParameter = null;
                foreach (MySqlParameter nvp in result)
                {
                    listParameter = nvp;
                    break;
                }

                dbValue = listParameter?.Value;
                isMatchingParameter = true;
            }
            else
            {
                switch (parameter.MySqlDbType)
                {
                    case MySqlDbType.Decimal:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Byte:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.Int16:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Int24:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Int32:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Int64:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Float:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Double:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Timestamp:
                        dbValue = DateTime.Now;
                        break;
                    case MySqlDbType.Date:
                        dbValue = DateTime.Now;
                        break;
                    case MySqlDbType.Time:
                        dbValue = DateTime.Now;
                        break;
                    case MySqlDbType.DateTime:
                        dbValue = DateTime.Now;
                        break;
                    case MySqlDbType.Year:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Newdate:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.VarString:
                        dbValue = "";
                        break;
                    case MySqlDbType.Bit:
                        dbValue = false;
                        break;
                    case MySqlDbType.JSON:
                        dbValue = "";
                        break;
                    case MySqlDbType.NewDecimal:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Enum:
                        dbValue = "";
                        break;
                    case MySqlDbType.Set:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.TinyBlob:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.MediumBlob:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.LongBlob:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.Blob:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.VarChar:
                        dbValue = "";
                        break;
                    case MySqlDbType.String:
                        dbValue = "";
                        break;
                    case MySqlDbType.Geometry:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.UByte:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.UInt16:
                        dbValue = 0;
                        break;
                    case MySqlDbType.UInt24:
                        dbValue = 0;
                        break;
                    case MySqlDbType.UInt32:
                        dbValue = 0;
                        break;
                    case MySqlDbType.UInt64:
                        dbValue = 0;
                        break;
                    case MySqlDbType.Binary:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.VarBinary:
                        dbValue = DBNull.Value;
                        break;
                    case MySqlDbType.TinyText:
                        dbValue = "";
                        break;
                    case MySqlDbType.MediumText:
                        dbValue = "";
                        break;
                    case MySqlDbType.LongText:
                        dbValue = "";
                        break;
                    case MySqlDbType.Text:
                        dbValue = "";
                        break;
                    case MySqlDbType.Guid:
                        dbValue = "";
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
