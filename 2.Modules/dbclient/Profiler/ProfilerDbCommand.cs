using System;
using System.Collections;
using System.Data;
using System.Data.Common;
using System.Linq.Expressions;
using System.Reflection;

namespace dbclient.Profiler
{
    public class ProfilerDbCommand : DbCommand
    {
        private DbConnection connection;
        private DbTransaction? transaction;
        private readonly IAdoNetProfiler profiler;
        private static readonly Hashtable bindByNameGetCache = new Hashtable();
        private static readonly Hashtable bindByNameSetCache = new Hashtable();

        public override string CommandText
        {
            get { return WrappedCommand.CommandText; }
#pragma warning disable CS8765
            set { WrappedCommand.CommandText = value; }
#pragma warning restore CS8765
        }

        public override int CommandTimeout
        {
            get { return WrappedCommand.CommandTimeout; }
            set { WrappedCommand.CommandTimeout = value; }
        }

        public override CommandType CommandType
        {
            get { return WrappedCommand.CommandType; }
            set
            {
                if (value != CommandType.Text &&
                    value != CommandType.StoredProcedure &&
                    value != CommandType.TableDirect)
                {
                    throw new ArgumentOutOfRangeException(nameof(value));
                }

                WrappedCommand.CommandType = value;
            }
        }

        protected override DbConnection DbConnection
        {
            get { return connection; }
#pragma warning disable CS8765
            set
#pragma warning restore CS8765
            {
                connection = value;
                var adoNetProfilerDbConnection = value as ProfilerDbConnection;
                WrappedCommand.Connection = (adoNetProfilerDbConnection == null) ? value : adoNetProfilerDbConnection.WrappedConnection;
            }
        }

        protected override DbParameterCollection DbParameterCollection
        {
            get
            {
                return WrappedCommand.Parameters;
            }
        }

        protected override DbTransaction? DbTransaction
        {
            get { return transaction; }
            set
            {
                transaction = value;

                var adoNetProfilerDbTransaction = value as ProfilerDbTransaction;
                WrappedCommand.Transaction = (adoNetProfilerDbTransaction == null) ? value : adoNetProfilerDbTransaction.WrappedTransaction;
            }
        }

        public override bool DesignTimeVisible
        {
            get { return WrappedCommand.DesignTimeVisible; }
            set { WrappedCommand.DesignTimeVisible = value; }
        }

        public override UpdateRowSource UpdatedRowSource
        {
            get { return WrappedCommand.UpdatedRowSource; }
            set { WrappedCommand.UpdatedRowSource = value; }
        }

        public DbCommand WrappedCommand { get; private set; }

        public bool BindByName
        {
            get
            {
                var cache = GetBindByNameGetAction(WrappedCommand.GetType());

                return cache != null ? cache.Invoke(WrappedCommand) : false;
            }
            set
            {
                var cache = GetBindByNameSetAction(WrappedCommand.GetType());

                if (cache != null)
                {
                    cache.Invoke(WrappedCommand, value);
                }
            }
        }

        internal ProfilerDbCommand(DbCommand? command, DbConnection? connection, IAdoNetProfiler? profiler)
        {
            if (command == null)
            {
                throw new ArgumentNullException(nameof(command));
            }

            if (connection == null || profiler == null)
            {
                throw new ArgumentNullException("DbConnection 또는 IAdoNetProfiler 확인 필요");
            }

            WrappedCommand = command;

            this.connection = connection;
            this.profiler = profiler;
        }

        protected override DbDataReader ExecuteDbDataReader(CommandBehavior behavior)
        {
            if (profiler == null || !profiler.IsEnabled)
            {
                return WrappedCommand.ExecuteReader(behavior);
            }

            profiler.OnExecuteReaderStart(this);

            try
            {
                var dbReader = WrappedCommand.ExecuteReader(behavior);

                return new ProfilerDbDataReader(dbReader, profiler);
            }
            catch (Exception exception)
            {
                profiler.OnCommandError(this, exception);
                throw;
            }
        }

        public override int ExecuteNonQuery()
        {
            if (profiler == null || !profiler.IsEnabled)
            {
                return WrappedCommand.ExecuteNonQuery();
            }

            profiler.OnExecuteNonQueryStart(this);

            var result = default(int?);

            try
            {
                result = WrappedCommand.ExecuteNonQuery();

                return result.Value;
            }
            catch (Exception exception)
            {
                profiler.OnCommandError(this, exception);
                throw;
            }
            finally
            {
                profiler.OnExecuteNonQueryFinish(this, result ?? 0);
            }
        }

        public override object? ExecuteScalar()
        {
            if (profiler == null || !profiler.IsEnabled)
            {
                return WrappedCommand.ExecuteScalar();
            }

            profiler.OnExecuteScalarStart(this);

            object? result = null;

            try
            {
                result = WrappedCommand.ExecuteScalar();

                return result;
            }
            catch (Exception exception)
            {
                profiler.OnCommandError(this, exception);
                throw;
            }
            finally
            {
                profiler.OnExecuteScalarFinish(this, result);
            }
        }

        public override void Cancel()
        {
            WrappedCommand.Cancel();
        }

        public override void Prepare()
        {
            WrappedCommand.Prepare();
        }

        protected override DbParameter CreateDbParameter()
        {
            return WrappedCommand.CreateParameter();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                WrappedCommand?.Dispose();
            }

            base.Dispose(disposing);
        }

        private Func<DbCommand, bool>? GetBindByNameGetAction(Type commandType)
        {
            lock (bindByNameGetCache)
            {
                if (bindByNameGetCache[commandType] is Func<DbCommand, bool> cache)
                {
                    return cache;
                }

                var property = commandType
                    .GetTypeInfo()
                    .GetProperty("BindByName", BindingFlags.Public | BindingFlags.Instance);

                if (property != null
                    && property.CanRead
                    && property.PropertyType == typeof(bool)
                    && property.GetIndexParameters().Length == 0
                    && property.GetGetMethod() != null)
                {
                    var target = Expression.Parameter(typeof(DbCommand), "target");
                    var prop = Expression.PropertyOrField(Expression.Convert(target, commandType), "BindByName");

                    var action = Expression.Lambda<Func<DbCommand, bool>>(Expression.Convert(prop, typeof(bool)), target).Compile();

                    bindByNameGetCache.Add(commandType, action);

                    return action;
                }
            }

            return null;
        }

        private Action<DbCommand, bool>? GetBindByNameSetAction(Type commandType)
        {
            lock (bindByNameSetCache)
            {
                if (bindByNameSetCache[commandType] is Action<DbCommand, bool> cache)
                {
                    return cache;
                }

                var property = commandType
                    .GetTypeInfo()
                    .GetProperty("BindByName", BindingFlags.Public | BindingFlags.Instance);

                if (property != null
                    && property.CanWrite
                    && property.PropertyType == typeof(bool)
                    && property.GetIndexParameters().Length == 0
                    && property.GetSetMethod() != null)
                {
                    var target = Expression.Parameter(typeof(DbCommand), "target");
                    var value = Expression.Parameter(typeof(bool), "value");

                    var left = Expression.PropertyOrField(Expression.Convert(target, commandType), "BindByName");
                    var right = Expression.Convert(value, left.Type);

                    var action = Expression.Lambda<Action<DbCommand, bool>>(Expression.Assign(left, right), target, value).Compile();

                    bindByNameSetCache.Add(commandType, action);

                    return action;
                }
            }

            return null;
        }
    }
}
