using System;
using System.Threading.Tasks;

namespace function.Extensions
{
    internal static class FunctionTaskWaiter
    {
        internal static async Task<bool> WaitAsync(Task task, int millisecondsTimeout = -1)
        {
            if (millisecondsTimeout < -1 || millisecondsTimeout == 0 || task.IsCompleted)
            {
                return task.Wait(millisecondsTimeout);
            }

            try
            {
                await task.WaitAsync(TimeSpan.FromMilliseconds(millisecondsTimeout)).ConfigureAwait(false);
                return true;
            }
            catch (TimeoutException) when (!task.IsCompleted)
            {
                return false;
            }
            catch
            {
                return task.Wait(0);
            }
        }
    }
}
