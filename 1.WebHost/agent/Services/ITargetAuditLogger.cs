using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

namespace agent.Services
{
    public interface ITargetAuditLogger
    {
        Task WriteTargetsAuditAsync(
            HttpContext httpContext,
            string actionName,
            string? targetId,
            bool success,
            int statusCode,
            string? message,
            CancellationToken cancellationToken);

        Task WriteTargetsUnauthorizedAsync(
            HttpContext httpContext,
            string reason,
            CancellationToken cancellationToken);
    }
}
