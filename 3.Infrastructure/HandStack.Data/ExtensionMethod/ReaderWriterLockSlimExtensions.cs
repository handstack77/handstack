using System;
using System.Threading;

namespace HandStack.Data.ExtensionMethod
{
    public static partial class ReaderWriterLockSlimExtensions
    {
        public static void ExecuteWithReadLock(this ReaderWriterLockSlim readerWriterLockSlim, Action action)
        {
            readerWriterLockSlim.EnterReadLock();

            try
            {
                action();
            }
            finally
            {
                readerWriterLockSlim.ExitReadLock();
            }
        }

        public static T ExecuteWithReadLock<T>(this ReaderWriterLockSlim readerWriterLockSlim, Func<T> action)
        {
            readerWriterLockSlim.EnterReadLock();

            try
            {
                return action();
            }
            finally
            {
                readerWriterLockSlim.ExitReadLock();
            }
        }

        public static void ExecuteWithWriteLock(this ReaderWriterLockSlim readerWriterLockSlim, Action action)
        {
            readerWriterLockSlim.EnterWriteLock();

            try
            {
                action();
            }
            finally
            {
                readerWriterLockSlim.ExitWriteLock();
            }
        }

        public static T ExecuteWithWriteLock<T>(this ReaderWriterLockSlim readerWriterLockSlim, Func<T> action)
        {
            readerWriterLockSlim.EnterWriteLock();

            try
            {
                return action();
            }
            finally
            {
                readerWriterLockSlim.ExitWriteLock();
            }
        }
    }
}
