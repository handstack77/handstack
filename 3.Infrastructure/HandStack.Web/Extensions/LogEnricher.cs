using System.Linq;

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
            diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString());
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"].FirstOrDefault());
            diagnosticContext.Set("Resource", httpContext.GetMetricsCurrentResourceName());
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
