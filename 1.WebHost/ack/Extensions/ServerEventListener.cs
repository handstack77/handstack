using System.Collections.Generic;
using System.Diagnostics.Tracing;
using System.Threading;

namespace ack.Extensions
{
    public class SystemRuntimeCounter
    {
        public double TimeinGCsincelastGC = 0;
        public double AllocationRate = 0;
        public double CPUUsage = 0;
        public double ExceptionCount = 0;
        public double Gen0GCCount = 0;
        public double Gen1GCCount = 0;
        public double Gen2GCCount = 0;
        public double NumberofAssembliesLoaded = 0;
        public double ThreadPoolCompletedWorkItemCount = 0;
        public double ThreadPoolQueueLength = 0;
        public double ThreadPoolThreadCount = 0;
        public double WorkingSet = 0;
    }

    public class AspNetCoreHostingCounter
    {
        public double CurrentRequests = 0;
        public double FailedRequests = 0;
        public double RequestRate = 0;
        public double TotalRequests = 0;
    }

    public class AspNetCoreServerKestrelCounter
    {
        public double ConnectionQueueLength = 0;
        public double ConnectionRate = 0;
        public double CurrentConnections = 0;
        public double CurrentTLSHandshakes = 0;
        public double CurrentUpgradedRequests = 0;
        public double FailedTLSHandshakes = 0;
        public double RequestQueueLength = 0;
        public double TLSHandshakeRate = 0;
        public double TotalConnections = 0;
        public double TotalTLSHandshakes = 0;
    }

    public class SystemNetSocketCounter
    {
        public double OutgoingConnectionsEstablished = 0;
        public double IncomingConnectionsEstablished = 0;
        public double CurrentOutgoingConnectAttempts = 0;
        public double BytesReceived = 0;
        public double BytesSent = 0;
    }

    public class SystemRuntimeMetricsSnapshot
    {
        public double TimeInGCSinceLastGC { get; set; }
        public double AllocationRate { get; set; }
        public double CpuUsage { get; set; }
        public double ExceptionCount { get; set; }
        public double Gen0GCCount { get; set; }
        public double Gen1GCCount { get; set; }
        public double Gen2GCCount { get; set; }
        public double NumberOfAssembliesLoaded { get; set; }
        public double ThreadPoolCompletedWorkItemCount { get; set; }
        public double ThreadPoolQueueLength { get; set; }
        public double ThreadPoolThreadCount { get; set; }
        public double WorkingSetBytes { get; set; }
        public double WorkingSetMB { get; set; }
    }

    public class AspNetCoreHostingMetricsSnapshot
    {
        public double CurrentRequests { get; set; }
        public double FailedRequests { get; set; }
        public double RequestRate { get; set; }
        public double TotalRequests { get; set; }
    }

    public class AspNetCoreServerKestrelMetricsSnapshot
    {
        public double ConnectionQueueLength { get; set; }
        public double ConnectionRate { get; set; }
        public double CurrentConnections { get; set; }
        public double CurrentTLSHandshakes { get; set; }
        public double CurrentUpgradedRequests { get; set; }
        public double FailedTLSHandshakes { get; set; }
        public double RequestQueueLength { get; set; }
        public double TLSHandshakeRate { get; set; }
        public double TotalConnections { get; set; }
        public double TotalTLSHandshakes { get; set; }
    }

    public class SystemNetSocketMetricsSnapshot
    {
        public double OutgoingConnectionsEstablished { get; set; }
        public double IncomingConnectionsEstablished { get; set; }
        public double CurrentOutgoingConnectAttempts { get; set; }
        public double BytesReceived { get; set; }
        public double BytesSent { get; set; }
    }

    // https://docs.microsoft.com/ko-kr/dotnet/core/diagnostics/available-counters
    public class ServerEventListener : EventListener
    {
        private SystemRuntimeCounter systemRuntimeCounter = new SystemRuntimeCounter();
        private AspNetCoreHostingCounter aspNetCoreHostingCounter = new AspNetCoreHostingCounter();
        private AspNetCoreServerKestrelCounter aspNetCoreServerKestrelCounter = new AspNetCoreServerKestrelCounter();
        private SystemNetSocketCounter systemNetSocketCounter = new SystemNetSocketCounter();

        private const string collectionSystemRuntime = "System.Runtime";
        private const string collectionAspNetCoreHosting = "Microsoft.AspNetCore.Hosting";
        private const string collectionAspNetCoreServerKestrel = "Microsoft-AspNetCore-Server-Kestrel";
        private const string collectionSystemNetSocket = "System.Net.Sockets";

        public SystemRuntimeCounter SystemRuntime => systemRuntimeCounter;
        public AspNetCoreHostingCounter AspNetCoreHosting => aspNetCoreHostingCounter;
        public AspNetCoreServerKestrelCounter AspNetCoreServerKestrel => aspNetCoreServerKestrelCounter;
        public SystemNetSocketCounter SystemNetSocket => systemNetSocketCounter;

        public SystemRuntimeMetricsSnapshot GetSystemRuntimeMetrics()
        {
            var workingSetBytes = Volatile.Read(ref systemRuntimeCounter.WorkingSet);

            return new SystemRuntimeMetricsSnapshot
            {
                TimeInGCSinceLastGC = Volatile.Read(ref systemRuntimeCounter.TimeinGCsincelastGC),
                AllocationRate = Volatile.Read(ref systemRuntimeCounter.AllocationRate),
                CpuUsage = Volatile.Read(ref systemRuntimeCounter.CPUUsage),
                ExceptionCount = Volatile.Read(ref systemRuntimeCounter.ExceptionCount),
                Gen0GCCount = Volatile.Read(ref systemRuntimeCounter.Gen0GCCount),
                Gen1GCCount = Volatile.Read(ref systemRuntimeCounter.Gen1GCCount),
                Gen2GCCount = Volatile.Read(ref systemRuntimeCounter.Gen2GCCount),
                NumberOfAssembliesLoaded = Volatile.Read(ref systemRuntimeCounter.NumberofAssembliesLoaded),
                ThreadPoolCompletedWorkItemCount = Volatile.Read(ref systemRuntimeCounter.ThreadPoolCompletedWorkItemCount),
                ThreadPoolQueueLength = Volatile.Read(ref systemRuntimeCounter.ThreadPoolQueueLength),
                ThreadPoolThreadCount = Volatile.Read(ref systemRuntimeCounter.ThreadPoolThreadCount),
                WorkingSetBytes = workingSetBytes,
                WorkingSetMB = global::System.Math.Round(workingSetBytes / (1024d * 1024d), 2)
            };
        }

        public AspNetCoreHostingMetricsSnapshot GetAspNetCoreHostingMetrics()
        {
            return new AspNetCoreHostingMetricsSnapshot
            {
                CurrentRequests = Volatile.Read(ref aspNetCoreHostingCounter.CurrentRequests),
                FailedRequests = Volatile.Read(ref aspNetCoreHostingCounter.FailedRequests),
                RequestRate = Volatile.Read(ref aspNetCoreHostingCounter.RequestRate),
                TotalRequests = Volatile.Read(ref aspNetCoreHostingCounter.TotalRequests)
            };
        }

        public AspNetCoreServerKestrelMetricsSnapshot GetAspNetCoreServerKestrelMetrics()
        {
            return new AspNetCoreServerKestrelMetricsSnapshot
            {
                ConnectionQueueLength = Volatile.Read(ref aspNetCoreServerKestrelCounter.ConnectionQueueLength),
                ConnectionRate = Volatile.Read(ref aspNetCoreServerKestrelCounter.ConnectionRate),
                CurrentConnections = Volatile.Read(ref aspNetCoreServerKestrelCounter.CurrentConnections),
                CurrentTLSHandshakes = Volatile.Read(ref aspNetCoreServerKestrelCounter.CurrentTLSHandshakes),
                CurrentUpgradedRequests = Volatile.Read(ref aspNetCoreServerKestrelCounter.CurrentUpgradedRequests),
                FailedTLSHandshakes = Volatile.Read(ref aspNetCoreServerKestrelCounter.FailedTLSHandshakes),
                RequestQueueLength = Volatile.Read(ref aspNetCoreServerKestrelCounter.RequestQueueLength),
                TLSHandshakeRate = Volatile.Read(ref aspNetCoreServerKestrelCounter.TLSHandshakeRate),
                TotalConnections = Volatile.Read(ref aspNetCoreServerKestrelCounter.TotalConnections),
                TotalTLSHandshakes = Volatile.Read(ref aspNetCoreServerKestrelCounter.TotalTLSHandshakes)
            };
        }

        public SystemNetSocketMetricsSnapshot GetSystemNetSocketMetrics()
        {
            return new SystemNetSocketMetricsSnapshot
            {
                OutgoingConnectionsEstablished = Volatile.Read(ref systemNetSocketCounter.OutgoingConnectionsEstablished),
                IncomingConnectionsEstablished = Volatile.Read(ref systemNetSocketCounter.IncomingConnectionsEstablished),
                CurrentOutgoingConnectAttempts = Volatile.Read(ref systemNetSocketCounter.CurrentOutgoingConnectAttempts),
                BytesReceived = Volatile.Read(ref systemNetSocketCounter.BytesReceived),
                BytesSent = Volatile.Read(ref systemNetSocketCounter.BytesSent)
            };
        }

        protected override void OnEventSourceCreated(EventSource source)
        {
            if (source.Name == collectionSystemRuntime
                || source.Name == collectionAspNetCoreHosting
                || source.Name == collectionAspNetCoreServerKestrel
                || source.Name == collectionSystemNetSocket
                )
            {
                EnableEvents(source, EventLevel.LogAlways, EventKeywords.All, new Dictionary<string, string?>()
                {
                    ["EventCounterIntervalSec"] = "1"
                });
            }
        }

        // https://docs.microsoft.com/ko-kr/dotnet/core/diagnostics/available-counters
        protected override void OnEventWritten(EventWrittenEventArgs eventData)
        {
            if (eventData.Payload != null && eventData.Payload.Count > 0 && eventData.Payload[0] is IDictionary<string, object> payload)
            {
                var payloadName = (string)payload["Name"];
                var eventSourceName = eventData.EventSource.Name;
                switch (eventSourceName)
                {
                    case collectionSystemRuntime:
                        switch (payloadName)
                        {
                            case "time-in-gc":
                                Volatile.Write(ref systemRuntimeCounter.TimeinGCsincelastGC, GetRelevantMetric(payload));
                                break;
                            case "alloc-rate":
                                Volatile.Write(ref systemRuntimeCounter.AllocationRate, GetRelevantMetric(payload));
                                break;
                            case "cpu-usage":
                                Volatile.Write(ref systemRuntimeCounter.CPUUsage, GetRelevantMetric(payload));
                                break;
                            case "exception-count":
                                Volatile.Write(ref systemRuntimeCounter.ExceptionCount, GetRelevantMetric(payload));
                                break;
                            case "gen-0-gc-count":
                                Volatile.Write(ref systemRuntimeCounter.Gen0GCCount, GetRelevantMetric(payload));
                                break;
                            case "gen-1-gc-count":
                                Volatile.Write(ref systemRuntimeCounter.Gen1GCCount, GetRelevantMetric(payload));
                                break;
                            case "gen-2-gc-count":
                                Volatile.Write(ref systemRuntimeCounter.Gen2GCCount, GetRelevantMetric(payload));
                                break;
                            case "assembly-count":
                                Volatile.Write(ref systemRuntimeCounter.NumberofAssembliesLoaded, GetRelevantMetric(payload));
                                break;
                            case "threadpool-completed-items-count":
                                Volatile.Write(ref systemRuntimeCounter.ThreadPoolCompletedWorkItemCount, GetRelevantMetric(payload));
                                break;
                            case "threadpool-queue-length":
                                Volatile.Write(ref systemRuntimeCounter.ThreadPoolQueueLength, GetRelevantMetric(payload));
                                break;
                            case "threadpool-thread-count":
                                Volatile.Write(ref systemRuntimeCounter.ThreadPoolThreadCount, GetRelevantMetric(payload));
                                break;
                            case "working-set":
                                Volatile.Write(ref systemRuntimeCounter.WorkingSet, GetRelevantMetric(payload));
                                break;
                        }
                        break;
                    case collectionAspNetCoreHosting:
                        switch (payloadName)
                        {
                            case "current-requests":
                                Volatile.Write(ref aspNetCoreHostingCounter.CurrentRequests, GetRelevantMetric(payload));
                                break;
                            case "failed-requests":
                                Volatile.Write(ref aspNetCoreHostingCounter.FailedRequests, GetRelevantMetric(payload));
                                break;
                            case "requests-per-second":
                                Volatile.Write(ref aspNetCoreHostingCounter.RequestRate, GetRelevantMetric(payload));
                                break;
                            case "total-requests":
                                Volatile.Write(ref aspNetCoreHostingCounter.TotalRequests, GetRelevantMetric(payload));
                                break;
                        }
                        break;
                    case collectionAspNetCoreServerKestrel:
                        switch (payloadName)
                        {
                            case "connection-queue-length":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.ConnectionQueueLength, GetRelevantMetric(payload));
                                break;
                            case "connections-per-second":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.ConnectionRate, GetRelevantMetric(payload));
                                break;
                            case "current-connections":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.CurrentConnections, GetRelevantMetric(payload));
                                break;
                            case "current-tls-handshakes":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.CurrentTLSHandshakes, GetRelevantMetric(payload));
                                break;
                            case "current-upgraded-requests":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.CurrentUpgradedRequests, GetRelevantMetric(payload));
                                break;
                            case "failed-tls-handshakes":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.FailedTLSHandshakes, GetRelevantMetric(payload));
                                break;
                            case "request-queue-length":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.RequestQueueLength, GetRelevantMetric(payload));
                                break;
                            case "tls-handshakes-per-second":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.TLSHandshakeRate, GetRelevantMetric(payload));
                                break;
                            case "total-connections":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.TotalConnections, GetRelevantMetric(payload));
                                break;
                            case "total-tls-handshakes":
                                Volatile.Write(ref aspNetCoreServerKestrelCounter.TotalTLSHandshakes, GetRelevantMetric(payload));
                                break;
                        }
                        break;
                    case collectionSystemNetSocket:
                        switch (payloadName)
                        {
                            case "outgoing-connections-established":
                                Volatile.Write(ref systemNetSocketCounter.OutgoingConnectionsEstablished, GetRelevantMetric(payload));
                                break;
                            case "incoming-connections-established":
                                Volatile.Write(ref systemNetSocketCounter.IncomingConnectionsEstablished, GetRelevantMetric(payload));
                                break;
                            case "current-outgoing-connect-attempts":
                                Volatile.Write(ref systemNetSocketCounter.CurrentOutgoingConnectAttempts, GetRelevantMetric(payload));
                                break;
                            case "bytes-received":
                                Volatile.Write(ref systemNetSocketCounter.BytesReceived, GetRelevantMetric(payload));
                                break;
                            case "bytes-sent":
                                Volatile.Write(ref systemNetSocketCounter.BytesSent, GetRelevantMetric(payload));
                                break;
                        }
                        break;
                }
            }
        }

        protected dynamic GetRelevantMetric(IDictionary<string, object> eventPayload, string metricName = "Mean")
        {
            object? result = null;

            if (eventPayload.TryGetValue(metricName, out result) == false)
            {
                result = null;
            }

            if (result == null || result.ToString() == "0")
            {
                eventPayload.TryGetValue("CounterType", out var counterType);
                var counterName = counterType?.ToString();
                var metricKey = "Mean";
                if (counterName != null)
                {
                    metricKey = counterName;
                }

                if (metricName != metricKey && result == null && eventPayload.TryGetValue(metricName, out result) == false)
                {
                    result = null;
                }

                if (result == null && eventPayload.TryGetValue("Increment", out result) == false)
                {
                    result = null;
                }
            }

            if (result == null)
            {
                return 0;
            }
            else
            {
                if (result.GetType().Name == "Int32")
                {
                    return (int)result;
                }
                else
                {
                    return (double)result;
                }
            }
        }
    }
}
