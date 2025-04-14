using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace HandStack.Web.Extensions
{
    public class HtmxTokenInjectionMiddleware
    {
        private readonly RequestDelegate _next;

        public HtmxTokenInjectionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var requestPath = context.Request.Path.Value ?? string.Empty;

            if (requestPath.Contains("/api/", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
                    var tokens = antiforgery.GetAndStoreTokens(context);
                    if (!string.IsNullOrEmpty(tokens.RequestToken))
                    {
                        context.Response.Headers.Append("XSRF-TOKEN", tokens.RequestToken);
                    }
                }
                catch
                {
                    Console.WriteLine($"api Antiforgery 서비스 확인 필요");
                }

                await _next(context);
                return;
            }

            bool isHtmlPage = (requestPath.Contains("/view/", StringComparison.OrdinalIgnoreCase) &&
                               requestPath.EndsWith(".html", StringComparison.OrdinalIgnoreCase)) ||
                               requestPath == "/";

            if (isHtmlPage)
            {
                IAntiforgery antiforgery;
                try
                {
                    antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
                }
                catch
                {
                    Console.WriteLine($"view Antiforgery 서비스 확인 필요");
                    await _next(context);
                    return;
                }

                var tokens = antiforgery.GetAndStoreTokens(context);
                if (!string.IsNullOrEmpty(tokens.RequestToken))
                {
                    var originalBodyStream = context.Response.Body;
                    using var memoryStream = new MemoryStream();
                    context.Response.Body = memoryStream;

                    await _next(context);

                    if (context.Response.ContentType?.StartsWith("text/html", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        memoryStream.Seek(0, SeekOrigin.Begin);
                        using var reader = new StreamReader(memoryStream);
                        var html = await reader.ReadToEndAsync();

                        var inputTag = $"<input type=\"hidden\" id=\"__RequestVerificationToken\" value=\"{tokens.RequestToken}\" />";
                        var bodyPattern = @"<body[^>]*>";
                        var synSectionPattern = @"<syn-section[^>]*selector\s*=\s*[""']section#component-body[""'][^>]*>";

                        if (Regex.IsMatch(html, bodyPattern, RegexOptions.IgnoreCase | RegexOptions.Singleline))
                        {
                            // <body> 태그가 있으면 삽입
                            html = Regex.Replace(
                                html,
                                bodyPattern,
                                match => match.Value + inputTag,
                                RegexOptions.IgnoreCase | RegexOptions.Singleline
                            );
                        }
                        else if (Regex.IsMatch(html, synSectionPattern, RegexOptions.IgnoreCase | RegexOptions.Singleline))
                        {
                            // <syn-section selector="section#component-body"> 태그가 있으면 삽입
                            html = Regex.Replace(
                                html,
                                synSectionPattern,
                                match => match.Value + inputTag,
                                RegexOptions.IgnoreCase | RegexOptions.Singleline
                            );
                        }
                        else
                        {
                            html = inputTag + html;
                        }

                        context.Response.Body = originalBodyStream;
                        context.Response.ContentLength = Encoding.UTF8.GetByteCount(html);
                        await context.Response.WriteAsync(html, Encoding.UTF8);
                        return;
                    }

                    memoryStream.Seek(0, SeekOrigin.Begin);
                    await memoryStream.CopyToAsync(originalBodyStream);
                    context.Response.Body = originalBodyStream;
                    return;
                }
            }

            await _next(context);
        }
    }
}
