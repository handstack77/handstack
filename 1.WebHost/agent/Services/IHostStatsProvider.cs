using agent.Entity;

namespace agent.Services
{
    public interface IHostStatsProvider
    {
        Task<HostStatsResponse> GetStatsAsync(CancellationToken cancellationToken);
    }
}

