using System.Threading;
using System.Threading.Tasks;

using forwarder.Models;

namespace forwarder.Services
{
    public interface IForwardProxyService
    {
        Task<ForwardProxyExecution> ForwardAsync(ForwardProxyRequest request, CancellationToken cancellationToken);
    }
}
