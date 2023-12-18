using System;
using System.Data;
using System.Data.Common;

namespace dbclient.Profiler
{
    public class ProfilerDbTransaction : DbTransaction
    {
        private DbConnection connection;
        private readonly IAdoNetProfiler profiler;

        protected override DbConnection DbConnection => connection;

        public override IsolationLevel IsolationLevel => WrappedTransaction.IsolationLevel;

        public DbTransaction WrappedTransaction { get; private set; }

        internal ProfilerDbTransaction(DbTransaction transaction, DbConnection connection, IAdoNetProfiler profiler)
        {
            if (transaction == null) throw new ArgumentNullException(nameof(transaction));
            if (connection == null) throw new ArgumentNullException(nameof(connection));

            WrappedTransaction = transaction;

            this.connection = connection;
            this.profiler = profiler;
        }

        public override void Commit()
        {
            if (profiler == null || !profiler.IsEnabled)
            {
                CommitWrappedTransaction();

                return;
            }

            profiler.OnCommitting(this);

            CommitWrappedTransaction();

            profiler.OnCommitted(connection);
        }

        private void CommitWrappedTransaction()
        {
            WrappedTransaction.Commit();
            WrappedTransaction.Dispose();
        }

        public override void Rollback()
        {
            if (profiler == null || !profiler.IsEnabled)
            {
                RollbackWrappedTransaction();

                return;
            }

            profiler.OnRollbacking(this);

            RollbackWrappedTransaction();

            profiler.OnRollbacked(connection);
        }

        private void RollbackWrappedTransaction()
        {
            WrappedTransaction.Rollback();
            WrappedTransaction.Dispose();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (WrappedTransaction != null)
                {
                    Rollback();
                }
            }

            base.Dispose(disposing);
        }
    }
}
