using System;
using System.Transactions;

namespace HandStack.Data
{
    public sealed class DatabaseTransaction : IDisposable
    {
        private readonly TransactionScope transactionScope;

        private readonly Transaction? transaction;

        private readonly TransactionScopeOption transactionScopeOption;

        private readonly TimeSpan transactionScopeTimeout;

        private readonly TransactionOptions transactionOptions;

        private readonly EnterpriseServicesInteropOption interopOption;

        private DataProviders dataProviders;

        private bool IsSupportTransaction(DataProviders providers)
        {
            var result = providers switch
            {
                DataProviders.SqlServer => true,
                DataProviders.Oracle => true,
                DataProviders.MySQL => true,
                DataProviders.PostgreSQL => true,
                DataProviders.SQLite => true,
                _ => false,
            };

            dataProviders = providers;
            return result;
        }

        public DatabaseTransaction()
        {
            this.transactionScope = new TransactionScope();
            this.transaction = null;
            this.transactionScopeOption = TransactionScopeOption.Suppress;
            this.transactionScopeTimeout = TimeSpan.Zero;
            this.transactionOptions = new TransactionOptions();
            this.interopOption = EnterpriseServicesInteropOption.None;
            this.dataProviders = DataProviders.SqlServer;
        }

        public DatabaseTransaction(DataProviders dataProviders = DataProviders.SqlServer,
            Transaction? transactionToUse = null,
            TimeSpan? scopeTimeout = null,
            TransactionScopeOption scopeOption = TransactionScopeOption.Suppress,
            TransactionOptions transactionOptions = new TransactionOptions(),
            EnterpriseServicesInteropOption InteropOption = EnterpriseServicesInteropOption.None)
        {
            this.transaction = transactionToUse;
            this.transactionScopeTimeout = scopeTimeout == null ? TimeSpan.Zero : (TimeSpan)scopeTimeout;
            this.transactionScopeOption = scopeOption;
            this.transactionOptions = transactionOptions;
            this.interopOption = InteropOption;

            if (IsSupportTransaction(dataProviders) == true)
            {
                transactionScope = new TransactionScope(transactionScopeOption, this.transactionOptions, interopOption);
            }
            else
            {
                transactionScope = new TransactionScope();
            }
        }

        public void Complete()
        {
            transactionScope?.Complete();
        }

        public void Dispose()
        {
            transactionScope?.Dispose();
        }
    }
}
