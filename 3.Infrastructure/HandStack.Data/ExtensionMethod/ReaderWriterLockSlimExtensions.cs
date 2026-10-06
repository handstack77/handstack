using System;
using System.Threading;

namespace HandStack.Data.ExtensionMethod
{
    public static partial class ReaderWriterLockSlimExtensions
    {
        public static void ExecuteWithReadLock(this ReaderWriterLockSlim readerWriterLockSlim, Action action)
        {
            ArgumentNullException.ThrowIfNull(readerWriterLockSlim);

            readerWriterLockSlim.EnterReadLock();

            try
            {
                ArgumentNullException.ThrowIfNull(action);

                action();
            }
            finally
            {
                readerWriterLockSlim.ExitReadLock();
            }
        }

        public static T ExecuteWithReadLock<T>(this ReaderWriterLockSlim readerWriterLockSlim, Func<T> action)
        {
            ArgumentNullException.ThrowIfNull(readerWriterLockSlim);

            readerWriterLockSlim.EnterReadLock();

            try
            {
                ArgumentNullException.ThrowIfNull(action);

                return action();
            }
            finally
            {
                readerWriterLockSlim.ExitReadLock();
            }
        }

        public static void ExecuteWithWriteLock(this ReaderWriterLockSlim readerWriterLockSlim, Action action)
        {
            ArgumentNullException.ThrowIfNull(readerWriterLockSlim);

            readerWriterLockSlim.EnterWriteLock();

            try
            {
                ArgumentNullException.ThrowIfNull(action);

                action();
            }
            finally
            {
                readerWriterLockSlim.ExitWriteLock();
            }
        }

        public static T ExecuteWithWriteLock<T>(this ReaderWriterLockSlim readerWriterLockSlim, Func<T> action)
        {
            ArgumentNullException.ThrowIfNull(readerWriterLockSlim);

            readerWriterLockSlim.EnterWriteLock();

            try
            {
                ArgumentNullException.ThrowIfNull(action);

                return action();
            }
            finally
            {
                readerWriterLockSlim.ExitWriteLock();
            }
        }
    }
}
