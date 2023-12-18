using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;

using HandStack.Data.ExtensionMethod;

namespace dbclient.Profiler
{
    public class ProfilerFactory
    {
        private static Func<IAdoNetProfiler>? constructor;
        private static bool initialized = false;
        private static readonly ReaderWriterLockSlim readerWriterLockSlim = new ReaderWriterLockSlim();

        public static void Initialize(Type profilerType)
        {
            if (profilerType == null)
            {
                throw new ArgumentNullException(nameof(profilerType));
            }

            if (profilerType.GetInterfaces().All(x => x != typeof(IAdoNetProfiler)))
            {
                throw new ArgumentException($"The type must be {typeof(IAdoNetProfiler).FullName}.", nameof(profilerType));
            }

            readerWriterLockSlim.ExecuteWithReadLock(() =>
            {
                if (initialized)
                {
                    throw new InvalidOperationException("This factory class has already initialized.");
                }

                ProviderUtility.InitialzeDbProviderFactory();

                constructor = Expression.Lambda<Func<IAdoNetProfiler>>(Expression.New(profilerType)).Compile()
                    ?? throw new InvalidOperationException("There is no default constructor. The profiler must have it.");

                initialized = true;
            });
        }

        internal static IAdoNetProfiler? GetProfiler()
        {
            return readerWriterLockSlim.ExecuteWithWriteLock(() =>
            {
                if (initialized == false)
                {
                    throw new InvalidOperationException("This factory class has not initialized yet.");
                }

                return constructor?.Invoke();
            });
        }
    }
}
