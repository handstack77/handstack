using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Web.Common;
using HandStack.Web.Extensions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Serilog;

namespace wwwroot.Areas.wwwroot.Controllers
{
    [Area("wwwroot")]
    [Route("[area]/api/forward-proxy-lab")]
    [ApiController]
    public class ForwardProxyLabController : BaseController
    {
        private static readonly HttpClient ProgramClient = new HttpClient
        {
            Timeout = Timeout.InfiniteTimeSpan
        };

        private readonly ILogger logger;

        public ForwardProxyLabController(ILogger logger)
        {
            this.logger = logger;
        }

        [HttpGet]
        public string Get()
        {
            return "wwwroot ForwardProxyLabController";
        }

        [HttpPost("program-execute")]
        public async Task<IActionResult> ProgramExecute([FromBody] ProxyLabExecuteRequest request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.BearerToken) == true)
            {
                return BadRequest("BearerToken required");
            }

            if (string.IsNullOrWhiteSpace(request.RequestKey) == true)
            {
                return BadRequest("requestKey required");
            }

            var requestUri = BuildForwarderUri(request.RequestKey, request.TimeoutMS);
            using var forwardRequest = new HttpRequestMessage(new HttpMethod(string.IsNullOrWhiteSpace(request.Method) == true ? "GET" : request.Method), requestUri);
            forwardRequest.Headers.TryAddWithoutValidation("BearerToken", request.BearerToken);
            forwardRequest.Headers.TryAddWithoutValidation("X-Forwarder-ClientKind", "Program");
            forwardRequest.Headers.TryAddWithoutValidation("User-Agent", "HandStackProxyLab/1.0");

            foreach (var header in request.Headers)
            {
                if (string.IsNullOrWhiteSpace(header.Key) == true || string.IsNullOrWhiteSpace(header.Value) == true)
                {
                    continue;
                }

                if (string.Equals(header.Key, "BearerToken", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(header.Key, "Content-Length", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(header.Key, "Host", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(header.Key, "User-Agent", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(header.Key, "X-Forwarder-ClientKind", StringComparison.OrdinalIgnoreCase) == true)
                {
                    continue;
                }

                if (forwardRequest.Headers.TryAddWithoutValidation(header.Key, header.Value) == false)
                {
                    forwardRequest.Content ??= new StringContent(string.Empty, Encoding.UTF8);
                    forwardRequest.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
                }
            }

            var bodyText = request.Body ?? string.Empty;
            if (ShouldSendBody(forwardRequest.Method) == true || bodyText.Length > 0)
            {
                forwardRequest.Content = new StringContent(bodyText, Encoding.UTF8, string.IsNullOrWhiteSpace(request.ContentType) == true ? "application/json" : request.ContentType);
            }

            using var linkedCancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            linkedCancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds((request.TimeoutMS ?? 30000) + 5000));

            try
            {
                var startedAt = DateTime.UtcNow;
                using var response = await ProgramClient.SendAsync(forwardRequest, HttpCompletionOption.ResponseContentRead, linkedCancellationTokenSource.Token);
                var bodyBytes = await response.Content.ReadAsByteArrayAsync(linkedCancellationTokenSource.Token);
                var elapsedMS = (long)(DateTime.UtcNow - startedAt).TotalMilliseconds;
                var headers = GetResponseHeaders(response);
                var contentType = response.Content.Headers.ContentType?.ToString() ?? headers.GetValueOrDefault("Content-Type", string.Empty);
                var body = DecodeBody(bodyBytes, contentType, out var isTextResponse, out var encodingName);

                return new JsonResult(new ProxyLabExecuteResponse
                {
                    Mode = "Program",
                    RequestKey = request.RequestKey,
                    RequestUri = requestUri,
                    StatusCode = (int)response.StatusCode,
                    StatusText = response.ReasonPhrase ?? string.Empty,
                    ResponseUrl = response.RequestMessage?.RequestUri?.ToString() ?? requestUri,
                    ContentType = contentType,
                    Headers = headers,
                    Body = body,
                    IsTextResponse = isTextResponse,
                    Encoding = encodingName,
                    ElapsedMS = elapsedMS
                });
            }
            catch (OperationCanceledException)
            {
                return StatusCode(StatusCodes.Status504GatewayTimeout, "Program proxy execution timed out");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] requestKey: {RequestKey}", "ForwardProxyLabController/ProgramExecute", request.RequestKey);
                return StatusCode(StatusCodes.Status500InternalServerError, exception.Message);
            }
        }

        [HttpGet("target/html")]
        public ContentResult TargetHtml([FromQuery] string? step = null)
        {
            var cookieValue = Request.Cookies.TryGetValue("ProxyLabCookie", out var currentCookie) == true ? currentCookie : "(empty)";
            var html =
            $$"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Forward Proxy Browser Target</title>
                <link rel="stylesheet" href="assets/theme.css" />
            </head>
            <body>
                <main class="lab-shell">
                    <header class="lab-hero">
                        <img class="lab-badge" src="assets/badge.svg?variant=hero" alt="Forward Proxy" />
                        <div>
                            <p class="lab-kicker">Browser target</p>
                            <h1>Forward Proxy browser page</h1>
                            <p class="lab-copy">This page includes relative CSS, JavaScript, SVG, navigation, and form actions so you can inspect base-tag behavior through the forwarder.</p>
                        </div>
                    </header>
                    <section class="lab-grid">
                        <article class="lab-panel">
                            <h2>Request context</h2>
                            <dl class="lab-meta">
                                <div><dt>Step</dt><dd>{{step ?? "entry"}}</dd></div>
                                <div><dt>Cookie</dt><dd id="cookieValue">{{cookieValue}}</dd></div>
                                <div><dt>User-Agent</dt><dd>{{Request.Headers.UserAgent.ToString()}}</dd></div>
                            </dl>
                        </article>
                        <article class="lab-panel">
                            <h2>Relative navigation</h2>
                            <p><a class="lab-link" href="pages/relative?origin=html-entry">Open relative page</a></p>
                            <p><a class="lab-link" href="../forward-proxy-lab/target/json?origin=html-link">Open JSON target</a></p>
                            <p><a class="lab-link" href="cookie/read">Read cookie target</a></p>
                        </article>
                    </section>
                    <section class="lab-panel">
                        <h2>Relative form</h2>
                        <form method="post" action="echo?origin=html-form" class="lab-form">
                            <label for="message">Payload</label>
                            <input id="message" name="message" value="hello-from-browser-target" />
                            <button type="submit">POST relative echo</button>
                        </form>
                    </section>
                    <section class="lab-panel">
                        <h2>Script probe</h2>
                        <div id="widget-status" data-endpoint="../forward-proxy-lab/target/json?origin=widget-script">Waiting for widget.js</div>
                    </section>
                </main>
                <script src="assets/widget.js"></script>
            </body>
            </html>
            """;

            return Content(html, "text/html; charset=utf-8", Encoding.UTF8);
        }

        [HttpGet("target/pages/relative")]
        public ContentResult TargetRelativePage([FromQuery] string? origin = null)
        {
            var html =
            $$"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Forward Proxy Relative Page</title>
                <link rel="stylesheet" href="../assets/theme.css" />
            </head>
            <body>
                <main class="lab-shell">
                    <section class="lab-panel">
                        <p class="lab-kicker">Relative page</p>
                        <h1>Relative resource check</h1>
                        <p class="lab-copy">Origin: {{origin ?? "unknown"}}</p>
                        <p><a class="lab-link" href="../html?step=returned-from-relative">Return to html target</a></p>
                        <img class="lab-badge" src="../assets/badge.svg?variant=relative" alt="Relative badge" />
                    </section>
                </main>
            </body>
            </html>
            """;

            return Content(html, "text/html; charset=utf-8", Encoding.UTF8);
        }

        [HttpGet("target/assets/theme.css")]
        public ContentResult TargetThemeCss()
        {
            var css =
            """
            :root {
                --ink: #102032;
                --mist: #f3efe5;
                --sun: #f2b544;
                --ocean: #1f8a70;
                --panel: rgba(255,255,255,0.88);
                --border: rgba(16,32,50,0.14);
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                font-family: "Segoe UI", "Noto Sans", sans-serif;
                color: var(--ink);
                background:
                    radial-gradient(circle at top left, rgba(242,181,68,0.35), transparent 34%),
                    linear-gradient(160deg, #fff8ec 0%, #ecf6f1 52%, #edf4fb 100%);
            }

            .lab-shell {
                max-width: 980px;
                margin: 0 auto;
                padding: 32px 20px 64px;
            }

            .lab-hero,
            .lab-panel {
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 22px;
                box-shadow: 0 28px 60px rgba(16,32,50,0.08);
            }

            .lab-hero {
                display: grid;
                grid-template-columns: 88px 1fr;
                gap: 18px;
                padding: 24px;
                margin-bottom: 18px;
            }

            .lab-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 18px;
                margin-bottom: 18px;
            }

            .lab-panel {
                padding: 24px;
                margin-bottom: 18px;
                position: relative;
                overflow: hidden;
            }

            .lab-panel::after {
                content: "";
                position: absolute;
                right: -30px;
                bottom: -30px;
                width: 140px;
                height: 140px;
                background: url('badge.svg?variant=css') no-repeat center / contain;
                opacity: 0.08;
                pointer-events: none;
            }

            .lab-kicker {
                margin: 0 0 6px;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: var(--ocean);
            }

            h1, h2 {
                margin: 0 0 12px;
            }

            .lab-copy,
            .lab-meta dd,
            .lab-link {
                line-height: 1.6;
            }

            .lab-badge {
                width: 88px;
                height: 88px;
                display: block;
            }

            .lab-meta {
                margin: 0;
            }

            .lab-meta div {
                display: grid;
                grid-template-columns: 96px 1fr;
                gap: 8px;
                padding: 8px 0;
                border-bottom: 1px solid rgba(16,32,50,0.08);
            }

            .lab-meta div:last-child {
                border-bottom: 0;
            }

            .lab-meta dt {
                font-weight: 700;
            }

            .lab-meta dd {
                margin: 0;
                word-break: break-word;
            }

            .lab-link {
                color: var(--ocean);
                font-weight: 700;
            }

            .lab-form {
                display: grid;
                gap: 12px;
            }

            .lab-form input {
                width: 100%;
                padding: 12px 14px;
                border-radius: 12px;
                border: 1px solid rgba(16,32,50,0.14);
            }

            .lab-form button {
                width: fit-content;
                border: 0;
                border-radius: 999px;
                padding: 11px 18px;
                background: linear-gradient(135deg, var(--sun), #ff8a4c);
                color: #102032;
                font-weight: 800;
                cursor: pointer;
            }

            #widget-status.ready {
                color: var(--ocean);
                font-weight: 700;
            }

            @media (max-width: 700px) {
                .lab-hero {
                    grid-template-columns: 1fr;
                }
            }
            """;

            return Content(css, "text/css; charset=utf-8", Encoding.UTF8);
        }

        [HttpGet("target/assets/widget.js")]
        public ContentResult TargetWidgetJs()
        {
            var script =
            """
            (() => {
                const panel = document.getElementById('widget-status');
                if (!panel) {
                    return;
                }

                const endpoint = panel.dataset.endpoint;
                fetch(endpoint, {
                    headers: {
                        'X-Proxy-Lab-Widget': 'enabled'
                    }
                })
                    .then((response) => response.json())
                    .then((data) => {
                        panel.classList.add('ready');
                        panel.textContent = `widget.js loaded relative JSON: ${data.scenario} / cookie=${data.cookieValue}`;
                    })
                    .catch((error) => {
                        panel.textContent = `widget.js failed: ${error}`;
                    });
            })();
            """;

            return Content(script, "application/javascript; charset=utf-8", Encoding.UTF8);
        }

        [HttpGet("target/assets/badge.svg")]
        public ContentResult TargetBadgeSvg([FromQuery] string? variant = null)
        {
            var label = string.IsNullOrWhiteSpace(variant) == true ? "proxy" : variant;
            var svg =
            $$"""
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Forward Proxy">
                <defs>
                    <linearGradient id="labGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#1f8a70" />
                        <stop offset="100%" stop-color="#f2b544" />
                    </linearGradient>
                </defs>
                <rect x="20" y="20" width="200" height="200" rx="56" fill="#102032" />
                <circle cx="120" cy="120" r="74" fill="url(#labGradient)" />
                <path d="M82 120h76M140 92l28 28-28 28" stroke="#fff7ec" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                <text x="120" y="206" text-anchor="middle" fill="#fff7ec" font-size="20" font-family="Segoe UI, sans-serif">{{label}}</text>
            </svg>
            """;

            return Content(svg, "image/svg+xml; charset=utf-8", Encoding.UTF8);
        }

        [HttpGet("target/json")]
        public IActionResult TargetJson([FromQuery] string? origin = null)
        {
            return new JsonResult(new
            {
                scenario = "json",
                origin = origin ?? "direct",
                timestamp = DateTimeOffset.UtcNow,
                method = Request.Method,
                cookieValue = Request.Cookies.TryGetValue("ProxyLabCookie", out var value) == true ? value : "(empty)",
                selectedHeaders = GetSelectedHeaders(Request)
            });
        }

        [AcceptVerbs("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS")]
        [Route("target/echo")]
        public async Task<IActionResult> TargetEcho([FromQuery] string? origin = null)
        {
            var rawBody = await Request.GetRawBodyStringAsync();
            return new JsonResult(new
            {
                scenario = "echo",
                origin = origin ?? "direct",
                method = Request.Method,
                contentType = Request.ContentType ?? string.Empty,
                query = Request.Query.ToDictionary(item => item.Key, item => item.Value.ToString()),
                headers = GetSelectedHeaders(Request),
                body = rawBody
            });
        }

        [HttpGet("target/redirect")]
        public IActionResult TargetRedirect()
        {
            var redirectUrl = $"{Request.GetBaseUrl()}/wwwroot/api/forward-proxy-lab/target/html?step=redirect-arrived";
            return Redirect(redirectUrl);
        }

        [HttpGet("target/cookie/set")]
        public IActionResult TargetCookieSet([FromQuery] string? value = null)
        {
            var cookieValue = string.IsNullOrWhiteSpace(value) == true ? $"cookie-{DateTime.UtcNow:HHmmss}" : value;
            Response.Cookies.Append(
                "ProxyLabCookie",
                cookieValue,
                new CookieOptions
                {
                    HttpOnly = false,
                    SameSite = SameSiteMode.Lax,
                    Secure = false,
                    Path = "/",
                    Expires = DateTimeOffset.UtcNow.AddMinutes(30)
                });

            return new JsonResult(new
            {
                scenario = "cookie-set",
                cookieName = "ProxyLabCookie",
                cookieValue
            });
        }

        [HttpGet("target/cookie/read")]
        public IActionResult TargetCookieRead()
        {
            return new JsonResult(new
            {
                scenario = "cookie-read",
                cookieName = "ProxyLabCookie",
                cookieValue = Request.Cookies.TryGetValue("ProxyLabCookie", out var value) == true ? value : "(empty)"
            });
        }

        [HttpGet("target/slow")]
        public async Task<IActionResult> TargetSlow([FromQuery] int delayMS = 3500, CancellationToken cancellationToken = default)
        {
            if (delayMS < 0)
            {
                delayMS = 0;
            }

            await Task.Delay(delayMS, cancellationToken);
            return new JsonResult(new
            {
                scenario = "slow",
                delayMS,
                completedAt = DateTimeOffset.UtcNow
            });
        }

        private string BuildForwarderUri(string requestKey, int? timeoutMS)
        {
            var builder = new StringBuilder();
            builder.Append(Request.GetBaseUrl());
            builder.Append("/forwarder/api/proxy/pipe?requestKey=");
            builder.Append(Uri.EscapeDataString(requestKey));

            if (timeoutMS.HasValue == true)
            {
                builder.Append("&timeoutMS=");
                builder.Append(timeoutMS.Value);
            }

            return builder.ToString();
        }

        private static bool ShouldSendBody(HttpMethod method)
        {
            return method == HttpMethod.Post ||
                method == HttpMethod.Put ||
                string.Equals(method.Method, "PATCH", StringComparison.OrdinalIgnoreCase) == true ||
                string.Equals(method.Method, "DELETE", StringComparison.OrdinalIgnoreCase) == true;
        }

        private static Dictionary<string, string> GetSelectedHeaders(HttpRequest request)
        {
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var header in request.Headers)
            {
                if (string.Equals(header.Key, "Accept", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(header.Key, "Content-Type", StringComparison.OrdinalIgnoreCase) == true ||
                    string.Equals(header.Key, "User-Agent", StringComparison.OrdinalIgnoreCase) == true ||
                    header.Key.StartsWith("X-", StringComparison.OrdinalIgnoreCase) == true)
                {
                    result[header.Key] = header.Value.ToString();
                }
            }

            return result;
        }

        private static Dictionary<string, string> GetResponseHeaders(HttpResponseMessage response)
        {
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var header in response.Headers)
            {
                result[header.Key] = string.Join(", ", header.Value);
            }

            foreach (var header in response.Content.Headers)
            {
                result[header.Key] = string.Join(", ", header.Value);
            }

            return result;
        }

        private static string DecodeBody(byte[] body, string contentType, out bool isTextResponse, out string encodingName)
        {
            isTextResponse = IsTextResponse(contentType, body);
            if (isTextResponse == false)
            {
                encodingName = "base64";
                return Convert.ToBase64String(body);
            }

            var encoding = ResolveEncoding(contentType);
            encodingName = encoding.WebName;
            return encoding.GetString(body);
        }

        private static bool IsTextResponse(string contentType, byte[] body)
        {
            if (string.IsNullOrWhiteSpace(contentType) == false)
            {
                return contentType.Contains("json", StringComparison.OrdinalIgnoreCase) == true ||
                    contentType.Contains("text/", StringComparison.OrdinalIgnoreCase) == true ||
                    contentType.Contains("xml", StringComparison.OrdinalIgnoreCase) == true ||
                    contentType.Contains("javascript", StringComparison.OrdinalIgnoreCase) == true ||
                    contentType.Contains("html", StringComparison.OrdinalIgnoreCase) == true;
            }

            if (body.Length == 0)
            {
                return true;
            }

            return body.Take(64).All(item => item == 9 || item == 10 || item == 13 || (item >= 32 && item <= 126));
        }

        private static Encoding ResolveEncoding(string contentType)
        {
            var charsetIndex = contentType.IndexOf("charset=", StringComparison.OrdinalIgnoreCase);
            if (charsetIndex > -1)
            {
                var charset = contentType.Substring(charsetIndex + "charset=".Length).Trim().Trim('"', '\'').TrimEnd(';');
                try
                {
                    return Encoding.GetEncoding(charset);
                }
                catch
                {
                }
            }

            return Encoding.UTF8;
        }

        public class ProxyLabExecuteRequest
        {
            public string RequestKey { get; set; } = string.Empty;

            public string BearerToken { get; set; } = string.Empty;

            public string Method { get; set; } = "GET";

            public string ContentType { get; set; } = "application/json";

            public string? Body { get; set; }

            public int? TimeoutMS { get; set; }

            public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        public class ProxyLabExecuteResponse
        {
            public string Mode { get; set; } = string.Empty;

            public string RequestKey { get; set; } = string.Empty;

            public string RequestUri { get; set; } = string.Empty;

            public int StatusCode { get; set; }

            public string StatusText { get; set; } = string.Empty;

            public string ResponseUrl { get; set; } = string.Empty;

            public string ContentType { get; set; } = string.Empty;

            public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            public string Body { get; set; } = string.Empty;

            public bool IsTextResponse { get; set; }

            public string Encoding { get; set; } = "utf-8";

            public long ElapsedMS { get; set; }
        }
    }
}
