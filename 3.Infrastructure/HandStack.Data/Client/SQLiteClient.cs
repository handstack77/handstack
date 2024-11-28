using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SQLite;
using System.Dynamic;
using System.Linq;

using HandStack.Core.ExtensionMethod;

namespace HandStack.Data.Client
{
    /// <code>
    ///   using (SQLiteClient dbClient = new SQLiteClient())
    ///   {
    ///       List<SQLiteParameter> parameters = new List<SQLiteParameter>();
    ///
    ///       parameters.Add(dbClient.CreateParameter(DbType.VarChar, "DicKey", "ChangeSetup"));
    ///
    ///       using (DataSet result = dbClient.ExecuteDataSet("GetSys_Dictionary", parameters))
    ///       {
    ///           // ......
    ///       }
    ///   }
    /// </code>
    public sealed class SQLiteClient : IDisposable
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

        public SQLiteClient(string connectionString)
        {
            this.connectionString = connectionString;

            databaseFactory = new DatabaseFactory(connectionString, DataProviders.SQLite);
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

        public SQLiteParameter? CreateParameter(DbType toDbType, string parameterName, object value)
        {
            return CreateParameter(toDbType, parameterName, value, ParameterDirection.Input);
        }

        public SQLiteParameter? CreateParameter(DbType toDbType, string parameterName, object value, ParameterDirection direction)
        {
            SQLiteParameter? parameter = databaseFactory.Command?.CreateParameter() as SQLiteParameter;
            if (parameter != null)
            {
                parameter.DbType = toDbType;
                parameter.Direction = direction;

                parameter.ParameterName = parameterName;
                parameter.Value = value;
            }
            return parameter;
        }

        public string ExecuteCommandText(string procedureName, List<SQLiteParameter>? parameters)
        {
            string CommandParameters = "";

            if (parameters == null || parameters.Count == 0)
            {
                return string.Concat("exec ", procedureName, ";");
            }

            if (isDeriveParameters == true)
            {
                SQLiteParameter[] parameterSet = GetSpParameterSet(procedureName);

                foreach (SQLiteParameter parameter in parameterSet)
                {
                    if (SetDbParameterData(parameter, parameters) == true)
                    {
                        CommandParameters += string.Concat(parameter.ParameterName, "='", parameter.Value.ToStringSafe().Replace("'", "''"), "', ");
                    }
                }
            }
            else
            {
                foreach (SQLiteParameter parameter in parameters)
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

        public DataSet? ExecuteDataSet(string commandText, List<SQLiteParameter>? parameters, CommandType dbCommandType, bool hasSchema = false)
        {
            if (parameters != null)
            {
                foreach (SQLiteParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, hasSchema);
        }

        public DataSet? ExecuteDataSet(string commandText, List<SQLiteParameter>? parameters, CommandType dbCommandType, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            if (parameters != null)
            {
                foreach (SQLiteParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteDataSet(commandText, dbCommandType, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<SQLiteParameter>? parameters, bool hasSchema = false)
        {
            return ExecuteDataSet(procedureName, parameters, ExecutingConnectionState.CloseOnExit, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<SQLiteParameter>? parameters, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<SQLiteParameter>? parameters, ExecutingConnectionState connectionState, out SQLiteCommand? outputDbCommand, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            using (DataSet? result = databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema))
            {
                outputDbCommand = databaseFactory.OutputCommand as SQLiteCommand;
                return result;
            }
        }

        public int ExecuteNonQuery(string commandText, CommandType dbCommandType)
        {
            return databaseFactory.ExecuteNonQuery(commandText, dbCommandType);
        }

        public int ExecuteNonQuery(string commandText, List<SQLiteParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (SQLiteParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteNonQuery(commandText, dbCommandType);
        }

        public int ExecuteNonQuery(string procedureName, List<SQLiteParameter>? parameters)
        {
            return ExecuteNonQuery(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public int ExecuteNonQuery(string procedureName, List<SQLiteParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
        }

        public int ExecuteNonQuery(string procedureName, List<SQLiteParameter>? parameters, ExecutingConnectionState connectionState, out SQLiteCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            int result = databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as SQLiteCommand;
            return result;
        }

        public SQLiteDataReader? ExecuteReader(string commandText, CommandType dbCommandType)
        {
            return ExecuteReader(commandText, null, dbCommandType) as SQLiteDataReader;
        }

        public SQLiteDataReader? ExecuteReader(string commandText, List<SQLiteParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (SQLiteParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteReader(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit) as SQLiteDataReader;
        }

        public SQLiteDataReader? ExecuteReader(string procedureName, List<SQLiteParameter>? parameters)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteReader(procedureName, CommandType.Text, ExecutingConnectionState.CloseOnExit) as SQLiteDataReader;
        }

        public T? ExecutePocoMapping<T>(string commandText, List<SQLiteParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            T? results = default(T);
            if (parameters != null)
            {
                foreach (SQLiteParameter parameter in parameters)
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

        public List<T>? ExecutePocoMappings<T>(string commandText, List<SQLiteParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            List<T>? results = null;
            if (parameters != null)
            {
                foreach (SQLiteParameter parameter in parameters)
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

        public List<dynamic> ExecuteDynamic(string commandText, List<SQLiteParameter>? parameters, CommandType dbCommandType = CommandType.Text)
        {
            List<dynamic> results = new List<dynamic>();
            if (parameters != null)
            {
                foreach (SQLiteParameter parameter in parameters)
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

        public object? ExecuteScalar(string commandText, List<SQLiteParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (SQLiteParameter parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteScalar(commandText, dbCommandType);
        }

        public object? ExecuteScalar(string procedureName, List<SQLiteParameter>? parameters)
        {
            return ExecuteScalar(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public object? ExecuteScalar(string procedureName, List<SQLiteParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
        }

        public object? ExecuteScalar(string procedureName, List<SQLiteParameter>? parameters, ExecutingConnectionState connectionState, out SQLiteCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            object? result = databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as SQLiteCommand;
            return result;
        }

        private SQLiteParameter[] GetSpParameterSet(string procedureName)
        {
            DbParameter[] result = DbParameterCache.GetSpParameterSet(DataProviders.SQLite, connectionString, procedureName);

            SQLiteParameter[] parameters = new SQLiteParameter[result.Length];

            for (int i = 0; i < result.Length; i++)
            {
                parameters[i] = (SQLiteParameter)result[i];
            }

            return parameters;
        }

        private void SetDbFactoryCommand(string procedureName, List<SQLiteParameter>? parameters)
        {
            if (isDeriveParameters == true)
            {
                if (parameters != null)
                {
                    SQLiteParameter[] parameterSet = GetSpParameterSet(procedureName);

                    foreach (SQLiteParameter parameter in parameterSet)
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
                    foreach (SQLiteParameter parameter in parameters)
                    {
                        databaseFactory.AddParameter(parameter);
                    }
                }
            }
        }

        private bool SetDbParameterData(SQLiteParameter parameter, List<SQLiteParameter>? ListParameters)
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
                SQLiteParameter? listParameter = null;
                foreach (SQLiteParameter nvp in result)
                {
                    listParameter = nvp;
                    break;
                }

                dbValue = listParameter?.Value;
                isMatchingParameter = true;
            }
            else
            {
                switch (parameter.DbType)
                {
                    case DbType.AnsiString:
                        dbValue = "";
                        break;
                    case DbType.Binary:
                        dbValue = DBNull.Value;
                        break;
                    case DbType.Byte:
                        dbValue = DBNull.Value;
                        break;
                    case DbType.Boolean:
                        dbValue = false;
                        break;
                    case DbType.Currency:
                        dbValue = 0;
                        break;
                    case DbType.Date:
                        dbValue = DateTime.Now;
                        break;
                    case DbType.DateTime:
                        dbValue = DateTime.Now;
                        break;
                    case DbType.Decimal:
                        dbValue = 0;
                        break;
                    case DbType.Double:
                        dbValue = 0;
                        break;
                    case DbType.Guid:
                        dbValue = DBNull.Value;
                        break;
                    case DbType.Int16:
                        dbValue = 0;
                        break;
                    case DbType.Int32:
                        dbValue = 0;
                        break;
                    case DbType.Int64:
                        dbValue = 0;
                        break;
                    case DbType.Object:
                        dbValue = DBNull.Value;
                        break;
                    case DbType.SByte:
                        dbValue = DBNull.Value;
                        break;
                    case DbType.Single:
                        dbValue = 0;
                        break;
                    case DbType.String:
                        dbValue = "";
                        break;
                    case DbType.Time:
                        dbValue = DateTime.Now;
                        break;
                    case DbType.UInt16:
                        dbValue = 0;
                        break;
                    case DbType.UInt32:
                        dbValue = 0;
                        break;
                    case DbType.UInt64:
                        dbValue = 0;
                        break;
                    case DbType.VarNumeric:
                        dbValue = 0;
                        break;
                    case DbType.AnsiStringFixedLength:
                        dbValue = "";
                        break;
                    case DbType.StringFixedLength:
                        dbValue = "";
                        break;
                    case DbType.Xml:
                        dbValue = "";
                        break;
                    case DbType.DateTime2:
                        dbValue = DateTime.Now;
                        break;
                    case DbType.DateTimeOffset:
                        dbValue = DateTime.Now;
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
