using System;
using System.Linq;

using checkup.Entity;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Http;

namespace checkup.Extensions
{
    public static class RestServiceExtensions
    {
        public static bool IsAllowAuthorization(this HttpContext httpContext)
        {
            string remoteIP = httpContext.GetRemoteIpAddress().ToStringSafe();
            bool isLocalRequest = remoteIP.Equals("localhost", StringComparison.OrdinalIgnoreCase) || remoteIP == "127.0.0.1" || remoteIP == "::1";
            string? authorizationKey;
            if (isLocalRequest == true)
            {
                authorizationKey = httpContext.Request.GetContainValue("AuthorizationKey");
            }
            else
            {
                authorizationKey = httpContext.Request.GetHeaderValue("AuthorizationKey");
            }

            var isAllowClientIP = ModuleConfiguration.AllowClientIP.Contains("*") || ModuleConfiguration.AllowClientIP.Any(p => p == remoteIP);
            return ModuleConfiguration.AuthorizationKey == authorizationKey && isAllowClientIP;
        }
    }
}
