using System;
using System.Threading.Tasks;

using function.Extensions;

using Xunit;

namespace Function.Tests
{
    public class TaskWaiterTests
    {
        [Fact]
        public async Task CompletedTaskSucceedsWithoutWaiting()
        {
            Assert.True(await FunctionTaskWaiter.WaitAsync(Task.CompletedTask, 0));
        }

        [Fact]
        public async Task TimeoutDoesNotCompleteOrCancelUnderlyingWork()
        {
            var work = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            Assert.False(await FunctionTaskWaiter.WaitAsync(work.Task, 20));
            Assert.False(work.Task.IsCompleted);
            work.SetResult();
            Assert.True(await FunctionTaskWaiter.WaitAsync(work.Task, 1000));
        }

        [Fact]
        public async Task FaultedTaskPropagatesItsFailure()
        {
            var error = await Assert.ThrowsAsync<AggregateException>(() => FunctionTaskWaiter.WaitAsync(Task.FromException(new InvalidOperationException("fixture")), 100));
            Assert.IsType<InvalidOperationException>(Assert.Single(error.InnerExceptions));
        }
    }
}
