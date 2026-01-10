using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ActionConstraints;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Primitives;

namespace HandStack.Web.Extensions
{
    public static class HttpRequestExtensions
    {
        public static async Task<string> GetRawBodyStringAsync(this HttpRequest request, Encoding? encoding = null, Stream? inputStream = null)
        {
            if (encoding == null)
            {
                encoding = Encoding.UTF8;
            }

            request.EnableBuffering();
            if (inputStream == null)
            {
                inputStream = request.Body;
            }

            if (inputStream.CanSeek == true)
            {
                inputStream.Position = 0;
            }

            using var reader = new StreamReader(inputStream, encoding, detectEncodingFromByteOrderMarks: false, bufferSize: -1, leaveOpen: true);
            var body = await reader.ReadToEndAsync();

            if (inputStream.CanSeek == true)
            {
                inputStream.Position = 0;
            }

            return body;
        }

        public static async Task<byte[]> GetRawBodyBytesAsync(this HttpRequest request, Stream? inputStream = null)
        {
            request.EnableBuffering();
            if (inputStream == null)
            {
                inputStream = request.Body;
            }

            if (inputStream.CanSeek == true)
            {
                inputStream.Position = 0;
            }

            using var ms = new MemoryStream();
            await inputStream.CopyToAsync(ms);

            if (inputStream.CanSeek == true)
            {
                inputStream.Position = 0;
            }

            return ms.ToArray();
        }

        public static string GetBaseUrl(this HttpRequest request)
        {
            var protocol = request.GetHeaderValueAs<string>("X-Forwarded-Proto");
            if (string.IsNullOrEmpty(protocol) == false)
            {
                request.Scheme = protocol;
            }

            return $"{request.Scheme}://{request.Host}";
        }

        public static string GetUrlAuthority(this HttpRequest request)
        {
            var protocol = request.GetHeaderValueAs<string>("X-Forwarded-Proto");
            if (string.IsNullOrEmpty(protocol) == false)
            {
                request.Scheme = protocol;
            }

            return $"{request.Scheme}://{request.Host}{request.Path}";
        }

        public static string GetAbsoluteUrl(this HttpRequest request)
        {
            var protocol = request.GetHeaderValueAs<string>("X-Forwarded-Proto");
            if (string.IsNullOrEmpty(protocol) == false)
            {
                request.Scheme = protocol;
            }

            return $"{request.Scheme}://{request.Host}{request.PathBase}{request.Path}{request.QueryString}";
        }

        public static int GetInt(this string value)
        {
            int result;
            if (int.TryParse(value, out result) == true)
            {
                return result;
            }
            else
            {
                return 0;
            }
        }

        public static long GetLong(this string value)
        {
            long result;
            if (long.TryParse(value, out result) == true)
            {
                return result;
            }
            else
            {
                return 0;
            }
        }

        public static int GetOffsetMinutes(this HttpRequest request, string offsetKey = "OffsetMinutes")
        {
            var result = DateTimeOffset.Now.TotalOffsetMinutes;
            var offsetMinutes = GetContainValue(request, "OffsetMinutes");
            var timezoneOffsetMinutes = string.IsNullOrEmpty(offsetMinutes) == true ? result : offsetMinutes.ParseInt(result);

            return result;
        }

        public static string GetContainValue(this HttpRequest request, string requestKey, string defaultValue = "")
        {
            var result = "";
            if (request.Query.ContainsKey(requestKey) == true)
            {
                result = request.Query[requestKey].ToString();
            }
            else if (request.HasFormContentType == true && request.Form.ContainsKey(requestKey) == true)
            {
                result = request.Form[requestKey].ToString();
            }
            else if (request.RouteValues.ContainsKey(requestKey) == true)
            {
                result = (request.RouteValues[requestKey]?.ToString()).ToStringSafe();
            }
            else if (request.Headers.ContainsKey(requestKey) == true)
            {
                result = request.Headers[requestKey].ToString();
            }

            if (string.IsNullOrEmpty(result) == true && string.IsNullOrEmpty(defaultValue) == false)
            {
                result = defaultValue;
            }

            return result;
        }

        public static ControllerActionDescriptor? GetControllerByUrl(this HttpContext httpContext)
        {
            ControllerActionDescriptor? result = null;

            var isApiPath = httpContext.Request.Path.ToString().Contains("/api/");
            var areaName = httpContext.Request.RouteValues["area"].ToStringSafe();
            var controllerName = httpContext.Request.RouteValues["controller"].ToStringSafe();
            var actionName = httpContext.Request.RouteValues["action"].ToStringSafe();

            if (isApiPath == false || areaName == null || controllerName == null || actionName == null)
            {
            }
            else
            {
                var actionDescriptorsProvider = httpContext.RequestServices.GetRequiredService<IActionDescriptorCollectionProvider>();
                result = actionDescriptorsProvider.ActionDescriptors.Items
                .Where(s => s is ControllerActionDescriptor bb
                            && bb.ControllerTypeInfo.Assembly.GetName().Name == areaName
                            && bb.ControllerName == controllerName
                            && bb.ActionName == actionName
                            && (bb.ActionConstraints == null
                                || (bb.ActionConstraints != null
                                    && bb.ActionConstraints.Any(x => x is HttpMethodActionConstraint cc
                                    && cc.HttpMethods.Any(m => m.ToLower() == httpContext.Request.Method.ToLower())))))
                .Select(s => s as ControllerActionDescriptor)
                .FirstOrDefault();
            }

            return result;
        }

        public static string? GetRemoteIpAddress(this HttpContext httpContext, bool tryUseXForwardHeader = true)
        {
            var ip = "0.0.0.0";

            if (tryUseXForwardHeader == true)
            {
                ip = httpContext.Request.GetHeaderValueAs<string>("X-Forwarded-For")?.SplitCsv()?.FirstOrDefault();
            }

            if (string.IsNullOrEmpty(ip) == true && httpContext?.GetServerVariable("HTTP_X_FORWARDED_FOR") != null)
            {
                ip = httpContext?.GetServerVariable("HTTP_X_FORWARDED_FOR")?.ToString();
            }

            if (string.IsNullOrEmpty(ip) == true && httpContext?.Connection?.RemoteIpAddress != null)
            {
                ip = httpContext.Connection.RemoteIpAddress.MapToIPv4().ToString();
            }

            if (string.IsNullOrEmpty(ip) == true)
            {
                ip = httpContext?.Request.GetHeaderValueAs<string>("REMOTE_ADDR");
            }

            if (string.IsNullOrEmpty(ip) == false && ip.Length > 7 && ip.Substring(0, 7) == "::ffff:")
            {
                ip = ip.Substring(7);
            }

            if (ip == "::1" || ip == "0.0.0.1" || ip == "127.0.0.1" || (string.IsNullOrEmpty(ip) == true && httpContext?.Connection?.LocalIpAddress != null))
            {
                ip = httpContext?.Connection.LocalIpAddress?.MapToIPv4().ToString();
                if (ip == "::1" || ip == "0.0.0.1" || ip == "127.0.0.1")
                {
                    var host = Dns.GetHostEntry(Dns.GetHostName());
                    foreach (var ipAddress in host.AddressList)
                    {
                        if (ipAddress.AddressFamily == AddressFamily.InterNetwork)
                        {
                            ip = ipAddress.ToString();
                            break;
                        }
                    }
                }
            }

            return ip;
        }

        public static string? GetRemoteIpAddress(this HttpContext httpContext, string reportedClientIP, string trustedProxyIP, bool tryUseXForwardHeader = true)
        {
            var ip = "0.0.0.0";

            if (tryUseXForwardHeader == true)
            {
                ip = httpContext.Request.GetHeaderValueAs<string>("X-Forwarded-For")?.SplitCsv()?.FirstOrDefault();
            }

            if (string.IsNullOrEmpty(ip) == true && httpContext?.GetServerVariable("HTTP_X_FORWARDED_FOR") != null)
            {
                ip = httpContext?.GetServerVariable("HTTP_X_FORWARDED_FOR")?.ToString();
            }

            if (ip == trustedProxyIP)
            {
                return reportedClientIP;
            }

            if (string.IsNullOrEmpty(ip) == true && httpContext?.Connection?.RemoteIpAddress != null)
            {
                ip = httpContext.Connection.RemoteIpAddress.MapToIPv4().ToString();
            }

            if (string.IsNullOrEmpty(ip) == true)
            {
                ip = httpContext?.Request.GetHeaderValueAs<string>("REMOTE_ADDR");
            }

            if (string.IsNullOrEmpty(ip) == false && ip.Length > 7 && ip.Substring(0, 7) == "::ffff:")
            {
                ip = ip.Substring(7);
            }

            if (ip == "::1" || ip == "0.0.0.1" || ip == "127.0.0.1")
            {
                ip = reportedClientIP;
            }

            return ip;
        }

        public static T? GetHeaderValueAs<T>(this HttpRequest request, string headerName)
        {
            StringValues values = "";
            try
            {
                if (request?.Headers?.TryGetValue(headerName, out values) ?? false)
                {
                    var rawValues = values.ToString();

                    if (rawValues.IsNullOrWhitespace() == false)
                    {
                        return (T)Convert.ChangeType(values.ToString(), typeof(T));
                    }
                }
            }
            catch (Exception exception)
            {
                Console.WriteLine("[HttpRequestExtensions/GetHeaderValueAs] " + $"오류: {exception.Message}");
            }
            return default(T);
        }
    }
}
