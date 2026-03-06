using System.Threading;
using System.Threading.Tasks;

using forwarder.Models;

namespace forwarder.Services
{
    public interface IForwardProxySessionStore
    {
        Task<string?> LoadStorageStateAsync(ForwardSessionDescriptor session, CancellationToken cancellationToken);

        Task SaveStorageStateAsync(ForwardSessionDescriptor session, string? storageState, ForwardClientKind clientKind, CancellationToken cancellationToken);
    }
}
