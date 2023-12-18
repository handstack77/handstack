using System;
using System.Collections;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Data.SQLite;
using System.IO;

using MySql.Data.MySqlClient;

using Npgsql;

using Oracle.ManagedDataAccess.Client;

using Serilog;

namespace HandStack.Data
{
    public class DatabaseFactory : IDisposable
    {
        private string connectionString;

        public string ConnectionString
        {
            get { return connectionString; }
            set { connectionString = value; }
        }

        private DbConnection? databaseConnection;

        public DbConnection? Connection
        {
            get
            {
                return databaseConnection;
            }
        }

        private DbCommand? databaseCommand;

        public DbCommand? Command
        {
            get
            {
                return databaseCommand;
            }
        }

        private DataProviders connectionProvider;

        public DataProviders ConnectionProvider
        {
            get
            {
                return connectionProvider;
            }
        }

        public bool IsOutputParameter = false;

        private DbCommand? outputCommand;

        public DbCommand? OutputCommand
        {
            get { return outputCommand; }
        }

        private bool isBaseDisposedResources = false;

        public DbProviderFactory SqlFactory = SqlClientFactory.Instance;

        public DatabaseFactory(string connectionString, DataProviders dataProviders = DataProviders.SqlServer)
        {
            this.connectionString = connectionString;
            InitializeDatabaseFactory(connectionString, dataProviders);
        }

        private void InitializeDatabaseFactory(string connectionString, DataProviders dataProviders)
        {
            this.connectionString = connectionString;

            switch (dataProviders)
            {
                case DataProviders.SqlServer:
                    SqlFactory = SqlClientFactory.Instance;
                    break;
                case DataProviders.Oracle:
                    SqlFactory = OracleClientFactory.Instance;
                    break;
                case DataProviders.MySQL:
                    SqlFactory = MySqlClientFactory.Instance;
                    break;
                case DataProviders.PostgreSQL:
                    SqlFactory = NpgsqlFactory.Instance;
                    break;
                case DataProviders.SQLite:
                    SqlFactory = SQLiteFactory.Instance;
                    break;
            }

            connectionProvider = dataProviders;
            databaseConnection = SqlFactory.CreateConnection();
            databaseCommand = SqlFactory.CreateCommand();
            outputCommand = SqlFactory.CreateCommand();

            if (databaseConnection != null && databaseCommand != null && outputCommand != null)
            {
                if (dataProviders == DataProviders.Oracle)
                {
                    ((OracleCommand)databaseCommand).BindByName = true;
                    ((OracleCommand)outputCommand).BindByName = true;
                }
                else if (dataProviders == DataProviders.SQLite)
                {
                    SQLiteConnection sqliteConnection = (SQLiteConnection)databaseConnection;
                    var items = ConnectionString.Split(";");
                    foreach (var item in items)
                    {
                        if (string.IsNullOrEmpty(item) == false)
                        {
                            if (item.IndexOf("file:") > -1)
                            {
                                string key = "file:";
                                int offset = key.Length;
                                string databaseFilePath = item.Substring(item.IndexOf(key) + offset, item.Length - item.IndexOf(key) - offset);
                                FileInfo fileInfo = new FileInfo(databaseFilePath);
                                if (fileInfo.Directory != null && fileInfo.Directory.Exists == false)
                                {
                                    Directory.CreateDirectory(fileInfo.Directory.FullName);
                                }

                                if (fileInfo.Exists == false)
                                {
                                    SQLiteConnection.CreateFile(databaseFilePath);
                                }

                                break;
                            }
                        }
                    }
                }

                databaseConnection.ConnectionString = ConnectionString;
                databaseCommand.Connection = databaseConnection;
            }
        }

        public int AddParameter(string parameterName, object parameterValue)
        {
            var result = -1;
            var parameter = SqlFactory.CreateParameter();

            if (databaseCommand != null && parameter != null)
            {
                parameter.ParameterName = parameterName;
                parameter.Value = parameterValue;
                result = databaseCommand.Parameters.Add(parameter);
            }

            return result;
        }

        public int AddParameter(DbParameter parameter)
        {
            var result = -1;
            if (databaseCommand != null && parameter != null)
            {
                result = databaseCommand.Parameters.Add(parameter);
            }

            return result;
        }

        public void StatisticsEnabled()
        {
            if (databaseConnection is SqlConnection)
            {
                ((SqlConnection)databaseConnection).StatisticsEnabled = true;
            }
        }

        public IDictionary? RetrieveStatistics()
        {
            IDictionary? statistics = null;
            if (databaseConnection is SqlConnection)
            {
                statistics = ((SqlConnection)databaseConnection).RetrieveStatistics();
            }

            return statistics;
        }

        internal void ConnectionOpen()
        {
            DatabaseReConnection();
        }

        private void DatabaseReConnection()
        {
            if (databaseConnection != null && databaseConnection.State == ConnectionState.Closed)
            {
                if (databaseConnection.ConnectionString.Length == 0)
                {
                    databaseConnection.ConnectionString = connectionString;
                }

                databaseConnection.Open();
            }
        }

        public DbTransaction? BeginTransaction()
        {
            DatabaseReConnection();

            if (databaseConnection != null && databaseCommand != null)
            {
                databaseCommand.Transaction = databaseConnection.BeginTransaction();
            }

            return databaseCommand?.Transaction;
        }

        public DbTransaction? BeginTransaction(IsolationLevel isolationLevel)
        {
            DatabaseReConnection();

            if (databaseConnection != null && databaseCommand != null)
            {
                databaseCommand.Transaction = databaseConnection.BeginTransaction(isolationLevel);
            }

            return databaseCommand?.Transaction;
        }

        public void CommitTransaction()
        {
            if (databaseConnection != null && databaseCommand != null)
            {
                if (databaseCommand.Transaction != null)
                {
                    databaseCommand.Transaction.Commit();
                }
                databaseConnection.Close();
            }
        }

        public void RollbackTransaction()
        {
            if (databaseConnection != null && databaseCommand != null)
            {
                if (databaseCommand.Transaction != null)
                {
                    databaseCommand.Transaction.Rollback();
                }

                databaseConnection.Close();
            }
        }

        public int ExecuteNonQuery(string commandText)
        {
            return ExecuteNonQuery(commandText, CommandType.Text, ExecutingConnectionState.CloseOnExit);
        }

        public int ExecuteNonQuery(string commandText, ExecutingConnectionState connectionState)
        {
            return ExecuteNonQuery(commandText, CommandType.Text, connectionState);
        }

        public int ExecuteNonQuery(string commandText, CommandType dbCommandType)
        {
            return ExecuteNonQuery(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit);
        }

        public int ExecuteNonQuery(string commandText, CommandType dbCommandType, ExecutingConnectionState connectionState)
        {
            var result = -1;

            if (databaseConnection != null && databaseCommand != null)
            {
                try
                {
                    databaseCommand.CommandText = commandText;
                    databaseCommand.CommandType = dbCommandType;

                    DatabaseReConnection();

                    result = databaseCommand.ExecuteNonQuery();
                }
                catch (Exception exception)
                {
                    Log.Logger.Error(exception, "[{LogCategory}] 데이터베이스 거래 오류", "DatabaseFactory/ExecuteNonQuery");
                    throw;
                }
                finally
                {
                    SetOutputParameter();

                    databaseCommand.Parameters.Clear();

                    if (connectionState == ExecutingConnectionState.CloseOnExit)
                    {
                        databaseConnection.Close();
                    }
                }
            }

            return result;
        }

        public object? ExecuteScalar(string commandText)
        {
            return ExecuteScalar(commandText, CommandType.Text, ExecutingConnectionState.CloseOnExit);
        }

        public object? ExecuteScalar(string commandText, CommandType dbCommandType)
        {
            return ExecuteScalar(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit);
        }

        public object? ExecuteScalar(string commandText, ExecutingConnectionState connectionState)
        {
            return ExecuteScalar(commandText, CommandType.Text, connectionState);
        }

        public object? ExecuteScalar(string commandText, CommandType dbCommandType, ExecutingConnectionState connectionState)
        {
            object? result = null;
            if (databaseConnection != null && databaseCommand != null)
            {
                try
                {
                    databaseCommand.CommandText = commandText;
                    databaseCommand.CommandType = dbCommandType;

                    DatabaseReConnection();

                    result = databaseCommand.ExecuteScalar();
                }
                catch (Exception exception)
                {
                    Log.Logger.Error(exception, "[{LogCategory}] 데이터베이스 거래 오류", "DatabaseFactory/ExecuteScalar");
                    throw;
                }
                finally
                {
                    SetOutputParameter();

                    databaseCommand.Parameters.Clear();

                    if (connectionState == ExecutingConnectionState.CloseOnExit)
                    {
                        databaseConnection.Close();
                    }
                }
            }

            return result;
        }

        public DbDataReader? ExecuteReader(string commandText)
        {
            return ExecuteReader(commandText, CommandType.Text, ExecutingConnectionState.CloseOnExit);
        }

        public DbDataReader? ExecuteReader(string commandText, CommandType dbCommandType)
        {
            return ExecuteReader(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit);
        }

        public DbDataReader? ExecuteReader(string commandText, CommandType dbCommandType, CommandBehavior commandBehavior)
        {
            DbDataReader? result = null;
            if (databaseConnection != null && databaseCommand != null)
            {
                try
                {
                    databaseCommand.CommandText = commandText;
                    databaseCommand.CommandType = dbCommandType;

                    DatabaseReConnection();

                    result = databaseCommand.ExecuteReader(commandBehavior);
                }
                catch (Exception exception)
                {
                    Log.Logger.Error(exception, "[{LogCategory}] 데이터베이스 거래 오류", "DatabaseFactory/ExecuteReader");
                    throw;
                }
                finally
                {
                    SetOutputParameter();

                    databaseCommand.Parameters.Clear();
                }
            }

            return result;
        }

        public DbDataReader? ExecuteReader(string commandText, ExecutingConnectionState connectionState)
        {
            return ExecuteReader(commandText, CommandType.Text, connectionState);
        }

        public DbDataReader? ExecuteReader(string commandText, CommandType dbCommandType, ExecutingConnectionState connectionState)
        {
            DbDataReader? result = null;
            if (databaseConnection != null && databaseCommand != null)
            {
                try
                {
                    databaseCommand.CommandText = commandText;
                    databaseCommand.CommandType = dbCommandType;

                    DatabaseReConnection();

                    if (connectionState == ExecutingConnectionState.CloseOnExit)
                    {
                        result = databaseCommand.ExecuteReader(CommandBehavior.CloseConnection);
                    }
                    else
                    {
                        result = databaseCommand.ExecuteReader();
                    }

                }
                catch (Exception exception)
                {
                    Log.Logger.Error(exception, "[{LogCategory}] 데이터베이스 거래 오류", "DatabaseFactory/ExecuteReader");
                    throw;

                }
                finally
                {
                    SetOutputParameter();

                    databaseCommand.Parameters.Clear();
                }
            }

            return result;
        }

        public DataSet? ExecuteDataSet(string commandText, bool hasSchema = false)
        {
            return ExecuteDataSet(commandText, CommandType.Text, ExecutingConnectionState.CloseOnExit, hasSchema);
        }

        public DataSet? ExecuteDataSet(string commandText, CommandType dbCommandType, bool hasSchema = false)
        {
            return ExecuteDataSet(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit, hasSchema);
        }

        public DataSet? ExecuteDataSet(string commandText, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            return ExecuteDataSet(commandText, CommandType.Text, connectionState, hasSchema);
        }

        public DataSet? ExecuteDataSet(string commandText, CommandType dbCommandType, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            var dataAdapter = SqlFactory.CreateDataAdapter();
            if (dataAdapter != null && databaseConnection != null && databaseCommand != null)
            {
                databaseCommand.CommandText = commandText;
                databaseCommand.CommandType = dbCommandType;

                dataAdapter.SelectCommand = databaseCommand;

                using (var result = new DataSet())
                {
                    try
                    {
                        DatabaseReConnection();

                        if (hasSchema == true)
                        {
                            dataAdapter.FillSchema(result, SchemaType.Mapped);
                        }
                        else
                        {
                            dataAdapter.Fill(result);
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Logger.Error(exception, "[{LogCategory}] 데이터베이스 거래 오류", "DatabaseFactory/ExecuteDataSet");
                        throw;
                    }
                    finally
                    {
                        SetOutputParameter();

                        databaseCommand.Parameters.Clear();

                        if (connectionState == ExecutingConnectionState.CloseOnExit)
                        {
                            if (databaseConnection.State == ConnectionState.Open)
                            {
                                databaseConnection.Close();
                            }
                        }
                    }

                    return result;
                }
            }
            else
            {
                return null;
            }
        }

        public DataTable? ExecuteDataTable(string commandText, bool hasSchema = false)
        {
            return ExecuteDataTable(commandText, CommandType.Text, ExecutingConnectionState.CloseOnExit, hasSchema);
        }

        public DataTable? ExecuteDataTable(string commandText, CommandType dbCommandType, bool hasSchema = false)
        {
            return ExecuteDataTable(commandText, dbCommandType, ExecutingConnectionState.CloseOnExit, hasSchema);
        }

        public DataTable? ExecuteDataTable(string commandText, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            return ExecuteDataTable(commandText, CommandType.Text, connectionState, hasSchema);
        }

        public DataTable? ExecuteDataTable(string commandText, CommandType dbCommandType, ExecutingConnectionState connectionState, bool hasSchema = false)
        {
            var dataAdapter = SqlFactory.CreateDataAdapter();
            if (dataAdapter != null && databaseConnection != null && databaseCommand != null)
            {
                databaseCommand.CommandText = commandText;
                databaseCommand.CommandType = dbCommandType;

                dataAdapter.SelectCommand = databaseCommand;

                using (var result = new DataTable())
                {
                    try
                    {
                        DatabaseReConnection();

                        if (hasSchema == true)
                        {
                            dataAdapter.FillSchema(result, SchemaType.Mapped);
                        }
                        else
                        {
                            dataAdapter.Fill(result);
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Logger.Error(exception, "[{LogCategory}] 데이터베이스 거래 오류", "DatabaseFactory/ExecuteDataTable");
                        throw;
                    }
                    finally
                    {
                        SetOutputParameter();

                        databaseCommand.Parameters.Clear();

                        if (connectionState == ExecutingConnectionState.CloseOnExit)
                        {
                            if (databaseConnection.State == ConnectionState.Open)
                            {
                                databaseConnection.Close();
                            }
                        }
                    }

                    return result;
                }
            }
            else
            {
                return null;
            }
        }

        private void SetOutputParameter()
        {
            if (IsOutputParameter == true && databaseCommand != null && outputCommand != null)
            {
                outputCommand.Parameters.Clear();
                foreach (DbParameter dbParameter in databaseCommand.Parameters)
                {
                    var parameter = SqlFactory.CreateParameter();
                    if (parameter != null)
                    {
                        parameter.ParameterName = dbParameter.ParameterName;
                        parameter.Value = dbParameter.Value;

                        outputCommand.Parameters.Add(parameter);
                    }
                }

                IsOutputParameter = false;
            }
        }

        public void Dispose()
        {
            Dispose(true);

            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool isFromDispose)
        {
            if (isBaseDisposedResources == false)
            {
                if (isFromDispose == true)
                {
                    if (outputCommand != null)
                    {
                        outputCommand.Dispose();
                    }

                    if (databaseCommand != null)
                    {
                        databaseCommand.Dispose();
                    }

                    if (databaseConnection != null)
                    {
                        if (databaseConnection.State == ConnectionState.Open)
                        {
                            databaseConnection.Close();
                        }

                        databaseConnection.Dispose();
                    }
                }

                isBaseDisposedResources = true;
            }
        }
    }
}
