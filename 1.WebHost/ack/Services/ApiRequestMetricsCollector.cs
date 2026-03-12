using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace ack.Services
{
    public readonly record struct ApiRequestMetricKey(string Method, string Controller, string Action, string Route);

    public sealed class ApiRequestMetricSnapshot
    {
        public string Method { get; init; } = string.Empty;

        public string Controller { get; init; } = string.Empty;

        public string Action { get; init; } = string.Empty;

        public string Route { get; init; } = string.Empty;

        public long RequestCount { get; init; }

        public double DurationSumSeconds { get; init; }

        public double DurationMaxSeconds { get; init; }

        public IReadOnlyDictionary<int, long> ResponseCounts { get; init; } = new Dictionary<int, long>();
    }

    public sealed class ApiRequestMetricsCollector
    {
        private readonly ConcurrentDictionary<ApiRequestMetricKey, ApiRequestMetricEntry> entries = new ConcurrentDictionary<ApiRequestMetricKey, ApiRequestMetricEntry>();

        public void Record(ApiRequestMetricKey key, int statusCode, long elapsedTicks)
        {
            var entry = entries.GetOrAdd(key, static metricKey => new ApiRequestMetricEntry(metricKey));
            entry.Record(statusCode, elapsedTicks);
        }

        public IReadOnlyList<ApiRequestMetricSnapshot> GetSnapshots()
        {
            return entries.Values
                .Select(entry => entry.ToSnapshot())
                .OrderBy(entry => entry.Controller, StringComparer.Ordinal)
                .ThenBy(entry => entry.Action, StringComparer.Ordinal)
                .ThenBy(entry => entry.Method, StringComparer.Ordinal)
                .ThenBy(entry => entry.Route, StringComparer.Ordinal)
                .ToArray();
        }

        private sealed class ApiRequestMetricEntry
        {
            private readonly ApiRequestMetricKey key;
            private readonly ConcurrentDictionary<int, long> responseCounts = new ConcurrentDictionary<int, long>();
            private long requestCount;
            private long durationTotalTicks;
            private long durationMaxTicks;

            public ApiRequestMetricEntry(ApiRequestMetricKey key)
            {
                this.key = key;
            }

            public void Record(int statusCode, long elapsedTicks)
            {
                Interlocked.Increment(ref requestCount);
                Interlocked.Add(ref durationTotalTicks, elapsedTicks);
                UpdateDurationMaxTicks(elapsedTicks);
                responseCounts.AddOrUpdate(statusCode, 1, static (_, currentCount) => currentCount + 1);
            }

            public ApiRequestMetricSnapshot ToSnapshot()
            {
                var responseSnapshot = responseCounts
                    .OrderBy(item => item.Key)
                    .ToDictionary(item => item.Key, item => item.Value);

                var totalTicks = Volatile.Read(ref durationTotalTicks);
                var maxTicks = Volatile.Read(ref durationMaxTicks);

                return new ApiRequestMetricSnapshot
                {
                    Method = key.Method,
                    Controller = key.Controller,
                    Action = key.Action,
                    Route = key.Route,
                    RequestCount = Volatile.Read(ref requestCount),
                    DurationSumSeconds = totalTicks / (double)TimeSpan.TicksPerSecond,
                    DurationMaxSeconds = maxTicks / (double)TimeSpan.TicksPerSecond,
                    ResponseCounts = responseSnapshot
                };
            }

            private void UpdateDurationMaxTicks(long elapsedTicks)
            {
                long currentMax = Volatile.Read(ref durationMaxTicks);
                while (elapsedTicks > currentMax)
                {
                    long original = Interlocked.CompareExchange(ref durationMaxTicks, elapsedTicks, currentMax);
                    if (original == currentMax)
                    {
                        return;
                    }

                    currentMax = original;
                }
            }
        }
    }
}
