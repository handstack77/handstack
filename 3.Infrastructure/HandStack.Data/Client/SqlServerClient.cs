using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Dynamic;
using System.Linq;

using HandStack.Core.ExtensionMethod;

using Microsoft.Data.SqlClient;

namespace HandStack.Data.Client
{
    /// <code>
    ///   using (SqlServerClient dbClient = new SqlServerClient())
    ///   {
    ///       List<SqlParameter> parameters = new List<SqlParameter>();
    ///
    ///       parameters.Add(dbClient.CreateParameter(SqlDbType.VarChar, "DicKey", "ChangeSetup"));
    ///
    ///       using (DataSet result = dbClient.ExecuteDataSet("GetSys_Dictionary", parameters))
    ///       {
    ///           // ......
    ///       }
    ///   }
    /// </code>
    public sealed class SqlServerClient : IDisposable
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

        /// <param name="connectionString">데이터베이스 연결 문자열입니다</param>
        public SqlServerClient(string connectionString)
        {
            this.connectionString = connectionString;

            databaseFactory = new DatabaseFactory(connectionString, DataProviders.SqlServer);
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

        public SqlParameter? CreateParameter(SqlDbType toDbType, string parameterName, object value)
        {
            return CreateParameter(toDbType, parameterName, value, ParameterDirection.Input);
        }

        public SqlParameter? CreateParameter(SqlDbType toDbType, string parameterName, object value, ParameterDirection direction)
        {
            var parameter = databaseFactory.Command?.CreateParameter() as SqlParameter;
            if (parameter != null)
            {
                parameter.SqlDbType = toDbType;
                parameter.Direction = direction;

                parameter.ParameterName = parameterName;
                parameter.Value = value;
            }
            return parameter;
        }

        public string ExecuteCommandText(string procedureName, List<SqlParameter>? parameters)
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

        public DataSet? ExecuteDataSet(string commandText, List<SqlParameter>? parameters, CommandType dbCommandType, bool hasSchema = false)
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

        public DataSet? ExecuteDataSet(string commandText, List<SqlParameter>? parameters, CommandType dbCommandType, ExecutingConnectionState connectionState, bool hasSchema = false)
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

        public DataSet? ExecuteProcedureFmtOnly(string procedureName, CommandType dbCommandType, List<SqlParameter>? parameters, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            var parameterText = " ";
            if (databaseFactory.Command != null)
            {
                foreach (DbParameter parameter in databaseFactory.Command.Parameters)
                {
                    parameterText += string.Concat(parameter.ParameterName, "='", parameter.Value.ToStringSafe().Replace("'", "''"), "',");
                }
            }

            if (!string.IsNullOrEmpty(parameterText))
            {
                parameterText = parameterText.Left(parameterText.Length - 1);
            }

            return databaseFactory.ExecuteDataSet("SET FMTONLY ON;EXEC " + procedureName + parameterText + ";SET FMTONLY OFF;", dbCommandType, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<SqlParameter>? parameters, bool hasSchema = false)
        {
            return ExecuteDataSet(procedureName, parameters, ExecutingConnectionState.CloseOnExit, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<SqlParameter>? parameters, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string procedureName, List<SqlParameter>? parameters, ExecutingConnectionState connectionState, out SqlCommand? outputDbCommand, bool hasSchema = false)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            using var result = databaseFactory.ExecuteDataSet(procedureName, CommandType.Text, connectionState, hasSchema);
            outputDbCommand = databaseFactory.OutputCommand as SqlCommand;
            return result;
        }

        public int ExecuteNonQuery(string commandText, CommandType dbCommandType)
        {
            return databaseFactory.ExecuteNonQuery(commandText, dbCommandType);
        }

        public int ExecuteNonQuery(string commandText, List<SqlParameter>? parameters, CommandType dbCommandType)
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

        public int ExecuteNonQuery(string procedureName, List<SqlParameter>? parameters)
        {
            return ExecuteNonQuery(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public int ExecuteNonQuery(string procedureName, List<SqlParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
        }

        public int ExecuteNonQuery(string procedureName, List<SqlParameter>? parameters, ExecutingConnectionState connectionState, out SqlCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            var result = databaseFactory.ExecuteNonQuery(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as SqlCommand;
            return result;
        }

        public SqlDataReader? ExecuteReader(string commandText, CommandType dbCommandType)
        {
            return ExecuteReader(commandText, null, dbCommandType);
        }

        public SqlDataReader? ExecuteReader(string commandText, List<SqlParameter>? parameters, CommandType dbCommandType)
        {
            if (parameters != null)
            {
                foreach (var parameter in parameters)
                {
                    databaseFactory.AddParameter(parameter);
                }
            }

            return databaseFactory.ExecuteReader(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit) as SqlDataReader;
        }

        public SqlDataReader? ExecuteReader(string procedureName, List<SqlParameter>? parameters = null)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteReader(procedureName, CommandType.Text, ExecutingConnectionState.CloseOnExit) as SqlDataReader;
        }

        public T? ExecutePocoMapping<T>(string commandText, List<SqlParameter>? parameters, CommandType dbCommandType = CommandType.Text)
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

        public List<T>? ExecutePocoMappings<T>(string commandText, List<SqlParameter>? parameters, CommandType dbCommandType = CommandType.Text)
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

        public List<dynamic> ExecuteDynamic(string commandText, List<SqlParameter>? parameters, CommandType dbCommandType = CommandType.Text)
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

        public object? ExecuteScalar(string commandText, List<SqlParameter>? parameters, CommandType dbCommandType)
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

        public object? ExecuteScalar(string procedureName, List<SqlParameter>? parameters)
        {
            return ExecuteScalar(procedureName, parameters, ExecutingConnectionState.CloseOnExit);
        }

        public object? ExecuteScalar(string procedureName, List<SqlParameter>? parameters, ExecutingConnectionState connectionState)
        {
            SetDbFactoryCommand(procedureName, parameters);

            return databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
        }

        public object? ExecuteScalar(string procedureName, List<SqlParameter>? parameters, ExecutingConnectionState connectionState, out SqlCommand? outputDbCommand)
        {
            SetDbFactoryCommand(procedureName, parameters);

            databaseFactory.IsOutputParameter = true;
            var result = databaseFactory.ExecuteScalar(procedureName, CommandType.Text, connectionState);
            outputDbCommand = databaseFactory.OutputCommand as SqlCommand;
            return result;
        }

        private SqlParameter[] GetSpParameterSet(string procedureName)
        {
            var result = DbParameterCache.GetSpParameterSet(DataProviders.SqlServer, connectionString, procedureName);

            var parameters = new SqlParameter[result.Length];

            for (var i = 0; i < result.Length; i++)
            {
                parameters[i] = (SqlParameter)result[i];
            }

            return parameters;
        }

        private void SetDbFactoryCommand(string procedureName, List<SqlParameter>? parameters)
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

        private bool SetDbParameterData(SqlParameter parameter, List<SqlParameter>? ListParameters)
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
                SqlParameter? listParameter = null;
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
                switch (parameter.SqlDbType)
                {
                    case SqlDbType.BigInt:
                        dbValue = 0;
                        break;
                    case SqlDbType.Binary:
                        dbValue = DBNull.Value;
                        break;
                    case SqlDbType.Bit:
                        dbValue = false;
                        break;
                    case SqlDbType.Char:
                        dbValue = "".ToCharArray();
                        break;
                    case SqlDbType.Date:
                        dbValue = DateTime.Now;
                        break;
                    case SqlDbType.DateTime:
                        dbValue = DateTime.Now;
                        break;
                    case SqlDbType.DateTime2:
                        dbValue = DateTime.Now;
                        break;
                    case SqlDbType.DateTimeOffset:
                        dbValue = DateTime.Now;
                        break;
                    case SqlDbType.Decimal:
                        dbValue = 0;
                        break;
                    case SqlDbType.Float:
                        dbValue = 0;
                        break;
                    case SqlDbType.Image:
                        dbValue = DBNull.Value;
                        break;
                    case SqlDbType.Int:
                        dbValue = 0;
                        break;
                    case SqlDbType.Money:
                        dbValue = 0;
                        break;
                    case SqlDbType.NChar:
                        dbValue = "";
                        break;
                    case SqlDbType.NText:
                        dbValue = "";
                        break;
                    case SqlDbType.NVarChar:
                        dbValue = "";
                        break;
                    case SqlDbType.Real:
                        dbValue = 0;
                        break;
                    case SqlDbType.SmallDateTime:
                        dbValue = DateTime.Now;
                        break;
                    case SqlDbType.SmallInt:
                        dbValue = 0;
                        break;
                    case SqlDbType.SmallMoney:
                        dbValue = 0;
                        break;
                    case SqlDbType.Structured:
                        dbValue = DBNull.Value;
                        break;
                    case SqlDbType.Text:
                        dbValue = "";
                        break;
                    case SqlDbType.Time:
                        dbValue = DBNull.Value;
                        break;
                    case SqlDbType.Timestamp:
                        dbValue = DBNull.Value;
                        break;
                    case SqlDbType.TinyInt:
                        dbValue = 0;
                        break;
                    case SqlDbType.Udt:
                        dbValue = DBNull.Value;
                        break;
                    case SqlDbType.UniqueIdentifier:
                        dbValue = Guid.NewGuid();
                        break;
                    case SqlDbType.VarBinary:
                        dbValue = DBNull.Value;
                        break;
                    case SqlDbType.VarChar:
                        dbValue = "";
                        break;
                    case SqlDbType.Variant:
                        dbValue = DBNull.Value;
                        break;
                    case SqlDbType.Xml:
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

