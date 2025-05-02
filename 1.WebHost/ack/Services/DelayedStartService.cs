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
            appLifetime.ApplicationStarted.Register(OnStarted);
            return Task.CompletedTask;
        }

        private void OnStarted()
        {
            moduleConfigurationService.StartAsync(CancellationToken.None).Wait();
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
