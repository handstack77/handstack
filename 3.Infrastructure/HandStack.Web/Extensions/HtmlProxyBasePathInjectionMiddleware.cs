using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

namespace HandStack.Web.Extensions
{
    public class HtmlProxyBasePathInjectionMiddleware
    {
        private readonly RequestDelegate _next;

        public HtmlProxyBasePathInjectionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var requestPath = GetOriginalPath(context);
            if (requestPath.Contains("/api/", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            string proxyBasePath = string.IsNullOrEmpty(GlobalConfiguration.ProxyBasePath) ? "" : "/" + GlobalConfiguration.ProxyBasePath;
            var isHtmlPage = (requestPath.StartsWith(proxyBasePath) == true && requestPath.EndsWith(".html", StringComparison.OrdinalIgnoreCase)) || requestPath == "/";
            var isCssFile = requestPath.StartsWith(proxyBasePath) == true && requestPath.EndsWith(".css", StringComparison.OrdinalIgnoreCase);

            if ((isHtmlPage == true || isCssFile == true) && string.IsNullOrEmpty(GlobalConfiguration.ProxyBasePath) == false)
            {
                var originalBodyStream = context.Response.Body;
                using var memoryStream = new MemoryStream();
                context.Response.Body = memoryStream;

                await _next(context);

                var contentType = context.Response.ContentType ?? string.Empty;
                var shouldProcess = (isHtmlPage && contentType.StartsWith("text/html", StringComparison.OrdinalIgnoreCase)) ||
                                   (isCssFile && contentType.StartsWith("text/css", StringComparison.OrdinalIgnoreCase));

                if (shouldProcess == true)
                {
                    memoryStream.Seek(0, SeekOrigin.Begin);

                    string content;
                    using (var reader = new StreamReader(memoryStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: -1, leaveOpen: true))
                    {
                        content = await reader.ReadToEndAsync();
                    }

                    if (string.IsNullOrEmpty(content) == true)
                    {
                        memoryStream.Seek(0, SeekOrigin.Begin);
                        context.Response.Body = originalBodyStream;
                        await memoryStream.CopyToAsync(originalBodyStream);
                        return;
                    }

                    var trimmedContent = content.TrimStart();
                    if (trimmedContent.StartsWith("<!--noproxybase-->", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        context.Response.Body = originalBodyStream;
                        context.Response.ContentLength = Encoding.UTF8.GetByteCount(content);
                        await context.Response.WriteAsync(content, Encoding.UTF8);
                        return;
                    }

                    var basePath = proxyBasePath + "/";
                    content = RewriteAbsolutePaths(content, basePath, isHtmlPage, isCssFile);

                    if (isHtmlPage == true)
                    {
                        var baseTag = $"<base href=\"{basePath}\" />";
                        var headPattern = @"<head[^>]*>";

                        if (Regex.IsMatch(content, headPattern, RegexOptions.IgnoreCase | RegexOptions.Singleline))
                        {
                            content = Regex.Replace(
                                content,
                                headPattern,
                                match => match.Value + "\n    " + baseTag,
                                RegexOptions.IgnoreCase | RegexOptions.Singleline
                            );
                        }
                        else
                        {
                            var htmlPattern = @"<html[^>]*>";
                            if (Regex.IsMatch(content, htmlPattern, RegexOptions.IgnoreCase | RegexOptions.Singleline))
                            {
                                content = Regex.Replace(
                                    content,
                                    htmlPattern,
                                    match => match.Value + "\n<head>\n    " + baseTag + "\n</head>",
                                    RegexOptions.IgnoreCase | RegexOptions.Singleline
                                );
                            }
                            else
                            {
                                content = baseTag + "\n" + content;
                            }
                        }
                    }

                    context.Response.Body = originalBodyStream;
                    context.Response.ContentLength = Encoding.UTF8.GetByteCount(content);
                    await context.Response.WriteAsync(content, Encoding.UTF8);
                    return;
                }

                memoryStream.Seek(0, SeekOrigin.Begin);
                context.Response.Body = originalBodyStream;
                await memoryStream.CopyToAsync(originalBodyStream);
                return;
            }

            await _next(context);
        }

        private string GetOriginalPath(HttpContext context)
        {
            if (context.Request.Headers.TryGetValue("X-Original-URL", out var originalUrl))
            {
                var url = originalUrl.ToString();
                if (!string.IsNullOrEmpty(url))
                {
                    var urlWithoutQuery = url.Split('?')[0];
                    return urlWithoutQuery;
                }
            }

            if (context.Request.Headers.TryGetValue("X-Original-Uri", out var originalUri))
            {
                var uri = originalUri.ToString();
                if (!string.IsNullOrEmpty(uri))
                {
                    var uriWithoutQuery = uri.Split('?')[0];
                    return uriWithoutQuery;
                }
            }

            if (context.Request.Headers.TryGetValue("X-Forwarded-Path", out var forwardedPath))
            {
                var path = forwardedPath.ToString();
                if (!string.IsNullOrEmpty(path))
                {
                    return path;
                }
            }

            if (context.Request.Headers.TryGetValue("X-Forwarded-Prefix", out var forwardedPrefix))
            {
                var prefix = forwardedPrefix.ToString().TrimEnd('/');
                var currentPath = context.Request.Path.Value ?? string.Empty;
                if (!string.IsNullOrEmpty(prefix))
                {
                    return prefix + currentPath;
                }
            }

            if (context.Request.Headers.TryGetValue("X-Original-Path", out var originalPath))
            {
                var path = originalPath.ToString();
                if (!string.IsNullOrEmpty(path))
                {
                    return path;
                }
            }

            return context.Request.Path.Value ?? string.Empty;
        }

        private string RewriteAbsolutePaths(string content, string basePath, bool isHtml, bool isCss)
        {
            var basePathTrimmed = basePath.TrimEnd('/');

            if (isHtml)
            {
                content = Regex.Replace(
                    content,
                    @"((?:src|href|action|data|poster|background|content)\s*=\s*[""'])(/(?!/))",
                    match =>
                    {
                        var prefix = match.Groups[1].Value;
                        var path = match.Groups[2].Value;

                        if (path.StartsWith(basePathTrimmed + "/"))
                        {
                            return match.Value;
                        }

                        var relativePath = path.TrimStart('/');
                        return $"{prefix}{relativePath}";
                    },
                    RegexOptions.IgnoreCase
                );

                content = Regex.Replace(
                    content,
                    @"url\s*\(\s*([""']?)(/(?!/)[^""')]+)([""']?)\s*\)",
                    match =>
                    {
                        var quote1 = match.Groups[1].Value;
                        var path = match.Groups[2].Value;
                        var quote2 = match.Groups[3].Value;

                        if (path.StartsWith(basePathTrimmed + "/"))
                        {
                            return match.Value;
                        }

                        var relativePath = path.TrimStart('/');
                        return $"url({quote1}{relativePath}{quote2})";
                    },
                    RegexOptions.IgnoreCase
                );
            }

            if (isCss)
            {
                content = Regex.Replace(
                    content,
                    @"url\s*\(\s*([""']?)(/(?!/)[^""')]+)([""']?)\s*\)",
                    match =>
                    {
                        var quote1 = match.Groups[1].Value;
                        var path = match.Groups[2].Value;
                        var quote2 = match.Groups[3].Value;

                        if (path.StartsWith(basePathTrimmed + "/"))
                        {
                            return match.Value;
                        }

                        var relativePath = path.TrimStart('/');
                        return $"url({quote1}{relativePath}{quote2})";
                    },
                    RegexOptions.IgnoreCase
                );
            }

            return content;
        }
    }
}
