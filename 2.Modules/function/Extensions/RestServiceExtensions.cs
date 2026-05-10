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
            var isAllowClientIP = string.IsNullOrWhiteSpace(ModuleConfiguration.AllowClientIP.FirstOrDefault(p => p == "*" || p == httpContext.GetRemoteIpAddress())) == false;
            var isAllowAuthorizationKey = ModuleConfiguration.AuthorizationKey == authorizationKey;
            return ModuleConfiguration.RequireAuthorizationKeyAndClientIP == true
                ? isAllowAuthorizationKey == true && isAllowClientIP == true
                : isAllowAuthorizationKey == true || isAllowClientIP == true;
        }
    }
}
