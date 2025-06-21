using System.Linq;

using function.Entity;

using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Http;

namespace function.Extensions
{
    public static class RestServiceExtensions
    {
        public static bool IsAllowAuthorization(this HttpContext httpContext)
        {
            string? authorizationKey = httpContext.Request.GetContainValue("AuthorizationKey");
            var isAllowClientIP = string.IsNullOrEmpty(ModuleConfiguration.AllowClientIP.FirstOrDefault(p => p == "*" || p == httpContext.GetRemoteIpAddress())) == false;
            return ModuleConfiguration.AuthorizationKey == authorizationKey || isAllowClientIP == true;
        }
    }
}
