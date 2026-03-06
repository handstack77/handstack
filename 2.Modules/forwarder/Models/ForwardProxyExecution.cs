using System;
using System.Threading;
using System.Threading.Tasks;

namespace forwarder.Models
{
    public sealed class ForwardProxyExecution : IAsyncDisposable
    {
        private readonly Func<ValueTask>? disposeAsync;
        private int isDisposed;

        public ForwardProxyResult Result { get; }

        public ForwardProxyExecution(ForwardProxyResult result, Func<ValueTask>? disposeAsync = null)
        {
            Result = result;
            this.disposeAsync = disposeAsync;
        }

        public async ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref isDisposed, 1) == 1)
            {
                return;
            }

            if (disposeAsync != null)
            {
                await disposeAsync();
            }
        }
    }
}
