using System;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;

namespace HandStack.Web.Authorization
{
    /// <summary>
    /// 브라우저 요청은 Referer(없으면 Origin)가 동일 도메인일 때 허용하고,
    /// 그 외 프로그램 요청은 헤더 인증키(X-Api-Key 또는 Authorization: Bearer)를 검증한다.
    /// 설정: AppSettings:Security:RequestOriginApiAccess. 사용: [TypeFilter(typeof(RequestOriginActionFilter))]
    /// </summary>
    public class RequestOriginActionFilter(IConfiguration configuration) : IActionFilter
    {
        private readonly IConfiguration configuration = configuration;

        public void OnActionExecuting(ActionExecutingContext context)
        {
            ArgumentNullException.ThrowIfNull(context);

            var options = configuration.GetSection(RequestOriginOptions.SectionName).Get<RequestOriginOptions>() ?? new RequestOriginOptions();
            if (options.Enabled == false)
            {
                return;
            }

            var request = context.HttpContext.Request;
            if (options.AllowLoopback == true && IsDirectLoopback(context.HttpContext) == true)
            {
                return;
            }

            if (IsAllowedBrowserRequest(request, options) == true)
            {
                return;
            }

            if (IsValidApiKey(request, options) == true)
            {
                return;
            }

            context.Result = new UnauthorizedObjectResult(new { message = "요청 출처 또는 인증키 확인 필요" });
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }

        private static bool IsDirectLoopback(HttpContext httpContext)
        {
            var remoteIpAddress = httpContext.Connection.RemoteIpAddress;
            return remoteIpAddress != null
                && IPAddress.IsLoopback(remoteIpAddress) == true
                && httpContext.Request.Headers.ContainsKey("X-Forwarded-For") == false;
        }

        private static bool IsAllowedBrowserRequest(HttpRequest request, RequestOriginOptions options)
        {
            var source = request.Headers.Referer.ToString();
            if (string.IsNullOrWhiteSpace(source) == true)
            {
                source = request.Headers.Origin.ToString();
            }

            if (Uri.TryCreate(source, UriKind.Absolute, out var sourceUri) == false
                || (sourceUri.Scheme != Uri.UriSchemeHttp && sourceUri.Scheme != Uri.UriSchemeHttps))
            {
                return false;
            }

            var sourceAuthority = NormalizeAuthority(sourceUri.Host, sourceUri.Port, options.IsPortComparison == false);
            var requestPort = request.Host.Port ?? (string.Equals(request.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) == true ? 443 : 80);
            if (string.Equals(sourceAuthority, NormalizeAuthority(request.Host.Host, requestPort, options.IsPortComparison == false), StringComparison.Ordinal) == true)
            {
                return true;
            }

            foreach (var allowed in options.AllowedReferers)
            {
                if (Uri.TryCreate(allowed?.Trim(), UriKind.Absolute, out var allowedUri) == true
                    && string.Equals(sourceAuthority, NormalizeAuthority(allowedUri.Host, allowedUri.Port, options.IsPortComparison == false), StringComparison.Ordinal) == true)
                {
                    return true;
                }
            }

            return false;
        }

        private static string NormalizeAuthority(string host, int port, bool skipPort)
        {
            return skipPort == true ? host.ToLowerInvariant() : $"{host.ToLowerInvariant()}:{port}";
        }

        private static bool IsValidApiKey(HttpRequest request, RequestOriginOptions options)
        {
            var providedKey = request.Headers[string.IsNullOrWhiteSpace(options.HeaderName) == true ? "X-Api-Key" : options.HeaderName.Trim()].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(providedKey) == true)
            {
                var authorization = request.Headers.Authorization.ToString();
                if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
                {
                    providedKey = authorization["Bearer ".Length..];
                }
            }

            if (string.IsNullOrWhiteSpace(providedKey) == true)
            {
                return false;
            }

            var providedBytes = Encoding.UTF8.GetBytes(providedKey.Trim());
            var isValid = false;
            foreach (var apiKey in options.ApiKeys)
            {
                if (string.IsNullOrWhiteSpace(apiKey) == true)
                {
                    continue;
                }

                var expectedBytes = Encoding.UTF8.GetBytes(apiKey.Trim());
                if (expectedBytes.Length == providedBytes.Length && CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes) == true)
                {
                    isValid = true;
                }
            }

            return isValid;
        }
    }
}
