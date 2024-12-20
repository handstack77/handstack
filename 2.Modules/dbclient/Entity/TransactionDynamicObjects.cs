using System.Data.Common;

using HandStack.Data;
using HandStack.Web.MessageContract.DataObject;

namespace dbclient.Entity
{
    public class TransactionDynamicObjects
    {
        public QueryObject DynamicTransaction = new QueryObject();
        public StatementMap Statement = new StatementMap();
        public string? ConnectionString;
        public string? TransactionIsolationLevel;
        public DataProviders DataProvider;
    }

    public class DatabaseTransactionObjects
    {
        public DataProviders DataProvider;
        public DatabaseFactory? ConnectionFactory;
        public DbTransaction? DatabaseTransaction;
    }
}
