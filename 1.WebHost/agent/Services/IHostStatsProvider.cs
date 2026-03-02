using System.Threading;
using System.Threading.Tasks;

using agent.Entity;

namespace agent.Services
{
    public interface IHostStatsProvider
    {
        Task<HostStatsResponse> GetStatsAsync(CancellationToken cancellationToken);
    }
}

