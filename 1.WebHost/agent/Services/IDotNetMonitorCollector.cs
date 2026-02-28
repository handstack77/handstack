using agent.Entity;
using agent.Options;

namespace agent.Services
{
    public interface IDotNetMonitorCollector
    {
        Task<TargetMonitorStats?> GetStatsAsync(TargetProcessOptions target, int? pid, CancellationToken cancellationToken);

        Task<CollectResult> CollectAsync(TargetProcessOptions target, int pid, CancellationToken cancellationToken);
    }
}

