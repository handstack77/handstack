using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

using dbclient.Entity;

using HandStack.Web;
using HandStack.Web.MessageContract.Message;

using Newtonsoft.Json;

using Polly;
using Polly.CircuitBreaker;

using RestSharp;

namespace dbclient.Extensions
{
    public class DbClientLoggerClient : IDisposable
    {
        private readonly RestClient restClient;
        private readonly Serilog.ILogger logger;
        private readonly Serilog.ILogger? transactionLogger;

        private readonly BlockingCollection<LogRequest> logQueue;
        private readonly CancellationTokenSource cancellationTokenSource;
        private readonly Task[] backgroundWorkers;

        private CircuitBreakerPolicy<RestResponse> circuitBreakerPolicy;
        private readonly object circuitBreakerLock = new object();
        private DateTime? breakDateTime;

        private readonly ConcurrentBag<LogMessage> logMessagePool;
        private const int MaxPoolSize = 1000;

        private const int BatchSize = 100;
        private const int BatchDelayMs = 1000;
        private const int MaxQueueSize = 10000;
        private const int WorkerCount = 3;

        private const int MaxRetryCount = 2;
        private const int RetryDelayMs = 100;

        public CircuitState CircuitState => circuitBreakerPolicy?.CircuitState ?? CircuitState.Closed;
        public DateTime? BreakDateTime => breakDateTime;

        public DbClientLoggerClient(Serilog.ILogger logger, Serilog.ILogger? transactionLogger = null)
        {
            this.logger = logger;
            this.transactionLogger = transactionLogger;

            restClient = new RestClient();
            logQueue = new BlockingCollection<LogRequest>(MaxQueueSize);
            logMessagePool = new ConcurrentBag<LogMessage>();

            circuitBreakerPolicy = Policy
              .HandleResult<RestResponse>(x => x.IsSuccessStatusCode == false)
              .CircuitBreaker(
                  handledEventsAllowedBeforeBreaking: 3,
                  durationOfBreak: TimeSpan.FromSeconds(ModuleConfiguration.CircuitBreakResetSecond),
                  onBreak: (result, timespan) =>
                  {
                      breakDateTime = DateTime.Now;
                      logger.Error($"[CircuitBreaker/onBreak] Circuit opened for {timespan.TotalSeconds}s. Reason: {result.Result?.Content}");
                  },
                  onReset: () =>
                  {
                      breakDateTime = null;
                      logger.Information($"[CircuitBreaker/onReset] Circuit reset at {DateTime.Now}");
                  },
                  onHalfOpen: () =>
                  {
                      logger.Information("[CircuitBreaker/onHalfOpen] Circuit is half-open, testing...");
                  });

            cancellationTokenSource = new CancellationTokenSource();
            backgroundWorkers = new Task[WorkerCount];
            for (int i = 0; i < WorkerCount; i++)
            {
                int workerId = i;
                backgroundWorkers[i] = Task.Run(() => ProcessLogQueueAsync(workerId, cancellationTokenSource.Token));
            }
        }

        private LogMessage GetLogMessage()
        {
            if (logMessagePool.TryTake(out var logMessage))
            {
                ResetLogMessage(logMessage);
                return logMessage;
            }
            return new LogMessage();
        }

        private void ReturnLogMessage(LogMessage logMessage)
        {
            if (logMessage != null && logMessagePool.Count < MaxPoolSize)
            {
                ResetLogMessage(logMessage);
                logMessagePool.Add(logMessage);
            }
        }

        private void ResetLogMessage(LogMessage logMessage)
        {
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
            logMessage.GlobalID = string.Empty;
            logMessage.Acknowledge = string.Empty;
            logMessage.ApplicationID = string.Empty;
            logMessage.ProjectID = string.Empty;
            logMessage.TransactionID = string.Empty;
            logMessage.ServiceID = string.Empty;
            logMessage.Type = string.Empty;
            logMessage.Flow = string.Empty;
            logMessage.Level = string.Empty;
            logMessage.Format = string.Empty;
            logMessage.Message = string.Empty;
            logMessage.Properties = string.Empty;
            logMessage.UserID = string.Empty;
            logMessage.CreatedAt = string.Empty;
            logMessage.IpAddress = string.Empty;
            logMessage.DeviceID = string.Empty;
            logMessage.ProgramID = ModuleConfiguration.ModuleID;
        }

        public async Task<RestResponse> SendAsync(Method httpVerb, string hostUrl, LogMessage logMessage,
            Action<string>? fallbackFunction = null, Dictionary<string, string>? headers = null,
            CancellationToken cancellationToken = default)
        {
            var restResponse = new RestResponse
            {
                Content = "",
                ErrorMessage = "Equivalent to HTTP status 503",
                ResponseStatus = ResponseStatus.None,
                StatusCode = HttpStatusCode.ServiceUnavailable
            };

            try
            {
                if (string.IsNullOrWhiteSpace(hostUrl))
                {
                    fallbackFunction?.Invoke($"hostUrl 오류: {hostUrl}");
                    return restResponse;
                }

                var restRequest = CreateRestRequest(httpVerb, hostUrl, logMessage, headers);
                restResponse = await ExecuteWithRetryAndCircuitBreakerAsync(restRequest, fallbackFunction, cancellationToken);
            }
            catch (Exception ex)
            {
                restResponse = new RestResponse
                {
                    Content = ex.Message,
                    ErrorMessage = ex.Message,
                    ResponseStatus = ResponseStatus.Error,
                    StatusCode = HttpStatusCode.ServiceUnavailable
                };
                fallbackFunction?.Invoke($"Exception: {ex.Message}");
            }

            return restResponse;
        }

        private RestRequest CreateRestRequest(Method httpVerb, string hostUrl, LogMessage logMessage, Dictionary<string, string>? headers)
        {
            var restRequest = new RestRequest(hostUrl, httpVerb);
            restRequest.AddHeader("cache-control", "no-cache");

            if (headers != null && headers.Count > 0)
            {
                foreach (var header in headers)
                {
                    restRequest.AddHeader(header.Key, header.Value);
                }

                if (!headers.ContainsKey("Content-Type"))
                {
                    restRequest.AddHeader("Content-Type", "application/json");
                }
            }
            else
            {
                restRequest.AddHeader("Content-Type", "application/json");
            }

            logMessage.CreatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");

            if (httpVerb != Method.Get)
            {
                var json = JsonConvert.SerializeObject(logMessage);
                restRequest.AddStringBody(json, DataFormat.Json);
            }

            return restRequest;
        }

        private async Task<RestResponse> ExecuteWithRetryAndCircuitBreakerAsync(RestRequest restRequest,
            Action<string>? fallbackFunction, CancellationToken cancellationToken)
        {
            RestResponse? response = null;
            int retryCount = 0;

            while (retryCount <= MaxRetryCount)
            {
                try
                {
                    lock (circuitBreakerLock)
                    {
                        if (circuitBreakerPolicy.CircuitState == CircuitState.Open)
                        {
                            if (breakDateTime.HasValue &&
                                DateTime.Now >= breakDateTime.Value.AddSeconds(ModuleConfiguration.CircuitBreakResetSecond))
                            {
                                try
                                {
                                    circuitBreakerPolicy.Reset();
                                }
                                catch { }
                            }
                            else
                            {
                                fallbackFunction?.Invoke($"Circuit is open");
                                return new RestResponse
                                {
                                    ErrorMessage = "Circuit breaker is open",
                                    ResponseStatus = ResponseStatus.Error,
                                    StatusCode = HttpStatusCode.ServiceUnavailable
                                };
                            }
                        }
                    }

                    response = circuitBreakerPolicy.Execute(() =>
                    {
                        return restClient.ExecuteAsync(restRequest, cancellationToken).GetAwaiter().GetResult();
                    });

                    if (response.IsSuccessStatusCode)
                    {
                        return response;
                    }

                    if (retryCount < MaxRetryCount && IsRetryableError(response))
                    {
                        retryCount++;
                        var delay = RetryDelayMs * retryCount;
                        logger.Warning($"[Retry] Attempt {retryCount}/{MaxRetryCount}, waiting {delay}ms. Status: {response.StatusCode}");
                        await Task.Delay(delay, cancellationToken);
                        continue;
                    }

                    fallbackFunction?.Invoke($"HTTP {(int)response.StatusCode}: {response.Content}");
                    return response;
                }
                catch (BrokenCircuitException ex)
                {
                    fallbackFunction?.Invoke($"Circuit is open: {ex.Message}");
                    return new RestResponse
                    {
                        ErrorMessage = "Circuit breaker is open",
                        ResponseStatus = ResponseStatus.Error,
                        StatusCode = HttpStatusCode.ServiceUnavailable
                    };
                }
                catch (Exception ex)
                {
                    if (retryCount < MaxRetryCount)
                    {
                        retryCount++;
                        var delay = RetryDelayMs * retryCount;
                        logger.Warning($"[Retry] Exception on attempt {retryCount}/{MaxRetryCount}: {ex.Message}");
                        await Task.Delay(delay, cancellationToken);
                        continue;
                    }

                    throw;
                }
            }

            return response ?? new RestResponse
            {
                ErrorMessage = "Max retries exceeded",
                ResponseStatus = ResponseStatus.Error,
                StatusCode = HttpStatusCode.ServiceUnavailable
            };
        }

        private bool IsRetryableError(RestResponse response)
        {
            return response.StatusCode == HttpStatusCode.RequestTimeout ||
                   response.StatusCode == HttpStatusCode.ServiceUnavailable ||
                   response.StatusCode == HttpStatusCode.GatewayTimeout ||
                   response.StatusCode == (HttpStatusCode)429;
        }

        public void ProgramMessageLogging(string globalID, string acknowledge, string applicationID,
            string message, string properties, Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            ConfigureLogMessage(logMessage, globalID, acknowledge, applicationID, "", "", "",
                "A", "N", "V", "P", message, properties);

            EnqueueLog(logMessage, fallbackFunction, "Program");
        }

        public void TransactionMessageLogging(string globalID, string acknowledge, string applicationID,
            string projectID, string transactionID, string serviceID, string message, string properties,
            Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            ConfigureLogMessage(logMessage, globalID, acknowledge, applicationID, projectID,
                transactionID, serviceID, "A", "N", "V", "P", message, properties);

            EnqueueLog(logMessage, fallbackFunction, "Transaction");
        }

        public void DynamicResponseLogging(string globalID, string acknowledge, string applicationID,
            string message, string properties, Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            ConfigureLogMessage(logMessage, globalID, acknowledge, applicationID, "", "", "",
                "T", "O", "V", "J", message, properties);

            EnqueueLog(logMessage, fallbackFunction, "Response");
        }

        public void DynamicRequestLogging(DynamicRequest request, string acknowledge, string applicationID,
            Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            var message = JsonConvert.SerializeObject(request);
            ConfigureLogMessage(logMessage, request.GlobalID, acknowledge, applicationID, "", "", "",
                "T", "I", "V", "J", message, "");

            EnqueueLog(logMessage, fallbackFunction, "Request");
        }

        private void ConfigureLogMessage(LogMessage logMessage, string globalID, string acknowledge,
            string applicationID, string projectID, string transactionID, string serviceID,
            string type, string flow, string level, string format, string message, string properties)
        {
            logMessage.GlobalID = globalID;
            logMessage.Acknowledge = string.IsNullOrWhiteSpace(acknowledge) ? "N" : acknowledge;
            logMessage.ApplicationID = applicationID;
            logMessage.ProjectID = projectID;
            logMessage.TransactionID = transactionID;
            logMessage.ServiceID = serviceID;
            logMessage.Type = type;
            logMessage.Flow = flow;
            logMessage.Level = level;
            logMessage.Format = format;
            logMessage.Message = message;
            logMessage.Properties = properties;
            logMessage.UserID = "";
        }

        private void EnqueueLog(LogMessage logMessage, Action<string>? fallbackFunction, string logType)
        {
            if (ModuleConfiguration.IsLogServer)
            {
                var logRequest = new LogRequest
                {
                    LogMessage = logMessage,
                    FallbackFunction = fallbackFunction,
                    LogType = logType
                };

                if (!logQueue.TryAdd(logRequest, 0))
                {
                    logger.Warning($"[LogQueue] Queue full (size: {logQueue.Count}), dropping {logType} log for GlobalID: {logMessage.GlobalID}");
                    fallbackFunction?.Invoke("Log queue is full");
                    ReturnLogMessage(logMessage);
                }
            }
            else
            {
                LogLocally(logMessage, logType);
                ReturnLogMessage(logMessage);
            }
        }

        private void LogLocally(LogMessage logMessage, string logType)
        {
            var messageForLog = logMessage.Message;
            logMessage.Message = "";
            transactionLogger?.Information($"{logType} GlobalID: {logMessage.GlobalID}, {JsonConvert.SerializeObject(logMessage)}");
            if (!string.IsNullOrWhiteSpace(messageForLog))
            {
                transactionLogger?.Information($"[{{LogCategory}}] {messageForLog}", logMessage.Properties);
            }
        }

        private async Task ProcessLogQueueAsync(int workerId, CancellationToken cancellationToken)
        {
            var batch = new List<LogRequest>(BatchSize);

            try
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    batch.Clear();

                    var deadline = DateTime.UtcNow.AddMilliseconds(BatchDelayMs);

                    while (batch.Count < BatchSize && DateTime.UtcNow < deadline && !cancellationToken.IsCancellationRequested)
                    {
                        var remainingTime = (int)(deadline - DateTime.UtcNow).TotalMilliseconds;
                        if (remainingTime <= 0)
                            break;

                        if (logQueue.TryTake(out var logRequest, Math.Min(remainingTime, 100), cancellationToken))
                        {
                            batch.Add(logRequest);
                        }
                    }

                    if (batch.Count > 0)
                    {
                        await ProcessBatchAsync(batch, workerId, cancellationToken);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                logger.Information($"[Worker-{workerId}] Shutting down gracefully...");
            }
            catch (Exception ex)
            {
                logger.Error(ex, $"[Worker-{workerId}] Terminated unexpectedly");
            }
        }

        private async Task ProcessBatchAsync(List<LogRequest> batch, int workerId, CancellationToken cancellationToken)
        {
            var tasks = new List<Task>(batch.Count);

            foreach (var logRequest in batch)
            {
                tasks.Add(ProcessSingleLogAsync(logRequest, cancellationToken));
            }

            try
            {
                await Task.WhenAll(tasks);
            }
            catch (Exception ex)
            {
                logger.Error(ex, $"[Worker-{workerId}] Error processing batch of {batch.Count} logs");
            }
        }

        private async Task ProcessSingleLogAsync(LogRequest logRequest, CancellationToken cancellationToken)
        {
            try
            {
                var response = await SendAsync(Method.Post, ModuleConfiguration.LogServerUrl,
                    logRequest.LogMessage, logRequest.FallbackFunction, null, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    logRequest.FallbackFunction?.Invoke($"Failed to send log: {response.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                logger.Error(ex, $"[ProcessSingleLog] Error processing {logRequest.LogType} log: {logRequest.LogMessage?.GlobalID}");
                logRequest.FallbackFunction?.Invoke($"Exception: {ex.Message}");
            }
            finally
            {
                if (logRequest.LogMessage != null)
                {
                    ReturnLogMessage(logRequest.LogMessage);
                }
            }
        }

        public async Task ShutdownAsync(TimeSpan timeout)
        {
            logQueue.CompleteAdding();

            cancellationTokenSource.Cancel();

            var shutdownTask = Task.WhenAll(backgroundWorkers);
            var timeoutTask = Task.Delay(timeout);

            var completedTask = await Task.WhenAny(shutdownTask, timeoutTask);

            if (completedTask == shutdownTask)
            {
                logger.Information($"[Shutdown] All workers completed gracefully. Remaining queue: {logQueue.Count}");
            }
            else
            {
                logger.Warning($"[Shutdown] Timeout after {timeout.TotalSeconds}s. Remaining queue: {logQueue.Count}");
            }
        }

        public void Dispose()
        {
            try
            {
                ShutdownAsync(TimeSpan.FromSeconds(30)).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                logger.Error(ex, "[Dispose] Error during shutdown");
            }
            finally
            {
                cancellationTokenSource?.Dispose();
                logQueue?.Dispose();
                restClient?.Dispose();
            }
        }
    }

    internal class LogRequest
    {
        public LogMessage LogMessage { get; set; } = new LogMessage();
        public Action<string>? FallbackFunction { get; set; }
        public string LogType { get; set; } = string.Empty;
    }
}
