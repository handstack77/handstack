using System.Linq;

using checkup.Entity;

using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Http;

namespace checkup.Extensions
{
    public static class RestServiceExtensions
    {
        public static bool IsAllowAuthorization(this HttpContext httpContext)
        {
            string? authorizationKey = httpContext.Request.GetContainValue("AuthorizationKey");
            var isAllowClientIP = string.IsNullOrWhiteSpace(ModuleConfiguration.AllowClientIP.FirstOrDefault(p => p == "*" || p == httpContext.GetRemoteIpAddress())) == false;
            return ModuleConfiguration.AuthorizationKey == authorizationKey && isAllowClientIP == true;
        }
    }
}
