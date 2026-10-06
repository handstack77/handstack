using System.Data.Common;

using HandStack.Data;
using HandStack.Web.MessageContract.DataObject;

namespace dbclient.Entity
{
    public record TransactionDynamicObjects
    {
        public QueryObject DynamicTransaction = new();
        public StatementMap Statement = new();
        public string? ConnectionString;
        public string? TransactionIsolationLevel;
        public DataProviders DataProvider;
    }

    public record DatabaseTransactionObjects
    {
        public DataProviders DataProvider;
        public DatabaseFactory? ConnectionFactory;
        public DbTransaction? DatabaseTransaction;
    }
}
