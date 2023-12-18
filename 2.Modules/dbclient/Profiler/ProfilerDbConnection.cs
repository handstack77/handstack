using System;
using System.Data;
using System.Data.Common;

namespace dbclient.Profiler
{
    public class ProfilerDbConnection : DbConnection
    {
        private readonly bool isLeaveOpen;

        private bool isDisposed;

        public override string ConnectionString
        {
            get { return WrappedConnection.ConnectionString; }
#pragma warning disable CS8765
            set { WrappedConnection.ConnectionString = value; }
#pragma warning restore CS8765
        }

        public override int ConnectionTimeout => WrappedConnection.ConnectionTimeout;

        public override string Database => WrappedConnection.Database;

        public override string DataSource => WrappedConnection.DataSource;

        public override string ServerVersion => WrappedConnection.ServerVersion;

        public override ConnectionState State => WrappedConnection.State;

        public DbConnection WrappedConnection { get; private set; }

        public IAdoNetProfiler? Profiler { get; private set; }

        public ProfilerDbConnection(Func<DbConnection> connectionFactory)
            : this(connectionFactory, ProfilerFactory.GetProfiler())
        {
        }

        public ProfilerDbConnection(DbConnection? connection)
            : this(connection, ProfilerFactory.GetProfiler())
        {
        }

        public ProfilerDbConnection(Func<DbConnection> connectionFactory, IAdoNetProfiler? profiler)
        {
            isLeaveOpen = false;

            WrappedConnection = connectionFactory?.Invoke() ?? throw new ArgumentNullException(nameof(connectionFactory));
            Profiler = profiler;

            WrappedConnection.StateChange += StateChangeHandler;
        }

        public ProfilerDbConnection(DbConnection? connection, IAdoNetProfiler? profiler)
            : this(connection, profiler, false)
        {
        }

        public ProfilerDbConnection(DbConnection? connection, IAdoNetProfiler? profiler, bool leaveOpen)
        {
            isLeaveOpen = leaveOpen;

            WrappedConnection = connection ?? throw new ArgumentNullException(nameof(connection));
            Profiler = profiler;

            WrappedConnection.StateChange += StateChangeHandler;
        }

        public override void ChangeDatabase(string databaseName)
        {
            WrappedConnection.ChangeDatabase(databaseName);
        }

        public override void Close()
        {
            if (Profiler == null || !Profiler.IsEnabled)
            {
                WrappedConnection.Close();

                return;
            }

            Profiler.OnClosing(this);

            WrappedConnection.Close();

            Profiler.OnClosed(this);
        }

        public override DataTable GetSchema()
        {
            return WrappedConnection.GetSchema();
        }

        public override DataTable GetSchema(string collectionName)
        {
            return WrappedConnection.GetSchema(collectionName);
        }

        public override DataTable GetSchema(string collectionName, string?[] restrictionValues)
        {
            return WrappedConnection.GetSchema(collectionName, restrictionValues);
        }

        public override void Open()
        {
            if (Profiler == null || !Profiler.IsEnabled)
            {
                WrappedConnection.Open();

                return;
            }

            Profiler.OnOpening(this);

            WrappedConnection.Open();

            Profiler.OnOpened(this);
        }

        protected override DbTransaction BeginDbTransaction(IsolationLevel isolationLevel)
        {
            if (Profiler == null || !Profiler.IsEnabled)
            {
                return WrappedConnection.BeginTransaction(isolationLevel);
            }

            Profiler.OnStartingTransaction(this);

            var transaction = WrappedConnection.BeginTransaction(isolationLevel);

            Profiler.OnStartedTransaction(transaction);

            return new ProfilerDbTransaction(transaction, WrappedConnection, Profiler);
        }

        protected override DbCommand CreateDbCommand()
        {
            return new ProfilerDbCommand(WrappedConnection.CreateCommand(), this, Profiler);
        }

        protected override void Dispose(bool disposing)
        {
            if (isDisposed)
            {
                return;
            }

            if (disposing)
            {
                if (!isLeaveOpen)
                {
                    if (WrappedConnection != null)
                    {
                        if (State != ConnectionState.Closed)
                        {
                            Close();
                        }

                        WrappedConnection.StateChange -= StateChangeHandler;
                        WrappedConnection.Dispose();
                    }
                }
            }

            base.Dispose(disposing);

            isDisposed = true;
        }

        private void StateChangeHandler(object sender, StateChangeEventArgs stateChangeEventArguments)
        {
            OnStateChange(stateChangeEventArguments);
        }
    }
}
