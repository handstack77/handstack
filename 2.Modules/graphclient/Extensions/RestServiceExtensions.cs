using System;
using System.Linq;
using System.Net;

using graphclient.Entity;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Http;

namespace graphclient.Extensions
{
    public static class RestServiceExtensions
    {
        public static bool IsAllowAuthorization(this HttpContext httpContext)
        {
            string remoteIP = httpContext.GetRemoteIpAddress().ToStringSafe();
            bool isLocalRequest = httpContext.Connection.RemoteIpAddress != null && IPAddress.IsLoopback(httpContext.Connection.RemoteIpAddress);
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
