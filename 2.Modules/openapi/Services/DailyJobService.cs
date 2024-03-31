using System;
using System.Threading;
using System.Threading.Tasks;

using openapi.Encapsulation;

using Microsoft.Extensions.Hosting;

using Serilog;

namespace openapi.Services
{
    internal class DailyJobService : IHostedService, IDisposable
    {
        private Timer? timer;

        public Task StartAsync(CancellationToken cancellationToken)
        {
            DateTime now = DateTime.Now;
            DateTime midnight = DateTime.Today.AddDays(1);
            TimeSpan dueTime = midnight - now;

            timer = new Timer(DoWork, null, dueTime, TimeSpan.FromDays(1));

            return Task.CompletedTask;
        }

        private void DoWork(object? state)
        {
            // DailyJobService 서비스로 LimitPeriod에 따라 매일 또는 매월 1일에 APIService.LimitCallCount 값으로 초기화
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            timer?.Change(Timeout.Infinite, 0);

            return Task.CompletedTask;
        }

        public void Dispose()
        {
            timer?.Dispose();
        }
    }
}
