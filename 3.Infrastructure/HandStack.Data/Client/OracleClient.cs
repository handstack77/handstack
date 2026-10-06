using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Linq;
using System.Text;

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

        private readonly DatabaseFactory databaseFactory;

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
            var commandParameters = new StringBuilder();

            static void AppendParameter(StringBuilder builder, string parameterName, object? parameterValue)
            {
                if (parameterName.IndexOf('@') < 0)
                {
                    builder.Append('@');
                }

                builder
                    .Append(parameterName)
                    .Append("='")
                    .Append(parameterValue.ToStringSafe().Replace("'", "''"))
                    .Append("', ");
            }

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
                        AppendParameter(commandParameters, parameter.ParameterName, parameter.Value);
                    }
                }
            }
            else
            {
                foreach (var parameter in parameters)
                {
                    AppendParameter(commandParameters, parameter.ParameterName, parameter.Value);
                }
            }

            if (commandParameters.Length > 2)
            {
                commandParameters.Length -= 2;
            }

            return string.Concat("exec ", procedureName, commandParameters.Length > 0 ? " " : "", commandParameters.ToString(), ";");
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
                    results = [];
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

        private static bool SetDbParameterData(OracleParameter parameter, List<OracleParameter>? ListParameters)
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

            if (result.Any())
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
                dbValue = parameter.OracleDbType switch
                {
                    OracleDbType.BFile => DBNull.Value,
                    OracleDbType.Blob => DBNull.Value,
                    OracleDbType.Byte => DBNull.Value,
                    OracleDbType.Char => "",
                    OracleDbType.Clob => "",
                    OracleDbType.Date => DateTime.Now,
                    OracleDbType.Decimal => 0,
                    OracleDbType.Double => 0,
                    OracleDbType.Long => "",
                    OracleDbType.LongRaw => DBNull.Value,
                    OracleDbType.Int16 => 0,
                    OracleDbType.Int32 => 0,
                    OracleDbType.Int64 => 0,
                    OracleDbType.IntervalDS => TimeSpan.MinValue,
                    OracleDbType.IntervalYM => 0,
                    OracleDbType.NClob => "",
                    OracleDbType.NChar => "",
                    OracleDbType.NVarchar2 => "",
                    OracleDbType.Raw => DBNull.Value,
                    OracleDbType.RefCursor => DBNull.Value,
                    OracleDbType.Single => 0,
                    OracleDbType.TimeStamp => DateTime.Now,
                    OracleDbType.TimeStampLTZ => DateTime.Now,
                    OracleDbType.TimeStampTZ => DateTime.Now,
                    OracleDbType.Varchar2 => "",
                    OracleDbType.XmlType => "",
                    OracleDbType.BinaryDouble => DBNull.Value,
                    OracleDbType.BinaryFloat => DBNull.Value,
                    OracleDbType.Boolean => false,
                    _ => DBNull.Value,
                };
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
                    databaseFactory?.Dispose();

                }

                isDisposedResources = true;
            }
        }
    }
}
