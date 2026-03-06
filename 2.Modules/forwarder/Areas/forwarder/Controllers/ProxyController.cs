using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

using forwarder.Entity;
using forwarder.Extensions;
using forwarder.Models;
using forwarder.Services;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Common;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace forwarder.Areas.forwarder.Controllers
{
    [Area("forwarder")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ProxyController : BaseController
    {
        private static readonly HashSet<string> IgnoredRequestHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "BearerToken",
            "Connection",
            "Content-Length",
            "Host",
            "Transfer-Encoding",
            "X-Forwarder-ClientKind"
        };

        private static readonly HashSet<string> IgnoredResponseHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Connection",
            "Content-Encoding",
            "Content-Length",
            "Keep-Alive",
            "Transfer-Encoding"
        };

        private readonly ILogger logger;
        private readonly IForwardProxyService forwardProxyService;

        public ProxyController(ILogger logger, IForwardProxyService forwardProxyService)
        {
            this.logger = logger;
            this.forwardProxyService = forwardProxyService;
        }

        [HttpGet("[action]")]
        public string? GetClientIP()
        {
            return HttpContext.GetRemoteIpAddress();
        }

        [AcceptVerbs("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS")]
        [Route("[action]")]
        public async Task<IActionResult> Pipe([FromQuery] string requestKey, [FromQuery] int? timeoutMS = null)
        {
            if (HttpContext.TryAuthorizeBearerToken(out var bearerToken, out var message) == false)
            {
                return Unauthorized(message);
            }

            if (string.IsNullOrWhiteSpace(requestKey) == true)
            {
                return BadRequest("requestKey 확인 필요");
            }

            if (ModuleConfiguration.ForwardUrls.TryGetValue(requestKey, out var targetUrl) == false || string.IsNullOrWhiteSpace(targetUrl) == true)
            {
                return NotFound("requestKey에 해당하는 ForwardUrls 확인 필요");
            }

            if (Uri.TryCreate(targetUrl, UriKind.Absolute, out var targetUri) == false ||
                (targetUri.Scheme != Uri.UriSchemeHttp && targetUri.Scheme != Uri.UriSchemeHttps))
            {
                return StatusCode(StatusCodes.Status500InternalServerError, $"requestKey: {requestKey} 대상 URL 설정 확인 필요");
            }

            try
            {
                var requestBody = await ReadBodyAsync(Request, HttpContext.RequestAborted);
                var forwardRequest = new ForwardProxyRequest
                {
                    UserID = bearerToken!.Policy.UserID,
                    Session = CreateSessionDescriptor(bearerToken),
                    ClientKind = ResolveClientKind(Request),
                    TargetUrl = targetUri.AbsoluteUri,
                    Method = Request.Method,
                    Headers = BuildForwardHeaders(Request),
                    Body = requestBody,
                    TimeoutMS = timeoutMS
                };

                await using var execution = await forwardProxyService.ForwardAsync(forwardRequest, HttpContext.RequestAborted);
                var response = execution.Result;
                UpdateHtmlBaseTagIfNeeded(Request, response);
                await WriteResponseAsync(Response, Request.Method, response, HttpContext.RequestAborted);
                return new EmptyResult();
            }
            catch (OperationCanceledException) when (HttpContext.RequestAborted.IsCancellationRequested == true)
            {
                return StatusCode(499, "클라이언트 요청이 취소되었습니다.");
            }
            catch (InvalidOperationException exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"requestKey: {requestKey}, targetUrl: {targetUrl}", "ProxyController/Pipe");
                return StatusCode(StatusCodes.Status500InternalServerError, exception.Message);
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] " + $"requestKey: {requestKey}, targetUrl: {targetUrl}", "ProxyController/Pipe");
                return StatusCode(StatusCodes.Status502BadGateway, exception.Message);
            }
        }

        private static ForwardSessionDescriptor CreateSessionDescriptor(BearerToken bearerToken)
        {
            // BearerToken 발급 시각을 기준으로 사용자별 세션 저장소 경로를 고정한다.
            var createdAt = bearerToken.CreatedAt!.Value;
            var createdAtToken = createdAt.ToString("O");
            var databaseFileName = $"{createdAtToken.ToSHA256()}.db";
            var databaseFilePath = Path.Combine(
                ModuleConfiguration.SessionStorageBasePath,
                NormalizePathSegment(bearerToken.Policy.UserNo),
                createdAt.ToString("yyyyMM"),
                databaseFileName);

            return new ForwardSessionDescriptor
            {
                SessionKey = $"{bearerToken.Policy.UserNo}|{createdAtToken}".ToSHA256(),
                UserNo = bearerToken.Policy.UserNo,
                UserID = bearerToken.Policy.UserID,
                CreatedAt = createdAt,
                DatabaseFilePath = databaseFilePath
            };
        }

        private static string NormalizePathSegment(string value)
        {
            if (string.IsNullOrWhiteSpace(value) == true)
            {
                return "anonymous";
            }

            var invalidFileNameChars = Path.GetInvalidFileNameChars();
            var invalidPathChars = Path.GetInvalidPathChars();
            var builder = new StringBuilder(value.Length);
            foreach (var character in value.Trim())
            {
                if (character == Path.DirectorySeparatorChar ||
                    character == Path.AltDirectorySeparatorChar ||
                    Array.IndexOf(invalidFileNameChars, character) > -1 ||
                    Array.IndexOf(invalidPathChars, character) > -1)
                {
                    builder.Append('_');
                    continue;
                }

                builder.Append(character);
            }

            return builder.Length == 0 ? "anonymous" : builder.ToString();
        }

        private static ForwardClientKind ResolveClientKind(HttpRequest request)
        {
            // 명시 헤더가 있으면 우선 사용하고, 없으면 요청 특성으로 브라우저/프로그램을 추정한다.
            var headerValue = request.Headers["X-Forwarder-ClientKind"].ToString();
            if (Enum.TryParse<ForwardClientKind>(headerValue, true, out var clientKind) == true &&
                Enum.IsDefined(typeof(ForwardClientKind), clientKind) == true)
            {
                return clientKind;
            }

            return IsBrowserRequest(request) == true ? ForwardClientKind.Browser : ForwardClientKind.Program;
        }

        private static void UpdateHtmlBaseTagIfNeeded(HttpRequest request, ForwardProxyResult response)
        {
            // 브라우저가 받는 HTML에는 <base>를 주입해 상대 경로 리소스가 원본 기준으로 동작하게 한다.
            if (IsBrowserRequest(request) == false || IsHtmlResponse(response) == false || response.Body.Length == 0)
            {
                return;
            }

            if (Uri.TryCreate(response.ResponseUrl, UriKind.Absolute, out var responseUri) == false)
            {
                return;
            }

            var encoding = ResolveEncoding(response);
            var html = encoding.GetString(response.Body);
            if (Regex.IsMatch(html, "<base\\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant) == true)
            {
                return;
            }

            var baseTag = $"<base href=\"{responseUri.AbsoluteUri}\" />";
            string updatedHtml;
            if (Regex.IsMatch(html, "<head\\b[^>]*>", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant) == true)
            {
                updatedHtml = Regex.Replace(
                    html,
                    "<head\\b[^>]*>",
                    match => $"{match.Value}{baseTag}",
                    RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
                    TimeSpan.FromSeconds(1));
            }
            else if (Regex.IsMatch(html, "<html\\b[^>]*>", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant) == true)
            {
                updatedHtml = Regex.Replace(
                    html,
                    "<html\\b[^>]*>",
                    match => $"{match.Value}<head>{baseTag}</head>",
                    RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
                    TimeSpan.FromSeconds(1));
            }
            else
            {
                updatedHtml = $"<head>{baseTag}</head>{html}";
            }

            response.Body = encoding.GetBytes(updatedHtml);
        }

        private static bool IsBrowserRequest(HttpRequest request)
        {
            var accept = request.Headers.Accept.ToString();
            if (accept.Contains("text/html", StringComparison.OrdinalIgnoreCase) == true ||
                accept.Contains("application/xhtml+xml", StringComparison.OrdinalIgnoreCase) == true)
            {
                return true;
            }

            var secFetchDest = request.Headers["Sec-Fetch-Dest"].ToString();
            if (string.Equals(secFetchDest, "document", StringComparison.OrdinalIgnoreCase) == true ||
                string.Equals(secFetchDest, "iframe", StringComparison.OrdinalIgnoreCase) == true)
            {
                return true;
            }

            var secFetchMode = request.Headers["Sec-Fetch-Mode"].ToString();
            if (string.Equals(secFetchMode, "navigate", StringComparison.OrdinalIgnoreCase) == true)
            {
                return true;
            }

            var userAgent = request.Headers.UserAgent.ToString();
            return userAgent.Contains("Mozilla/", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsHtmlResponse(ForwardProxyResult response)
        {
            var contentType = response.Headers
                .FirstOrDefault(header => string.Equals(header.Key, "Content-Type", StringComparison.OrdinalIgnoreCase))
                .Value;

            if (string.IsNullOrWhiteSpace(contentType) == false)
            {
                return contentType.Contains("text/html", StringComparison.OrdinalIgnoreCase) == true ||
                    contentType.Contains("application/xhtml+xml", StringComparison.OrdinalIgnoreCase) == true;
            }

            if (response.Body.Length == 0)
            {
                return false;
            }

            var sampleLength = Math.Min(response.Body.Length, 256);
            var sample = Encoding.UTF8.GetString(response.Body, 0, sampleLength).TrimStart();
            return sample.StartsWith("<!DOCTYPE html", StringComparison.OrdinalIgnoreCase) == true ||
                sample.StartsWith("<html", StringComparison.OrdinalIgnoreCase) == true;
        }

        private static Encoding ResolveEncoding(ForwardProxyResult response)
        {
            if (response.Body.Length >= 3 &&
                response.Body[0] == 0xEF &&
                response.Body[1] == 0xBB &&
                response.Body[2] == 0xBF)
            {
                return new UTF8Encoding(true);
            }

            if (response.Body.Length >= 2)
            {
                if (response.Body[0] == 0xFF && response.Body[1] == 0xFE)
                {
                    return Encoding.Unicode;
                }

                if (response.Body[0] == 0xFE && response.Body[1] == 0xFF)
                {
                    return Encoding.BigEndianUnicode;
                }
            }

            var contentType = response.Headers
                .FirstOrDefault(header => string.Equals(header.Key, "Content-Type", StringComparison.OrdinalIgnoreCase))
                .Value;
            if (string.IsNullOrWhiteSpace(contentType) == false)
            {
                var charsetIndex = contentType.IndexOf("charset=", StringComparison.OrdinalIgnoreCase);
                if (charsetIndex > -1)
                {
                    var charset = contentType.Substring(charsetIndex + "charset=".Length).Trim().TrimEnd(';').Trim('"', '\'');
                    try
                    {
                        return Encoding.GetEncoding(charset);
                    }
                    catch
                    {
                    }
                }
            }

            return new UTF8Encoding(false);
        }

        private static Dictionary<string, string> BuildForwardHeaders(HttpRequest request)
        {
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var header in request.Headers)
            {
                if (IgnoredRequestHeaders.Contains(header.Key) == true)
                {
                    continue;
                }

                var value = header.Value.ToString();
                if (string.IsNullOrWhiteSpace(value) == true)
                {
                    continue;
                }

                result[header.Key] = value;
            }

            var remoteIp = request.HttpContext.GetRemoteIpAddress();
            if (string.IsNullOrWhiteSpace(remoteIp) == false)
            {
                result["X-Forwarded-For"] = remoteIp;
            }

            if (request.Host.HasValue == true)
            {
                result["X-Forwarded-Host"] = request.Host.Value;
            }

            result["X-Forwarded-Proto"] = request.Scheme;
            return result;
        }

        private static async Task<byte[]> ReadBodyAsync(HttpRequest request, CancellationToken cancellationToken)
        {
            if (request.Body == Stream.Null)
            {
                return Array.Empty<byte>();
            }

            using var memoryStream = new MemoryStream();
            await request.Body.CopyToAsync(memoryStream, cancellationToken);
            return memoryStream.ToArray();
        }

        private static async Task WriteResponseAsync(HttpResponse httpResponse, string method, ForwardProxyResult response, CancellationToken cancellationToken)
        {
            httpResponse.StatusCode = response.StatusCode;

            long? contentLength = null;
            foreach (var header in response.Headers)
            {
                if (string.Equals(header.Key, "Content-Type", StringComparison.OrdinalIgnoreCase) == true)
                {
                    httpResponse.ContentType = header.Value;
                    continue;
                }

                if (string.Equals(header.Key, "Content-Length", StringComparison.OrdinalIgnoreCase) == true)
                {
                    if (long.TryParse(header.Value, out var parsedLength) == true)
                    {
                        contentLength = parsedLength;
                    }

                    continue;
                }

                if (IgnoredResponseHeaders.Contains(header.Key) == true)
                {
                    continue;
                }

                httpResponse.Headers[header.Key] = header.Value;
            }

            if (contentLength.HasValue == true && (string.Equals(method, "HEAD", StringComparison.OrdinalIgnoreCase) == true || contentLength.Value == response.Body.LongLength))
            {
                httpResponse.ContentLength = contentLength.Value;
            }
            else
            {
                httpResponse.ContentLength = response.Body.LongLength;
            }

            if (string.Equals(method, "HEAD", StringComparison.OrdinalIgnoreCase) == false && response.Body.Length > 0)
            {
                await httpResponse.Body.WriteAsync(response.Body, cancellationToken);
            }
        }
    }
}
