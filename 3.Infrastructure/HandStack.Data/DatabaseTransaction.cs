using System;
using System.Transactions;

namespace HandStack.Data
{
    public sealed class DatabaseTransaction : IDisposable
    {
        private TransactionScope transactionScope;

        private Transaction? transaction;

        private TransactionScopeOption transactionScopeOption;

        private TimeSpan transactionScopeTimeout;

        private TransactionOptions transactionOptions;

        private EnterpriseServicesInteropOption interopOption;

        private DataProviders dataProviders;

        private bool IsSupportTransaction(DataProviders providers)
        {
            bool result = false;
            switch (providers)
            {
                case DataProviders.SqlServer:
                    result = true;
                    break;
                case DataProviders.Oracle:
                    result = true;
                    break;
                case DataProviders.MySQL:
                    result = true;
                    break;
                case DataProviders.PostgreSQL:
                    result = true;
                    break;
                case DataProviders.SQLite:
                    result = true;
                    break;
                default:
                    result = false;
                    break;
            }

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
            if (transactionScope != null)
            {
                transactionScope.Complete();
            }
        }

        public void Dispose()
        {
            if (transactionScope != null)
            {
                transactionScope.Dispose();
            }
        }
    }
}
