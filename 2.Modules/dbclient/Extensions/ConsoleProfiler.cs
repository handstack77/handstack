using System;
using System.Data.Common;
using System.Data.SQLite;
using System.Diagnostics;
using System.IO;
using System.Text;

using dbclient.Entity;
using dbclient.Profiler;

using HandStack.Data.ExtensionMethod;

using Microsoft.Data.SqlClient;

using MySql.Data.MySqlClient;

using Npgsql;

using Oracle.ManagedDataAccess.Client;

namespace dbclient.Extensions
{
    public class ConsoleProfiler : IAdoNetProfiler
    {
        private string globalID = "";
        private string queryID;

        private string? executeSQL;

        public string? ExecuteSQL
        {
            get
            {
                return executeSQL;
            }
            set
            {
                executeSQL = value == null ? null : value.Trim();
            }
        }

        private Stopwatch? stopwatch;

        public bool IsEnabled { get; }

        private Stopwatch? connectionStopwatch;

        private Stopwatch? transactionStopwatch;

        private DbCommand? command;

        private bool IsLogger = false;

        public ConsoleProfiler(string globalID, string queryID = "", string? logFilePath = null)
        {
            IsEnabled = true;
            this.globalID = globalID;
            this.queryID = queryID;

            if (!string.IsNullOrWhiteSpace(logFilePath))
            {
                var fileInfo = new FileInfo(logFilePath);
                IsLogger = true;
            }
        }

        public void OnOpening(DbConnection connection)
        {
            stopwatch = Stopwatch.StartNew();
            connectionStopwatch = Stopwatch.StartNew();
        }

        public void OnOpened(DbConnection connection)
        {
            if (stopwatch != null)
            {
                stopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Connection Open Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
            }
        }

        public void OnClosing(DbConnection connection)
        {
            stopwatch = Stopwatch.StartNew();
        }

        public void OnClosed(DbConnection connection)
        {
            if (stopwatch != null)
            {
                stopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Connection Close Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
            }

            if (connectionStopwatch != null)
            {
                connectionStopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Connection Lifetime - {connectionStopwatch.Elapsed.TotalMilliseconds} ms");
            }
        }

        public void OnStartingTransaction(DbConnection connection)
        {
            stopwatch = Stopwatch.StartNew();
            transactionStopwatch = Stopwatch.StartNew();
        }

        public void OnStartedTransaction(DbTransaction transaction)
        {
            if (stopwatch != null)
            {
                stopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Transaction Start Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
            }
        }

        public void OnCommitting(DbTransaction transaction)
        {
            stopwatch = Stopwatch.StartNew();
        }

        public void OnCommitted(DbConnection connection)
        {
            if (stopwatch != null)
            {
                stopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Transaction Commit Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
            }

            if (transactionStopwatch != null)
            {
                transactionStopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Transaction Lifetime - {transactionStopwatch.Elapsed.TotalMilliseconds} ms");
            }
        }

        public void OnRollbacking(DbTransaction transaction)
        {
            stopwatch = Stopwatch.StartNew();
        }

        public void OnRollbacked(DbConnection connection)
        {
            if (stopwatch != null)
            {
                stopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Transaction Rollback Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
            }

            if (transactionStopwatch != null)
            {
                transactionStopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Transaction Lifetime - {transactionStopwatch.Elapsed.TotalMilliseconds} ms");
            }
        }

        public void OnExecuteReaderStart(DbCommand command)
        {
            var providerName = "";
            var connection = command.Connection as ProfilerDbConnection;
            if (connection != null)
            {
                providerName = connection.WrappedConnection.ToString();
            }

            ExecuteSQL = command.CommandAsSQL(providerName);

            this.command = command;
            stopwatch = Stopwatch.StartNew();
        }

        public void OnReaderFinish(DbDataReader reader, int records)
        {
            if (stopwatch != null && command != null)
            {
                stopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Command Info - Command : {command.CommandText}, Records : {records}, Duration {stopwatch.Elapsed.TotalMilliseconds} ms");
            }
        }

        public void OnExecuteNonQueryStart(DbCommand command)
        {
            this.command = command;
            stopwatch = Stopwatch.StartNew();
        }

        public void OnExecuteNonQueryFinish(DbCommand command, int executionRestlt)
        {

            if (stopwatch != null && command != null)
            {
                stopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Command Info - Command : {command.CommandText}, Result : {executionRestlt}, Duration {stopwatch.Elapsed.TotalMilliseconds} ms");
            }
        }

        public void OnExecuteScalarStart(DbCommand command)
        {
            this.command = command;
            stopwatch = Stopwatch.StartNew();
        }

        public void OnExecuteScalarFinish(DbCommand command, object? executionRestlt)
        {
            if (stopwatch != null && command != null)
            {
                stopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Information($"Command Info - Command : {command.CommandText}, Result : {executionRestlt}, Duration {stopwatch.Elapsed.TotalMilliseconds} ms");
            }
        }

        public void OnCommandError(DbCommand command, Exception exception)
        {
            if (ModuleConfiguration.IsProfileLogging == true && IsLogger == true)
            {
                var errorDetails = ExtractDatabaseErrorInfo(exception);
                ModuleConfiguration.ProfileLogger?.Error($"OnCommandError Request GlobalID: {globalID}, Command : {command.CommandText}, ErrorDetails: {errorDetails}, Exception: {exception.Message}");
            }
        }

        private string ExtractDatabaseErrorInfo(Exception exception)
        {
            var errorBuilder = new StringBuilder();

            switch (exception)
            {
                case SqlException sqlException:
                    errorBuilder.AppendLine($"SqlState: {sqlException.State}");
                    errorBuilder.AppendLine($"Severity: {sqlException.Class}");
                    errorBuilder.AppendLine($"LineNumber: {sqlException.LineNumber}");
                    errorBuilder.AppendLine($"Position: {sqlException.Number}");
                    break;

                case MySqlException mysqlException:
                    errorBuilder.AppendLine($"SqlState: {mysqlException.SqlState}");
                    errorBuilder.AppendLine($"Number: {mysqlException.Number}");
                    break;

                case OracleException oracleException:
                    errorBuilder.AppendLine($"SqlState: {oracleException.SqlState}");
                    errorBuilder.AppendLine($"Number: {oracleException.Number}");
                    break;

                case PostgresException pgException:
                    errorBuilder.AppendLine($"SqlState: {pgException.SqlState}");
                    errorBuilder.AppendLine($"Severity: {pgException.Severity}");
                    errorBuilder.AppendLine($"LineNumber: {pgException.Line}");
                    errorBuilder.AppendLine($"Position: {pgException.Position}");
                    break;

                case SQLiteException sqliteException:
                    errorBuilder.AppendLine($"SqlState: {sqliteException.SqlState}");
                    errorBuilder.AppendLine($"ResultCode: {sqliteException.ResultCode.ToString()}");
                    break;

                default:
                    break;
            }

            return errorBuilder.ToString().Trim();
        }
    }
}
