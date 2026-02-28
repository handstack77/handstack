using agent.Services;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace agent.Security
{
    public sealed class ManagementKeyActionFilter : IAsyncActionFilter
    {
        private readonly ManagementKeyValidator validator;
        private readonly ITargetAuditLogger auditLogger;

        public ManagementKeyActionFilter(ManagementKeyValidator validator, ITargetAuditLogger auditLogger)
        {
            this.validator = validator;
            this.auditLogger = auditLogger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var request = context.HttpContext.Request;
            var headerName = validator.ManagementHeaderName;

            if (request.Headers.TryGetValue(headerName, out var keyValues) == false)
            {
                await WriteUnauthorizedAuditAsync(context.HttpContext, "missing_management_key");
                context.Result = new UnauthorizedResult();
                return;
            }

            var key = keyValues.FirstOrDefault();
            if (validator.Validate(key) == false)
            {
                await WriteUnauthorizedAuditAsync(context.HttpContext, "invalid_management_key");
                context.Result = new UnauthorizedResult();
                return;
            }

            await next();
        }

        private async Task WriteUnauthorizedAuditAsync(HttpContext httpContext, string reason)
        {
            try
            {
                var requestPath = httpContext.Request.Path.Value ?? "";
                if (requestPath.StartsWith("/targets", StringComparison.OrdinalIgnoreCase) == true)
                {
                    await auditLogger.WriteTargetsUnauthorizedAsync(httpContext, reason, httpContext.RequestAborted);
                }
            }
            catch
            {
            }
        }
    }
}
