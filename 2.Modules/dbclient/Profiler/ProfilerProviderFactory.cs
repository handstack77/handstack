using System;
using System.Data.Common;
using System.Reflection;

namespace dbclient.Profiler
{
    public abstract class ProfilerProviderFactory : DbProviderFactory
    {
    }

    public class ProfilerProviderFactory<TProviderFactory> : ProfilerProviderFactory, IServiceProvider
        where TProviderFactory : DbProviderFactory
    {
        public static readonly ProfilerProviderFactory<TProviderFactory> Instance = new ProfilerProviderFactory<TProviderFactory>();

        public TProviderFactory? WrappedProviderFactory { get; }

        public override bool CanCreateDataSourceEnumerator
        {
            get
            {
                return WrappedProviderFactory == null ? false : WrappedProviderFactory.CanCreateDataSourceEnumerator;
            }
        }

        public ProfilerProviderFactory()
        {
            var field = typeof(TProviderFactory).GetField("Instance", BindingFlags.Public | BindingFlags.Static);

            if (field == null)
            {
                throw new NotSupportedException("Provider doesn't have Instance property.");
            }

            WrappedProviderFactory = field.GetValue(null) as TProviderFactory;
        }

        public override DbCommand? CreateCommand()
        {
            var command = WrappedProviderFactory?.CreateCommand();
            var connection = WrappedProviderFactory?.CreateConnection() as ProfilerDbConnection;
            var profiler = connection?.Profiler;

            return new ProfilerDbCommand(command, connection, profiler);
        }

        public override DbCommandBuilder? CreateCommandBuilder()
        {
            return WrappedProviderFactory?.CreateCommandBuilder();
        }

        public override DbConnection? CreateConnection()
        {
            var connection = WrappedProviderFactory?.CreateConnection();

            return new ProfilerDbConnection(connection);
        }

        public override DbConnectionStringBuilder? CreateConnectionStringBuilder()
        {
            return WrappedProviderFactory?.CreateConnectionStringBuilder();
        }

        public override DbDataAdapter? CreateDataAdapter()
        {
            return WrappedProviderFactory?.CreateDataAdapter();
        }

        public override DbDataSourceEnumerator? CreateDataSourceEnumerator()
        {
            return WrappedProviderFactory?.CreateDataSourceEnumerator();
        }

        public override DbParameter? CreateParameter()
        {
            return WrappedProviderFactory?.CreateParameter();
        }

        public object? GetService(Type serviceType)
        {
            if (serviceType == GetType())
            {
                return WrappedProviderFactory;
            }

            var factory = WrappedProviderFactory as IServiceProvider;
            var service = factory?.GetService(serviceType);

            return service;
        }
    }
}
