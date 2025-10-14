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

        // 비동기 큐 처리
        private readonly BlockingCollection<LogRequest> logQueue;
        private readonly CancellationTokenSource cancellationTokenSource;
        private readonly Task[] backgroundWorkers;

        // Circuit Breaker 정책
        private CircuitBreakerPolicy<RestResponse> circuitBreakerPolicy;
        private readonly object circuitBreakerLock = new object();
        private DateTime? breakDateTime;

        // ObjectPool 구현 (간단한 버전)
        private readonly ConcurrentBag<LogMessage> logMessagePool;
        private const int MaxPoolSize = 1000;

        // 배치 처리 설정
        private const int BatchSize = 100;
        private const int BatchDelayMs = 1000;
        private const int MaxQueueSize = 10000;
        private const int WorkerCount = 3;

        // 재시도 설정
        private const int MaxRetryCount = 2;
        private const int RetryDelayMs = 100;

        public CircuitState CircuitState => circuitBreakerPolicy?.CircuitState ?? CircuitState.Closed;
        public DateTime? BreakDateTime => breakDateTime;

        public DbClientLoggerClient(Serilog.ILogger logger, Serilog.ILogger? transactionLogger = null)
        {
            this.logger = logger;
            this.transactionLogger = transactionLogger;

            // RestClient 설정
            restClient = new RestClient();

            // 큐 초기화
            logQueue = new BlockingCollection<LogRequest>(MaxQueueSize);

            // ObjectPool 초기화
            logMessagePool = new ConcurrentBag<LogMessage>();

            // Circuit Breaker 정책
            InitializeCircuitBreaker();

            // 백그라운드 워커 시작
            cancellationTokenSource = new CancellationTokenSource();
            backgroundWorkers = new Task[WorkerCount];
            for (int i = 0; i < WorkerCount; i++)
            {
                int workerId = i;
                backgroundWorkers[i] = Task.Run(() => ProcessLogQueueAsync(workerId, cancellationTokenSource.Token));
            }
        }

        private void InitializeCircuitBreaker()
        {
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
        }

        /// <summary>
        /// ObjectPool에서 LogMessage 가져오기
        /// </summary>
        private LogMessage GetLogMessage()
        {
            if (logMessagePool.TryTake(out var logMessage))
            {
                ResetLogMessage(logMessage);
                return logMessage;
            }
            return new LogMessage();
        }

        /// <summary>
        /// ObjectPool에 LogMessage 반환
        /// </summary>
        private void ReturnLogMessage(LogMessage logMessage)
        {
            if (logMessage != null && logMessagePool.Count < MaxPoolSize)
            {
                ResetLogMessage(logMessage);
                logMessagePool.Add(logMessage);
            }
        }

        /// <summary>
        /// LogMessage 초기화
        /// </summary>
        private void ResetLogMessage(LogMessage logMessage)
        {
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
            logMessage.GlobalID = null;
            logMessage.Acknowledge = null;
            logMessage.ApplicationID = null;
            logMessage.ProjectID = null;
            logMessage.TransactionID = null;
            logMessage.ServiceID = null;
            logMessage.Type = null;
            logMessage.Flow = null;
            logMessage.Level = null;
            logMessage.Format = null;
            logMessage.Message = null;
            logMessage.Properties = null;
            logMessage.UserID = null;
            logMessage.CreatedAt = null;
        }

        /// <summary>
        /// 비동기 전송 (재시도 로직 포함)
        /// </summary>
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
                if (string.IsNullOrEmpty(hostUrl))
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

        /// <summary>
        /// RestRequest 생성
        /// </summary>
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

        /// <summary>
        /// 재시도 + Circuit Breaker 실행
        /// </summary>
        private async Task<RestResponse> ExecuteWithRetryAndCircuitBreakerAsync(RestRequest restRequest,
            Action<string>? fallbackFunction, CancellationToken cancellationToken)
        {
            RestResponse response = null;
            int retryCount = 0;

            while (retryCount <= MaxRetryCount)
            {
                try
                {
                    // Circuit Breaker 상태 확인
                    lock (circuitBreakerLock)
                    {
                        if (circuitBreakerPolicy.CircuitState == CircuitState.Open)
                        {
                            // Half-Open 시도를 위한 시간 체크
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

                    // Circuit Breaker로 실행
                    response = circuitBreakerPolicy.Execute(() =>
                    {
                        return restClient.ExecuteAsync(restRequest, cancellationToken).GetAwaiter().GetResult();
                    });

                    if (response.IsSuccessStatusCode)
                    {
                        return response;
                    }

                    // 재시도 가능한 오류인 경우
                    if (retryCount < MaxRetryCount && IsRetryableError(response))
                    {
                        retryCount++;
                        var delay = RetryDelayMs * retryCount;
                        logger.Warning($"[Retry] Attempt {retryCount}/{MaxRetryCount}, waiting {delay}ms. Status: {response.StatusCode}");
                        await Task.Delay(delay, cancellationToken);
                        continue;
                    }

                    // 재시도 불가능하거나 최대 재시도 횟수 도달
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

        /// <summary>
        /// 재시도 가능한 오류인지 확인
        /// </summary>
        private bool IsRetryableError(RestResponse response)
        {
            return response.StatusCode == HttpStatusCode.RequestTimeout ||
                   response.StatusCode == HttpStatusCode.ServiceUnavailable ||
                   response.StatusCode == HttpStatusCode.GatewayTimeout ||
                   response.StatusCode == (HttpStatusCode)429; // Too Many Requests
        }

        /// <summary>
        /// Program 로그
        /// </summary>
        public void ProgramMessageLogging(string globalID, string acknowledge, string applicationID,
            string message, string properties, Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            ConfigureLogMessage(logMessage, globalID, acknowledge, applicationID, "", "", "",
                "A", "N", "V", "P", message, properties);

            EnqueueLog(logMessage, fallbackFunction, "Program");
        }

        /// <summary>
        /// Transaction 로그
        /// </summary>
        public void TransactionMessageLogging(string globalID, string acknowledge, string applicationID,
            string projectID, string transactionID, string serviceID, string message, string properties,
            Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            ConfigureLogMessage(logMessage, globalID, acknowledge, applicationID, projectID,
                transactionID, serviceID, "A", "N", "V", "P", message, properties);

            EnqueueLog(logMessage, fallbackFunction, "Transaction");
        }

        /// <summary>
        /// Dynamic Response 로그
        /// </summary>
        public void DynamicResponseLogging(string globalID, string acknowledge, string applicationID,
            string message, string properties, Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            ConfigureLogMessage(logMessage, globalID, acknowledge, applicationID, "", "", "",
                "T", "O", "V", "J", message, properties);

            EnqueueLog(logMessage, fallbackFunction, "Response");
        }

        /// <summary>
        /// Dynamic Request 로그
        /// </summary>
        public void DynamicRequestLogging(DynamicRequest request, string acknowledge, string applicationID,
            Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            var message = JsonConvert.SerializeObject(request);
            ConfigureLogMessage(logMessage, request.GlobalID, acknowledge, applicationID, "", "", "",
                "T", "I", "V", "J", message, "");

            EnqueueLog(logMessage, fallbackFunction, "Request");
        }

        /// <summary>
        /// LogMessage 설정
        /// </summary>
        private void ConfigureLogMessage(LogMessage logMessage, string globalID, string acknowledge,
            string applicationID, string projectID, string transactionID, string serviceID,
            string type, string flow, string level, string format, string message, string properties)
        {
            logMessage.GlobalID = globalID;
            logMessage.Acknowledge = string.IsNullOrEmpty(acknowledge) ? "N" : acknowledge;
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

        /// <summary>
        /// 로그를 큐에 추가 (논블로킹)
        /// </summary>
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

                // TryAdd로 논블로킹 처리 (큐가 가득 차면 즉시 반환)
                if (!logQueue.TryAdd(logRequest, 0))
                {
                    logger.Warning($"[LogQueue] Queue full (size: {logQueue.Count}), dropping {logType} log for GlobalID: {logMessage.GlobalID}");
                    fallbackFunction?.Invoke("Log queue is full");
                    ReturnLogMessage(logMessage);
                }
            }
            else
            {
                // 로컬 로깅
                LogLocally(logMessage, logType);
                ReturnLogMessage(logMessage);
            }
        }

        /// <summary>
        /// 로컬 로깅
        /// </summary>
        private void LogLocally(LogMessage logMessage, string logType)
        {
            var messageForLog = logMessage.Message;
            logMessage.Message = "";
            transactionLogger?.Information($"{logType} GlobalID: {logMessage.GlobalID}, {JsonConvert.SerializeObject(logMessage)}");
            if (!string.IsNullOrEmpty(messageForLog))
            {
                transactionLogger?.Information($"[{{LogCategory}}] {messageForLog}", logMessage.Properties);
            }
        }

        /// <summary>
        /// 백그라운드 로그 처리 워커 (배치 처리)
        /// </summary>
        private async Task ProcessLogQueueAsync(int workerId, CancellationToken cancellationToken)
        {
            logger.Information($"[Worker-{workerId}] Started");
            var batch = new List<LogRequest>(BatchSize);

            try
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    batch.Clear();

                    // 배치 수집
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

                    // 배치 처리
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

            logger.Information($"[Worker-{workerId}] Stopped");
        }

        /// <summary>
        /// 배치 로그 전송 (병렬 처리)
        /// </summary>
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

        /// <summary>
        /// 단일 로그 처리
        /// </summary>
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

        /// <summary>
        /// Graceful shutdown
        /// </summary>
        public async Task ShutdownAsync(TimeSpan timeout)
        {
            logger.Information($"[Shutdown] Initiating graceful shutdown... (Queue size: {logQueue.Count})");

            // 새 로그 수신 중단
            logQueue.CompleteAdding();

            // 워커들이 종료될 때까지 대기
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

    /// <summary>
    /// LogRequest (내부용)
    /// </summary>
    internal class LogRequest
    {
        public LogMessage LogMessage { get; set; }
        public Action<string>? FallbackFunction { get; set; }
        public string LogType { get; set; }
    }
}
