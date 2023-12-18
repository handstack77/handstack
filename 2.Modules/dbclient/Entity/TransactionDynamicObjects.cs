using System.Data;
using System.Data.Common;

using dbclient.Extensions;

using HandStack.Data;
using HandStack.Web.MessageContract.DataObject;

namespace dbclient.Entity
{
    public class TransactionDynamicObjects
    {
        public QueryObject DynamicTransaction = new QueryObject();
        public StatementMap Statement = new StatementMap();
        public string? ConnectionString;
        public DataProviders DataProvider;
        public DatabaseFactory? ConnectionFactory;
        public DbTransaction? DatabaseTransaction;
        public IDataReader? MainReader;
        public DatabaseFactory? PretreatmentConnectionFactory;
        public DbTransaction? PretreatmentDatabaseTransaction;
        public IDataReader? PretreatmentReader;
    }
}
