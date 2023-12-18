using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace HandStack.Core.ExtensionMethod
{
    public static class TaskExtensions
    {

        // GetResultAsync().WhenFaulted(errorHandler => Console.WriteLine(errorHandler.Message));
        public static void WhenFaulted(this Task task, Action<Exception>? errorHandler = null)
        {
            task.ContinueWith(t =>
            {
                if (t.IsFaulted == true && errorHandler != null)
                {
                    errorHandler(t.Exception);
                }
            }, TaskContinuationOptions.OnlyOnFaulted);
        }

        // var result = await (() => GetResultAsync()).Retry(3, TimeSpan.FromSeconds(1));
        public static async Task<TResult?> Retry<TResult>(this Func<Task<TResult>> taskFactory, int maxRetries, TimeSpan delay)
        {
            for (int i = 0; i < maxRetries; i++)
            {
                try
                {
                    return await taskFactory().ConfigureAwait(false);
                }
                catch
                {
                    if (i == maxRetries - 1)
                        throw;
                    await Task.Delay(delay).ConfigureAwait(false);
                }
            }

            return default(TResult);
        }

        // await GetResultAsync().OnFailure(ex => Console.WriteLine(ex.Message));
        public static async Task OnFailure(this Task task, Action<Exception> errorHandler)
        {
            try
            {
                await task.ConfigureAwait(false);
            }
            catch (Exception exception)
            {
                errorHandler(exception);
            }
        }

        // await GetResultAsync().WithTimeout(TimeSpan.FromSeconds(1));
        public static async Task WithTimeout(this Task task, TimeSpan timeout)
        {
            var delayTask = Task.Delay(timeout);
            var completedTask = await Task.WhenAny(task, delayTask);
            if (completedTask == delayTask)
            {
                throw new TimeoutException($"Task Timeout: {timeout}");
            }

            await task;
        }

        public static async Task<TResult> WithTimeout<TResult>(this Task<TResult> task, TimeSpan timeout)
        {
            var cts = new CancellationTokenSource();
            if (task == await Task.WhenAny(task, Task.Delay(timeout, cts.Token)).ConfigureAwait(false))
            {
                cts.Cancel();
                return await task.ConfigureAwait(false);
            }
            else
            {
                throw new TimeoutException($"Task Timeout: {timeout}");
            }
        }

        public static async Task WithTimeout(this Task[] tasks, TimeSpan timeout)
        {
            var cts = new CancellationTokenSource();
            Task task = tasks.WhenAllOrAnyFailed();
            if (task == await Task.WhenAny(task, Task.Delay(timeout, cts.Token)).ConfigureAwait(false))
            {
                cts.Cancel();
                await task.ConfigureAwait(false);
            }
            else
            {
                throw new TimeoutException($"{nameof(WhenAllOrAnyFailed)} timed out after {timeout}");
            }
        }

        private static async Task WhenAllOrAnyFailed(this Task[] tasks)
        {
            try
            {
                await WhenAllOrAnyFailedCore(tasks).ConfigureAwait(false);
            }
            catch
            {
                using (var cts = new CancellationTokenSource())
                {
                    await Task.WhenAny(
                        Task.WhenAll(tasks),
                        Task.Delay(3_000, cts.Token)).ConfigureAwait(false);
                }

                var exceptions = new List<Exception>();
                foreach (Task t in tasks)
                {
                    switch (t.Status)
                    {
                        case TaskStatus.Faulted:
                            if (t.Exception != null)
                            {
                                exceptions.Add(t.Exception);
                            }
                            break;
                        case TaskStatus.Canceled: 
                            exceptions.Add(new TaskCanceledException(t)); 
                            break;
                    }
                }

                Debug.Assert(exceptions.Count > 0);
                if (exceptions.Count > 1)
                {
                    throw new AggregateException(exceptions);
                }
                throw;
            }
        }

        private static Task WhenAllOrAnyFailedCore(this Task[] tasks)
        {
            int remaining = tasks.Length;
            var tcs = new TaskCompletionSource<bool>();
            foreach (Task t in tasks)
            {
                t.ContinueWith(a =>
                {
                    if (a.IsFaulted)
                    {
                        tcs.TrySetException(a.Exception.InnerExceptions);
                        Interlocked.Decrement(ref remaining);
                    }
                    else if (a.IsCanceled)
                    {
                        tcs.TrySetCanceled();
                        Interlocked.Decrement(ref remaining);
                    }
                    else if (Interlocked.Decrement(ref remaining) == 0)
                    {
                        tcs.TrySetResult(true);
                    }
                }, CancellationToken.None, TaskContinuationOptions.None, TaskScheduler.Default);
            }
            return tcs.Task;
        }

        // var result = await GetResultAsync().DefaultFallback("fallback");
        public static async Task<TResult> DefaultFallback<TResult>(this Task<TResult> task, TResult fallbackValue)
        {
            try
            {
                return await task.ConfigureAwait(false);
            }
            catch
            {
                return fallbackValue;
            }
        }
    }
}
