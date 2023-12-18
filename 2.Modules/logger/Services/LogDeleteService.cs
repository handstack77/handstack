using System;
using System.Threading;
using System.Threading.Tasks;

using logger.Encapsulation;

using Microsoft.Extensions.Hosting;

using Serilog;

namespace logger.Services
{
    internal class LogDeleteService : BackgroundService
    {
        private readonly ILogger logger;

        private ILoggerClient loggerClient { get; }

        public LogDeleteService(ILogger logger, ILoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                logger.Information("[{LogCategory}] 거래 로그 삭제 시작", "LogDeleteService/ExecuteAsync");

                await loggerClient.Delete();
                await Task.Delay(TimeSpan.FromHours(1));
            }
        }
    }
}
