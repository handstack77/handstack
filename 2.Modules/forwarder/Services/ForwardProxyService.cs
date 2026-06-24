using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using forwarder.Entity;
using forwarder.Models;

using Serilog;

namespace forwarder.Services
{
    public class ForwardProxyService : IForwardProxyService
    {
        private static readonly HashSet<string> IgnoredResponseContentHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Content-Length"
        };

        private readonly ILogger logger;
        private readonly HttpClient httpClient;

        public ForwardProxyService(ILogger logger, HttpClient httpClient)
        {
            this.logger = logger;
            this.httpClient = httpClient;
            this.httpClient.Timeout = Timeout.InfiniteTimeSpan;
        }

        public async Task<ForwardProxyExecution> ForwardAsync(ForwardProxyRequest request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();

            using var timeoutCancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCancellationTokenSource.CancelAfter(TimeSpan.FromMilliseconds(request.TimeoutMS ?? ModuleConfiguration.RequestTimeoutMS));

            using var httpRequest = new HttpRequestMessage(new HttpMethod(request.Method), request.TargetUrl);
            if (request.Body.Length > 0)
            {
                httpRequest.Content = new ByteArrayContent(request.Body);
            }

            foreach (var header in request.Headers)
            {
                if (httpRequest.Headers.TryAddWithoutValidation(header.Key, header.Value) == false)
                {
                    httpRequest.Content ??= new ByteArrayContent(Array.Empty<byte>());
                    httpRequest.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
                }
            }

            var stopwatch = Stopwatch.StartNew();
            using var response = await httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseContentRead, timeoutCancellationTokenSource.Token);
            var responseBody = string.Equals(request.Method, "HEAD", StringComparison.OrdinalIgnoreCase) == true
                ? Array.Empty<byte>()
                : await response.Content.ReadAsByteArrayAsync(timeoutCancellationTokenSource.Token);

            var result = new ForwardProxyResult
            {
                StatusCode = (int)response.StatusCode,
                StatusText = response.ReasonPhrase ?? string.Empty,
                ResponseUrl = response.RequestMessage?.RequestUri?.ToString() ?? request.TargetUrl,
                Headers = GetResponseHeaders(response),
                Body = responseBody
            };

            stopwatch.Stop();
            logger.Information(
                "[{LogCategory}] " + $"userID: {request.UserID}, method: {request.Method}, targetUrl: {request.TargetUrl}, statusCode: {result.StatusCode}, elapsedMS: {stopwatch.ElapsedMilliseconds}",
                "ForwardProxyService/ForwardAsync");

            return new ForwardProxyExecution(result);
        }

        private static Dictionary<string, string> GetResponseHeaders(HttpResponseMessage response)
        {
            var result = response.Headers.ToDictionary(
                header => header.Key,
                header => string.Join(", ", header.Value),
                StringComparer.OrdinalIgnoreCase);

            foreach (var header in response.Content.Headers)
            {
                if (IgnoredResponseContentHeaders.Contains(header.Key) == true)
                {
                    continue;
                }

                result[header.Key] = string.Join(", ", header.Value);
            }

            return result;
        }
    }
}
