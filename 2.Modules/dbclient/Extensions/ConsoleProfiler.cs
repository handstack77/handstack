using System;
using System.Data.Common;
using System.Diagnostics;
using System.IO;

using dbclient.Entity;
using dbclient.Profiler;

using HandStack.Data.ExtensionMethod;
using HandStack.Web.Extensions;

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

            if (string.IsNullOrEmpty(logFilePath) != true)
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
                ModuleConfiguration.ProfileLogger?.Debug($"Connection Open Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
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
                ModuleConfiguration.ProfileLogger?.Debug($"Connection Close Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
            }

            if (connectionStopwatch != null)
            {
                connectionStopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Debug($"Connection Lifetime - {connectionStopwatch.Elapsed.TotalMilliseconds} ms");
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
                ModuleConfiguration.ProfileLogger?.Debug($"Transaction Start Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
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
                ModuleConfiguration.ProfileLogger?.Debug($"Transaction Commit Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
            }

            if (transactionStopwatch != null)
            {
                transactionStopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Debug($"Transaction Lifetime - {transactionStopwatch.Elapsed.TotalMilliseconds} ms");
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
                ModuleConfiguration.ProfileLogger?.Debug($"Transaction Rollback Duration - {stopwatch.Elapsed.TotalMilliseconds} ms");
            }

            if (transactionStopwatch != null)
            {
                transactionStopwatch.Stop();
                ModuleConfiguration.ProfileLogger?.Debug($"Transaction Lifetime - {transactionStopwatch.Elapsed.TotalMilliseconds} ms");
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
                ModuleConfiguration.ProfileLogger?.Debug($"Command Info - Command : {command.CommandText}, Records : {records}, Duration {stopwatch.Elapsed.TotalMilliseconds} ms");
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
                ModuleConfiguration.ProfileLogger?.Debug($"Command Info - Command : {command.CommandText}, Result : {executionRestlt}, Duration {stopwatch.Elapsed.TotalMilliseconds} ms");
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
                ModuleConfiguration.ProfileLogger?.Debug($"Command Info - Command : {command.CommandText}, Result : {executionRestlt}, Duration {stopwatch.Elapsed.TotalMilliseconds} ms");
            }
        }

        public void OnCommandError(DbCommand command, Exception exception)
        {
            if (ModuleConfiguration.IsProfileLogging == true && IsLogger == true)
            {
                ModuleConfiguration.ProfileLogger?.Error($"OnCommandError Request GlobalID: {globalID}, SQL: {exception.ToMessage()}");
            }
        }
    }
}
