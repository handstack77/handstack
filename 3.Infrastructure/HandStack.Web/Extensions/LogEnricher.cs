using System.Linq;

using HandStack.Core.ExtensionMethod;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Routing;

using Serilog;

namespace HandStack.Web.Extensions
{
    public static class LogEnricher
    {
        /// <summary>
        /// app.UseSerilogRequestLogging(opts => opts.EnrichDiagnosticContext = LogEnricher.EnrichFromRequest);
        /// </summary>
        public static void EnrichFromRequest(IDiagnosticContext diagnosticContext, HttpContext httpContext)
        {
            if (httpContext == null)
            {
                return;
            }

            var ipAddress = httpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString();
            if (ipAddress != null)
            {
                diagnosticContext.Set("ClientIP", ipAddress.ToString());
            }

            var userAgent = httpContext.Request.Headers["User-Agent"].FirstOrDefault();
            if (userAgent != null)
            {
                diagnosticContext.Set("UserAgent", userAgent);
            }

            var resource = httpContext.GetMetricsCurrentResourceName();
            if (resource != null)
            {
                diagnosticContext.Set("Resource", resource);
            }
        }

        public static string? GetMetricsCurrentResourceName(this HttpContext httpContext)
        {
            if (httpContext == null)
            {
                return "";
            }

            var endpoint = httpContext.Features.Get<IEndpointFeature>()?.Endpoint;
            return endpoint?.Metadata.GetMetadata<EndpointNameMetadata>()?.EndpointName;
        }
    }
}
