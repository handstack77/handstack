using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace agent.Security
{
    public sealed class HostBridgeKeyActionFilter : IAsyncActionFilter
    {
        private readonly HostBridgeKeyValidator validator;

        public HostBridgeKeyActionFilter(HostBridgeKeyValidator validator)
        {
            this.validator = validator;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (validator.Enabled == false)
            {
                context.Result = new NotFoundResult();
                return;
            }

            var request = context.HttpContext.Request;
            var headerName = validator.HeaderName;
            if (request.Headers.TryGetValue(headerName, out var headerValues) == false)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var providedKey = headerValues.FirstOrDefault();
            if (validator.Validate(providedKey) == false)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            await next();
        }
    }
}
