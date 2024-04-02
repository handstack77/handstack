using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Data;
using HandStack.Data.Enumeration;
using HandStack.Web;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;

using openapi.Entity;
using openapi.Enumeration;
using openapi.Extensions;

namespace openapi.Services
{
    internal class DailyJobService : IHostedService, IDisposable
    {
        private Timer? timer;

        private readonly IMemoryCache memoryCache;

        private Serilog.ILogger logger { get; }

        public DailyJobService(IMemoryCache memoryCache, Serilog.ILogger logger)
        {
            this.memoryCache = memoryCache;
            this.logger = logger;
        }

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
            try
            {
                var dataProvider = (DataProviders)Enum.Parse(typeof(DataProviders), ModuleConfiguration.ModuleDataSource.DataProvider);
                var transactionID = dataProvider.ToEnumString();
                Extensions.ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, dataProvider, GlobalConfiguration.ApplicationID, $"HOA.{transactionID}.UD01", new
                {
                    LimitPeriod = "Day"
                });

                if (DateTime.Now.ToString("MMdd") == "0101")
                {
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
