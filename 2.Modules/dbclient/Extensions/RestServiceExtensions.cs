﻿using System.Linq;

using dbclient.Entity;

using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Http;

namespace dbclient.Extensions
{
    public static class RestServiceExtensions
    {
        public static bool IsAllowAuthorization(this HttpContext httpContext)
        {
            string? authorizationKey = httpContext.Request.Headers["AuthorizationKey"];
            var isAllowClientIP = string.IsNullOrEmpty(ModuleConfiguration.AllowClientIP.FirstOrDefault(p => p == "*" || p == httpContext.GetRemoteIpAddress())) == false;
            return ModuleConfiguration.AuthorizationKey == authorizationKey && isAllowClientIP == true;
        }
    }
}
