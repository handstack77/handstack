using System.IO;
using System.Net;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Http;

using Serilog;

namespace HandStack.Web
{
    public static class WithOnlyIPFilter
    {
        public static bool IsAllowed(HttpContext context)
        {
            if (GlobalConfiguration.WithOnlyIPs.Count == 0 || GlobalConfiguration.WithOnlyIPs.Contains("*") == true)
            {
                return true;
            }

            var clientIP = NormalizeIPAddress(context.GetRemoteIpAddress().ToStringSafe());
            return string.IsNullOrWhiteSpace(clientIP) == false && GlobalConfiguration.WithOnlyIPs.Contains(clientIP) == true;
        }

        public static bool TryRejectStaticFile(HttpContext context, string logCategory)
        {
            if (IsAllowed(context) == true)
            {
                return false;
            }

            var clientIP = NormalizeIPAddress(context.GetRemoteIpAddress().ToStringSafe());
            Log.Warning("[{LogCategory}] " + $"허용되지 않은 클라이언트 IP 접근 차단, Path: {context.Request.Path}, ClientIP: {clientIP}", logCategory);

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentLength = 0;
            context.Response.Body = Stream.Null;
            return true;
        }

        public static string GetClientIPAddress(HttpContext context)
        {
            return NormalizeIPAddress(context.GetRemoteIpAddress().ToStringSafe());
        }

        public static string NormalizeIPAddress(string? ipAddress)
        {
            if (string.IsNullOrWhiteSpace(ipAddress) == true)
            {
                return "";
            }

            var result = ipAddress.Trim();
            var separatorIndex = result.IndexOf(',');
            if (separatorIndex > -1)
            {
                result = result.Substring(0, separatorIndex).Trim();
            }

            if (IPAddress.TryParse(result, out var parsedIPAddress) == true)
            {
                return parsedIPAddress.MapToIPv4().ToString();
            }

            return result;
        }
    }
}
