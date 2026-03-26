using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace deploy.Security
{
    public sealed class ManagementKeyActionFilter : IAsyncActionFilter
    {
        private readonly ManagementKeyValidator validator;

        public ManagementKeyActionFilter(ManagementKeyValidator validator)
        {
            this.validator = validator;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (validator.HasConfiguredKey() == false)
            {
                await next();
                return;
            }

            var request = context.HttpContext.Request;
            var headerName = validator.ManagementHeaderName;
            if (request.Headers.TryGetValue(headerName, out var keyValues) == false)
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    success = false,
                    message = "관리 키 확인 필요."
                });
                return;
            }

            var key = keyValues.FirstOrDefault();
            if (validator.Validate(key) == false)
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    success = false,
                    message = "관리 키 확인 필요."
                });
                return;
            }

            await next();
        }
    }
}
