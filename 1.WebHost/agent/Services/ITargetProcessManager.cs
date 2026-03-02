using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using agent.Entity;
using agent.Options;

namespace agent.Services
{
    public interface ITargetProcessManager
    {
        IReadOnlyList<TargetProcessInfo> GetTargets();

        bool TryGetTarget(string id, out TargetProcessOptions? target);

        Task<TargetStatusResponse?> GetStatusAsync(string id, CancellationToken cancellationToken);

        Task<TargetCommandResult> StartAsync(string id, CancellationToken cancellationToken);

        Task<TargetCommandResult> StopAsync(string id, CancellationToken cancellationToken);

        Task<TargetCommandResult> RestartAsync(string id, CancellationToken cancellationToken);
    }
}

