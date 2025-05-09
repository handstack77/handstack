using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Linq;

using HandStack.Core.ExtensionMethod;

using Oracle.ManagedDataAccess.Client;

namespace HandStack.Data.Client
{
    /// <code>
    ///   using (OracleClient dbClient = new OracleClient())
    ///   {
    ///       List<OracleParameter> parameters = new List<OracleParameter>();
    ///
    ///       parameters.Add(dbClient.CreateParameter(OracleDbType.VarChar, "DicKey", "ChangeSetup"));
    ///
    ///       using (DataSet result = dbClient.ExecuteDataSet("GetSys_Dictionary", parameters))
    ///       {
    ///           // ......
    ///       }
    ///   }
    /// </code>
    public sealed class OracleClient : IDisposable
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

        public OracleClient(string connectionString)
        {
            this.connectionString = connectionString;

            databaseFactory = new DatabaseFactory(connectionString, DataProviders.Oracle);
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

        public OracleParameter? CreateParameter(OracleDbType toDbType, string parameterName, object value)
        {
            return CreateParameter(toDbType, parameterName, value, ParameterDirection.Input);
        }

        public OracleParameter? CreateParameter(OracleDbType toDbType, string parameterName, object value, ParameterDirection direction)
        {
            var parameter = databaseFactory.Command?.CreateParameter() as OracleParameter;
            if (parameter != null)
            {
                parameter.OracleDbType = toDbType;
                parameter.Direction = direction;

                parameter.ParameterName = parameterName;
                parameter.Value = value;
            }
            return parameter;
        }

        public string ExecuteCommandText(string procedureName, List<OracleParameter>? parameters)
        {
            var CommandParameters = "";

            if (parameters == null || parameters.Count == 0)
            {
                return string.Concat("exec ", procedureName, ";");
            }

            if (isDeriveParameters == true)
            {
                var parameterSet = GetSpParameterSet(procedureName);

                foreach (var parameter in parameterSet)
                {
                    if (SetDbParameterData(parameter, parameters) == true)
                    {
                        CommandParameters += string.Concat(parameter.ParameterName, "='", parameter.Value.ToStringSafe().Replace("'", "''"), "', ");
                    }
                }
            }
            else
            {
                foreach (var parameter in parameters)
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

        public DataSet? ExecuteDataSet(string commandText, List<OracleParameter>? parameters, CommandType dbCommandType, bool hasSchema = false)
        {
            if (parameters != null)
            {
                foreach (var parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, hasSchema);
        }

        public DataSet? ExecuteDataSet(string commandText, List<OracleParameter>? parameters, CommandType dbCommandType, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            if (parameters != null)
            {
                foreach (var parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<OracleParameter>? parameters, bool hasSchema = false)
        {
            return ExecuteDataSet(procedureName, parameters, ExecutingConnectionState.CloseOnExit, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<OracleParameter>? parameters, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<OracleParameter>? parameters, ExecutingConnectionState connectionState, out OracleCommand? outputDbCommand, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            using var result = databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema);
            outputDbCommand = databaseFactory.OutputCommand as OracleCommand;
            return result;
        }

        public int ExecuteNonQuery(string commandText, CommandType dbCommandType)
        {
            return databaseFactory.ExecuteNonQuery(commandText, dbCommandType);
        }

        public int ExecuteNonQuery(string commandText, List<OracleParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (var parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteNonQuery(commandText, dbCommandType);
        }

        public int ExecuteNonQuery(string procedureName, List<OracleParameter>? parameters)
        {
            return ExecuteNonQuery(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public int ExecuteNonQuery(string procedureName, List<OracleParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
        }

        public int ExecuteNonQuery(string procedureName, List<OracleParameter>? parameters, ExecutingConnectionState connectionState, out OracleCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            var result = databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as OracleCommand;

            return result;
        }

        public OracleDataReader? ExecuteReader(string commandText, CommandType dbCommandType)
        {
            return ExecuteReader(commandText, null, dbCommandType);
        }

        public OracleDataReader? ExecuteReader(string commandText, List<OracleParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (var parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteReader(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit) as OracleDataReader;
        }

        public OracleDataReader? ExecuteReader(string procedureName, List<OracleParameter>? parameters)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteReader(procedureName, CommandType.Text, ExecutingConnectionState.CloseOnExit) as OracleDataReader;
        }

        public T? ExecutePocoMapping<T>(string commandText, List<OracleParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            var results = default(T);
            if (parameters != null)
            {
                foreach (var parameter in parameters)
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

                    var columnNames = new List<string>();
                    for (var i = 0; i < reader.FieldCount; i++)
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

        public List<T>? ExecutePocoMappings<T>(string commandText, List<OracleParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            List<T>? results = null;
            if (parameters != null)
            {
                foreach (var parameter in parameters)
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

        public List<dynamic> ExecuteDynamic(string commandText, List<OracleParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            var results = new List<dynamic>();
            if (parameters != null)
            {
                foreach (var parameter in parameters)
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
                        var columnNames = new List<string>();
                        foreach (DataRow row in schemaTable.Rows)
                        {
                            columnNames.Add(row.GetStringSafe("ColumnName"));
                        }

                        while (reader.Read())
                        {
                            var data = new ExpandoObject() as IDictionary<string, object?>;
                            foreach (var columnName in columnNames)
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

        public object? ExecuteScalar(string commandText, List<OracleParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (var parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteScalar(commandText, dbCommandType);
        }

        public object? ExecuteScalar(string procedureName, List<OracleParameter>? parameters)
        {
            return ExecuteScalar(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public object? ExecuteScalar(string procedureName, List<OracleParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
        }

        public object? ExecuteScalar(string procedureName, List<OracleParameter>? parameters, ExecutingConnectionState connectionState, out OracleCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            var result = databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as OracleCommand;
            return result;
        }

        private OracleParameter[] GetSpParameterSet(string procedureName)
        {
            var result = DbParameterCache.GetSpParameterSet(DataProviders.Oracle, connectionString, procedureName);

            var parameters = new OracleParameter[result.Length];

            for (var i = 0; i < result.Length; i++)
            {
                parameters[i] = (OracleParameter)result[i];
            }

            return parameters;
        }

        private void SetDbFactoryCommand(string procedureName, List<OracleParameter>? parameters)
        {
            if (isDeriveParameters == true)
            {
                if (parameters != null)
                {
                    var parameterSet = GetSpParameterSet(procedureName);

                    foreach (var parameter in parameterSet)
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
                    foreach (var parameter in parameters)
                    {
                        databaseFactory.AddParameter(parameter);
                    }
                }
            }
        }

        private bool SetDbParameterData(OracleParameter parameter, List<OracleParameter>? ListParameters)
        {
            if (ListParameters == null)
            {
                return false;
            }

            var isMatchingParameter = false;
            object? dbValue = null;

            var result = from p in ListParameters
                         where p.ParameterName.Equals(parameter.ParameterName, StringComparison.CurrentCultureIgnoreCase)
                         select p;

            if (result.Count() > 0)
            {
                OracleParameter? listParameter = null;
                foreach (var nvp in result)
                {
                    listParameter = nvp;
                    break;
                }

                dbValue = listParameter?.Value;
                isMatchingParameter = true;
            }
            else
            {
                switch (parameter.OracleDbType)
                {
                    case OracleDbType.BFile:
                        dbValue = DBNull.Value;
                        break;
                    case OracleDbType.Blob:
                        dbValue = DBNull.Value;
                        break;
                    case OracleDbType.Byte:
                        dbValue = DBNull.Value;
                        break;
                    case OracleDbType.Char:
                        dbValue = "";
                        break;
                    case OracleDbType.Clob:
                        dbValue = "";
                        break;
                    case OracleDbType.Date:
                        dbValue = DateTime.Now;
                        break;
                    case OracleDbType.Decimal:
                        dbValue = 0;
                        break;
                    case OracleDbType.Double:
                        dbValue = 0;
                        break;
                    case OracleDbType.Long:
                        dbValue = "";
                        break;
                    case OracleDbType.LongRaw:
                        dbValue = DBNull.Value;
                        break;
                    case OracleDbType.Int16:
                        dbValue = 0;
                        break;
                    case OracleDbType.Int32:
                        dbValue = 0;
                        break;
                    case OracleDbType.Int64:
                        dbValue = 0;
                        break;
                    case OracleDbType.IntervalDS:
                        dbValue = TimeSpan.MinValue;
                        break;
                    case OracleDbType.IntervalYM:
                        dbValue = 0;
                        break;
                    case OracleDbType.NClob:
                        dbValue = "";
                        break;
                    case OracleDbType.NChar:
                        dbValue = "";
                        break;
                    case OracleDbType.NVarchar2:
                        dbValue = "";
                        break;
                    case OracleDbType.Raw:
                        dbValue = DBNull.Value;
                        break;
                    case OracleDbType.RefCursor:
                        dbValue = DBNull.Value;
                        break;
                    case OracleDbType.Single:
                        dbValue = 0;
                        break;
                    case OracleDbType.TimeStamp:
                        dbValue = DateTime.Now;
                        break;
                    case OracleDbType.TimeStampLTZ:
                        dbValue = DateTime.Now;
                        break;
                    case OracleDbType.TimeStampTZ:
                        dbValue = DateTime.Now;
                        break;
                    case OracleDbType.Varchar2:
                        dbValue = "";
                        break;
                    case OracleDbType.XmlType:
                        dbValue = "";
                        break;
                    case OracleDbType.BinaryDouble:
                        dbValue = DBNull.Value;
                        break;
                    case OracleDbType.BinaryFloat:
                        dbValue = DBNull.Value;
                        break;
                    case OracleDbType.Boolean:
                        dbValue = false;
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
