using System;
using System.Threading;
using System.Threading.Tasks;

namespace forwarder.Models
{
    public sealed class ForwardProxyExecution(ForwardProxyResult result, Func<ValueTask>? disposeAsync = null) : IAsyncDisposable
    {
        private readonly Func<ValueTask>? disposeAsync = disposeAsync;
        private int isDisposed;

        public ForwardProxyResult Result { get; } = result;

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
