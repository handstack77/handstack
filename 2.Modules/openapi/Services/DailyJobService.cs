using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Data;
using HandStack.Data.Enumeration;
using HandStack.Web;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;

using openapi.Enumeration;

using Serilog;

namespace openapi.Services
{
    internal class DailyJobService : IHostedService, IDisposable
    {
        private Timer? timer;

        private readonly IMemoryCache memoryCache;

        private ILogger logger { get; }

        public DailyJobService(IMemoryCache memoryCache, ILogger logger)
        {
            this.memoryCache = memoryCache;
            this.logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            DateTime now = DateTime.Now;
            DateTime midnight = DateTime.Today.AddDays(1);
            TimeSpan dueTime = midnight - now;

            timer = new Timer(Execute, null, dueTime, TimeSpan.FromDays(1));

            return Task.CompletedTask;
        }

        private void Execute(object? state)
        {
            try
            {
                var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), ModuleConfiguration.ModuleDataSource.DataProvider);
                var transactionID = dataProvider.ToEnumString();

                logger.Information("[{LogCategory}] Day 기간 내 호출 수 제한 조건 자동 갱신", "DailyJobService/Execute");
                Extensions.ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.UD01", new
                {
                    LimitPeriod = "Day"
                });

                if (DateTime.Now.ToString("MMdd") == "0101")
                {
                    logger.Information("[{LogCategory}] Month 기간 내 호출 수 제한 조건 자동 갱신", "DailyJobService/Execute");
                    Extensions.ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.UD01", new
                    {
                        LimitPeriod = "Month"
                    });
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "OpenAPIClient/UsageAPIAggregate");
            }

            List<string> items = GetMemoryCacheKeys();
            foreach (string item in items)
            {
                memoryCache.Remove(item);
            }
        }

        private List<string> GetMemoryCacheKeys()
        {
            List<string> result = new List<string>();
            foreach (var cacheKey in ModuleConfiguration.CacheKeys)
            {
                if (cacheKey.StartsWith($"{ModuleConfiguration.ModuleID}|") == true)
                {
                    result.Add(cacheKey);
                }
            }

            return result;
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
