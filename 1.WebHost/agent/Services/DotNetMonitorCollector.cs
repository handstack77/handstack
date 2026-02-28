using System.Globalization;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;

using agent.Entity;
using agent.Options;

using Microsoft.Extensions.Options;

namespace agent.Services
{
    public sealed class DotNetMonitorCollector : IDotNetMonitorCollector
    {
        public const string HttpClientName = "dotnet-monitor";

        private static readonly string[] RequestTotalMetricNames = new[]
        {
            "aspnetcore_requests_received_total",
            "http_server_request_duration_seconds_count"
        };

        private static readonly string[] RequestFailedMetricNames = new[]
        {
            "aspnetcore_requests_failed_total"
        };

        private static readonly string[] RequestActiveMetricNames = new[]
        {
            "http_server_active_requests",
            "aspnetcore_requests_in_progress"
        };

        private static readonly string[] ResponseMetricNames = new[]
        {
            "http_server_request_duration_seconds_count",
            "aspnetcore_requests_received_total"
        };

        private static readonly string[] ProcessIdLabelNames = new[]
        {
            "pid",
            "process_id",
            "processid"
        };

        private static readonly string[] ProcessNameLabelNames = new[]
        {
            "process_name",
            "process"
        };

        private static readonly string[] StatusCodeLabelNames = new[]
        {
            "status_code",
            "http_response_status_code",
            "http_status_code",
            "code"
        };

        private static readonly Regex MetricRegex = new Regex("^(?<name>[a-zA-Z_:][a-zA-Z0-9_:]*)(\\{(?<labels>.*)\\})?\\s+(?<value>[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?|NaN|[+-]?Inf)$", RegexOptions.Compiled);
        private static readonly Regex LabelRegex = new Regex("(?<key>[a-zA-Z_][a-zA-Z0-9_]*)=\"(?<value>(?:\\\\.|[^\"])*)\"", RegexOptions.Compiled);

        private readonly IHttpClientFactory httpClientFactory;
        private readonly IOptionsMonitor<AgentOptions> optionsMonitor;
        private readonly ILogger<DotNetMonitorCollector> logger;

        public DotNetMonitorCollector(
            IHttpClientFactory httpClientFactory,
            IOptionsMonitor<AgentOptions> optionsMonitor,
            ILogger<DotNetMonitorCollector> logger)
        {
            this.httpClientFactory = httpClientFactory;
            this.optionsMonitor = optionsMonitor;
            this.logger = logger;
        }

        public async Task<TargetMonitorStats?> GetStatsAsync(TargetProcessOptions target, int? pid, CancellationToken cancellationToken)
        {
            if (TryCreateClient(out var client, out var monitorOptions, out var errorMessage) == false)
            {
                if (string.Equals(errorMessage, "disabled", StringComparison.Ordinal) == false)
                {
                    logger.LogDebug("dotnet-monitor stats skipped: {Message}", errorMessage);
                }

                return null;
            }

            try
            {
                var metricsPath = string.IsNullOrWhiteSpace(monitorOptions.MetricsPath) == true
                    ? "/metrics"
                    : monitorOptions.MetricsPath;

                using var response = await client.GetAsync(metricsPath, cancellationToken);
                if (response.IsSuccessStatusCode == false)
                {
                    logger.LogWarning("dotnet-monitor metrics request failed. Status={StatusCode}", response.StatusCode);
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                if (string.IsNullOrWhiteSpace(content) == true)
                {
                    return null;
                }

                var samples = ParseMetrics(content);
                if (samples.Count == 0)
                {
                    return null;
                }

                var processName = target.ResolveProcessName();
                var scopedSamples = samples.Where(sample => IsTargetMetricSample(sample, pid, processName)).ToList();
                if (scopedSamples.Count == 0)
                {
                    scopedSamples = samples.Where(sample => HasAnyProcessLabel(sample) == false).ToList();
                }

                if (scopedSamples.Count == 0)
                {
                    return null;
                }

                return BuildMonitorStats(scopedSamples);
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "dotnet-monitor stats request failed. TargetId={TargetId}, Pid={Pid}", target.Id, pid);
                return null;
            }
        }

        public async Task<CollectResult> CollectAsync(TargetProcessOptions target, int pid, CancellationToken cancellationToken)
        {
            if (TryCreateClient(out var client, out var monitorOptions, out var errorMessage) == false)
            {
                return new CollectResult
                {
                    Success = false,
                    Message = $"dotnet-monitor is not available: {errorMessage}",
                    TargetId = target.Id,
                    Pid = pid
                };
            }

            var collectRootPath = ResolvePath(optionsMonitor.CurrentValue.CollectDirectoryPath);
            var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture);
            var targetPath = Path.Combine(collectRootPath, target.Id, timestamp);

            Directory.CreateDirectory(targetPath);

            var result = new CollectResult
            {
                Success = true,
                Message = "Collection completed.",
                TargetId = target.Id,
                Pid = pid,
                DirectoryPath = targetPath
            };

            var metricsPath = string.IsNullOrWhiteSpace(monitorOptions.MetricsPath) == true
                ? "/metrics"
                : monitorOptions.MetricsPath;

            await DownloadAsync(client, metricsPath, Path.Combine(targetPath, "metrics.prom"), "metrics", result, cancellationToken);

            var durationSeconds = monitorOptions.DefaultCollectionDurationSeconds <= 0 ? 30 : monitorOptions.DefaultCollectionDurationSeconds;

            var logsPathTemplate = string.IsNullOrWhiteSpace(monitorOptions.LogsPathTemplate) == true
                ? "/logs/{pid}"
                : monitorOptions.LogsPathTemplate;

            var tracePathTemplate = string.IsNullOrWhiteSpace(monitorOptions.TracePathTemplate) == true
                ? "/trace/{pid}"
                : monitorOptions.TracePathTemplate;

            var dumpPathTemplate = string.IsNullOrWhiteSpace(monitorOptions.DumpPathTemplate) == true
                ? "/dump/{pid}"
                : monitorOptions.DumpPathTemplate;

            var logsPath = AppendQuery(logsPathTemplate.Replace("{pid}", pid.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal), "durationSeconds", durationSeconds.ToString(CultureInfo.InvariantCulture));
            var tracePath = AppendQuery(tracePathTemplate.Replace("{pid}", pid.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal), "durationSeconds", durationSeconds.ToString(CultureInfo.InvariantCulture));
            var dumpPath = dumpPathTemplate.Replace("{pid}", pid.ToString(CultureInfo.InvariantCulture), StringComparison.Ordinal);

            await DownloadAsync(client, logsPath, Path.Combine(targetPath, "logs.ndjson"), "logs", result, cancellationToken);
            await DownloadAsync(client, tracePath, Path.Combine(targetPath, "trace.nettrace"), "trace", result, cancellationToken);
            await DownloadAsync(client, dumpPath, Path.Combine(targetPath, "dump.dmp"), "dump", result, cancellationToken);

            if (result.Errors.Count > 0)
            {
                result.Success = false;
                result.Message = "Collection completed with errors.";
            }

            return result;
        }

        private bool TryCreateClient(out HttpClient client, out DotNetMonitorOptions monitorOptions, out string errorMessage)
        {
            client = httpClientFactory.CreateClient(HttpClientName);
            monitorOptions = optionsMonitor.CurrentValue.DotNetMonitor;
            errorMessage = "disabled";

            if (monitorOptions.Enabled == false)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(monitorOptions.BaseAddress) == true)
            {
                errorMessage = "base address is empty.";
                return false;
            }

            if (Uri.TryCreate(monitorOptions.BaseAddress, UriKind.Absolute, out var baseAddress) == false)
            {
                errorMessage = $"invalid base address: '{monitorOptions.BaseAddress}'.";
                return false;
            }

            client.BaseAddress = baseAddress;
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));

            if (string.IsNullOrWhiteSpace(monitorOptions.ApiKey) == false && string.IsNullOrWhiteSpace(monitorOptions.ApiKeyHeaderName) == false)
            {
                var value = monitorOptions.ApiKey.Trim();
                if (string.IsNullOrWhiteSpace(monitorOptions.ApiKeyPrefix) == false)
                {
                    value = $"{monitorOptions.ApiKeyPrefix.Trim()} {value}";
                }

                client.DefaultRequestHeaders.Remove(monitorOptions.ApiKeyHeaderName);
                client.DefaultRequestHeaders.TryAddWithoutValidation(monitorOptions.ApiKeyHeaderName, value);
            }

            errorMessage = "";
            return true;
        }

        private async Task DownloadAsync(
            HttpClient client,
            string requestPath,
            string filePath,
            string kind,
            CollectResult result,
            CancellationToken cancellationToken)
        {
            try
            {
                using var response = await client.GetAsync(requestPath, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (response.IsSuccessStatusCode == false)
                {
                    result.Errors.Add($"{kind}: HTTP {(int)response.StatusCode}");
                    return;
                }

                await using var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
                await using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
                await contentStream.CopyToAsync(fileStream, cancellationToken);
                result.Files.Add(filePath);
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "dotnet-monitor collect failed: {Kind}, Path={Path}", kind, requestPath);
                result.Errors.Add($"{kind}: {exception.Message}");
            }
        }

        private static string AppendQuery(string path, string key, string value)
        {
            if (string.IsNullOrWhiteSpace(path) == true)
            {
                return path;
            }

            var separator = path.Contains('?', StringComparison.Ordinal) == true ? "&" : "?";
            return $"{path}{separator}{Uri.EscapeDataString(key)}={Uri.EscapeDataString(value)}";
        }

        private static string ResolvePath(string path)
        {
            if (string.IsNullOrWhiteSpace(path) == true)
            {
                return Path.Combine(AppContext.BaseDirectory, "collect");
            }

            if (Path.IsPathRooted(path) == true)
            {
                return Path.GetFullPath(path);
            }

            return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, path));
        }

        private static TargetMonitorStats BuildMonitorStats(IReadOnlyCollection<MetricSample> samples)
        {
            return new TargetMonitorStats
            {
                RequestStat = new TargetRequestStat
                {
                    Total = SumMetricValues(samples, RequestTotalMetricNames),
                    Failed = SumMetricValues(samples, RequestFailedMetricNames),
                    Active = SumMetricValues(samples, RequestActiveMetricNames)
                },
                ResponseStat = BuildResponseStats(samples)
            };
        }

        private static TargetResponseStat BuildResponseStats(IReadOnlyCollection<MetricSample> samples)
        {
            var buckets = new long[5];
            var hasValue = false;

            foreach (var sample in samples)
            {
                if (ResponseMetricNames.Contains(sample.Name, StringComparer.OrdinalIgnoreCase) == false)
                {
                    continue;
                }

                if (TryGetStatusCode(sample, out var statusCode) == false)
                {
                    continue;
                }

                var bucket = (statusCode / 100) - 1;
                if (bucket < 0 || bucket >= buckets.Length)
                {
                    continue;
                }

                var value = ConvertToLong(sample.Value);
                if (value is null)
                {
                    continue;
                }

                buckets[bucket] += value.Value;
                hasValue = true;
            }

            if (hasValue == false)
            {
                return new TargetResponseStat();
            }

            return new TargetResponseStat
            {
                Status1xx = buckets[0],
                Status2xx = buckets[1],
                Status3xx = buckets[2],
                Status4xx = buckets[3],
                Status5xx = buckets[4]
            };
        }

        private static bool TryGetStatusCode(MetricSample sample, out int statusCode)
        {
            statusCode = 0;
            foreach (var labelName in StatusCodeLabelNames)
            {
                if (sample.Labels.TryGetValue(labelName, out var labelValue) == false)
                {
                    continue;
                }

                if (int.TryParse(labelValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out statusCode) == true)
                {
                    return true;
                }

                if (labelValue.Length >= 3 && int.TryParse(labelValue.Substring(0, 3), NumberStyles.Integer, CultureInfo.InvariantCulture, out statusCode) == true)
                {
                    return true;
                }
            }

            return false;
        }

        private static long? SumMetricValues(IReadOnlyCollection<MetricSample> samples, IReadOnlyCollection<string> metricNames)
        {
            long sum = 0;
            var hasValue = false;

            foreach (var sample in samples)
            {
                if (metricNames.Contains(sample.Name, StringComparer.OrdinalIgnoreCase) == false)
                {
                    continue;
                }

                var value = ConvertToLong(sample.Value);
                if (value is null)
                {
                    continue;
                }

                sum += value.Value;
                hasValue = true;
            }

            return hasValue == true ? sum : null;
        }

        private static long? ConvertToLong(double value)
        {
            if (double.IsNaN(value) == true || double.IsInfinity(value) == true)
            {
                return null;
            }

            return Convert.ToInt64(Math.Round(value, 0, MidpointRounding.AwayFromZero));
        }

        private static bool IsTargetMetricSample(MetricSample sample, int? pid, string? processName)
        {
            var hasProcessLabel = HasAnyProcessLabel(sample);
            if (pid.HasValue == true)
            {
                if (TryGetProcessId(sample, out var samplePid) == true)
                {
                    return samplePid == pid.Value;
                }
            }

            if (string.IsNullOrWhiteSpace(processName) == false)
            {
                if (TryGetProcessName(sample, out var sampleProcessName) == true)
                {
                    return string.Equals(sampleProcessName, processName, StringComparison.OrdinalIgnoreCase);
                }
            }

            return hasProcessLabel == false;
        }

        private static bool HasAnyProcessLabel(MetricSample sample)
        {
            return sample.Labels.Keys.Any(key => ProcessIdLabelNames.Contains(key, StringComparer.OrdinalIgnoreCase) == true
                || ProcessNameLabelNames.Contains(key, StringComparer.OrdinalIgnoreCase) == true);
        }

        private static bool TryGetProcessId(MetricSample sample, out int pid)
        {
            pid = 0;
            foreach (var key in ProcessIdLabelNames)
            {
                if (sample.Labels.TryGetValue(key, out var value) == false)
                {
                    continue;
                }

                if (int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out pid) == true)
                {
                    return true;
                }
            }

            return false;
        }

        private static bool TryGetProcessName(MetricSample sample, out string processName)
        {
            processName = "";
            foreach (var key in ProcessNameLabelNames)
            {
                if (sample.Labels.TryGetValue(key, out var value) == false)
                {
                    continue;
                }

                processName = value;
                return true;
            }

            return false;
        }

        private static List<MetricSample> ParseMetrics(string content)
        {
            var result = new List<MetricSample>();
            foreach (var rawLine in content.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            {
                var line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line) == true || line.StartsWith('#') == true)
                {
                    continue;
                }

                var match = MetricRegex.Match(line);
                if (match.Success == false)
                {
                    continue;
                }

                if (double.TryParse(match.Groups["value"].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var value) == false)
                {
                    continue;
                }

                var labels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                var labelsGroup = match.Groups["labels"].Value;
                if (string.IsNullOrWhiteSpace(labelsGroup) == false)
                {
                    foreach (Match labelMatch in LabelRegex.Matches(labelsGroup))
                    {
                        labels[labelMatch.Groups["key"].Value] = UnescapeLabelValue(labelMatch.Groups["value"].Value);
                    }
                }

                result.Add(new MetricSample
                {
                    Name = match.Groups["name"].Value,
                    Labels = labels,
                    Value = value
                });
            }

            return result;
        }

        private static string UnescapeLabelValue(string value)
        {
            return value
                .Replace("\\\"", "\"", StringComparison.Ordinal)
                .Replace("\\\\", "\\", StringComparison.Ordinal)
                .Replace("\\n", "\n", StringComparison.Ordinal);
        }

        private sealed class MetricSample
        {
            public string Name { get; set; } = "";

            public Dictionary<string, string> Labels { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            public double Value { get; set; }
        }
    }
}

