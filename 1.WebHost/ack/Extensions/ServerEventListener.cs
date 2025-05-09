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
