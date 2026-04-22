using System.Linq;

using graphclient.Entity;

using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Http;

namespace graphclient.Extensions
{
    public static class RestServiceExtensions
    {
        public static bool IsAllowAuthorization(this HttpContext httpContext)
        {
            string? authorizationKey = httpContext.Request.GetContainValue("AuthorizationKey");
            var isAllowClientIP = string.IsNullOrWhiteSpace(ModuleConfiguration.AllowClientIP.FirstOrDefault(item => item == "*" || item == httpContext.GetRemoteIpAddress())) == false;
            return ModuleConfiguration.AuthorizationKey == authorizationKey && isAllowClientIP == true;
        }
    }
}
