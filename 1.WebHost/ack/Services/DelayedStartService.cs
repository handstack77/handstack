using System.Threading;
using System.Threading.Tasks;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ack.Services
{
    internal class DelayedStartService : IHostedService
    {
        private readonly IHostApplicationLifetime appLifetime;
        private readonly ILogger<DelayedStartService> logger;
        private readonly ModuleConfigurationService moduleConfigurationService;

        public DelayedStartService(IHostApplicationLifetime appLifetime, ILogger<DelayedStartService> logger, ModuleConfigurationService moduleConfigurationService)
        {
            this.appLifetime = appLifetime;
            this.logger = logger;
            this.moduleConfigurationService = moduleConfigurationService;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            appLifetime.ApplicationStarted.Register(() => _ = RunModuleConfigurationAsync());
            return Task.CompletedTask;
        }

        private async Task RunModuleConfigurationAsync()
        {
            try
            {
                await moduleConfigurationService.StartAsync(CancellationToken.None);
            }
            catch (System.Exception exception)
            {
                logger.LogError(exception, "ModuleConfigurationService 시작 중 오류가 발생했습니다.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
