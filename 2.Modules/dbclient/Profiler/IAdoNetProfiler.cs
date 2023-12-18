using System;
using System.Data.Common;

namespace dbclient.Profiler
{
    public interface IAdoNetProfiler
    {
        bool IsEnabled { get; }

        void OnOpening(DbConnection connection);

        void OnOpened(DbConnection connection);

        void OnClosing(DbConnection connection);

        void OnClosed(DbConnection connection);

        void OnStartingTransaction(DbConnection connection);

        void OnStartedTransaction(DbTransaction transaction);

        void OnCommitting(DbTransaction transaction);

        void OnCommitted(DbConnection connection);

        void OnRollbacking(DbTransaction transaction);

        void OnRollbacked(DbConnection connection);

        void OnExecuteReaderStart(DbCommand command);

        void OnReaderFinish(DbDataReader reader, int record);

        void OnExecuteNonQueryStart(DbCommand command);

        void OnExecuteNonQueryFinish(DbCommand command, int executionRestlt);

        void OnExecuteScalarStart(DbCommand command);

        void OnExecuteScalarFinish(DbCommand command, object? executionRestlt);

        void OnCommandError(DbCommand command, Exception exception);
    }
}
