using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Data.Client;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Newtonsoft.Json;

using Polly;
using Polly.CircuitBreaker;

using RestSharp;

using transact.Entity;

namespace transact.Extensions
{
    public class TransactLoggerClient : IDisposable
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

        // ObjectPool 구현
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

        public TransactLoggerClient(Serilog.ILogger logger, Serilog.ILogger? transactionLogger = null)
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
            circuitBreakerPolicy = Policy
                .HandleResult<RestResponse>(x => x.IsSuccessStatusCode == false)
                .CircuitBreaker(
                    handledEventsAllowedBeforeBreaking: 3,
                    durationOfBreak: TimeSpan.FromSeconds(ModuleConfiguration.CircuitBreakResetSecond),
                    onBreak: (result, timespan) =>
                    {
                        breakDateTime = DateTime.Now;
                        logger.Error($"[CircuitBreaker/onBreak] TransactLoggerClient Circuit opened for {timespan.TotalSeconds}s. Reason: {result.Result?.Content}");
                    },
                    onReset: () =>
                    {
                        breakDateTime = null;
                        logger.Information($"[CircuitBreaker/onReset] TransactLoggerClient Circuit reset at {DateTime.Now}");
                    },
                    onHalfOpen: () =>
                    {
                        logger.Information("[CircuitBreaker/onHalfOpen] TransactLoggerClient Circuit is half-open, testing...");
                    });

            // 백그라운드 워커 시작
            cancellationTokenSource = new CancellationTokenSource();
            backgroundWorkers = new Task[WorkerCount];
            for (int i = 0; i < WorkerCount; i++)
            {
                int workerId = i;
                backgroundWorkers[i] = Task.Run(() => ProcessLogQueueAsync(workerId, cancellationTokenSource.Token));
            }

            logger.Information($"[TransactLoggerClient] Initialized with {WorkerCount} workers, queue capacity: {MaxQueueSize}");
        }

        #region ObjectPool Methods

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
        }

        #endregion

        #region HTTP Send Methods

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
                                fallbackFunction?.Invoke("Circuit is open");
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

        #endregion

        #region Public Logging Methods

        public void ProgramMessageLogging(string globalID, string acknowledge, string message, string properties, Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            logMessage.GlobalID = globalID;
            logMessage.Acknowledge = acknowledge;
            logMessage.ApplicationID = GlobalConfiguration.ApplicationID;
            logMessage.ProjectID = "";
            logMessage.TransactionID = "";
            logMessage.ServiceID = "";
            logMessage.Type = "A";
            logMessage.Flow = "N";
            logMessage.Level = "V";
            logMessage.Format = "P";
            logMessage.Message = message;
            logMessage.Properties = properties;
            logMessage.UserID = "";

            EnqueueLog(logMessage, fallbackFunction, "Program", null, null);
        }

        public void TransactionMessageLogging(string globalID, string acknowledge, string applicationID, string projectID,
            string transactionID, string serviceID, string message, string properties, Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            logMessage.GlobalID = globalID;
            logMessage.Acknowledge = acknowledge;
            logMessage.ApplicationID = applicationID;
            logMessage.ProjectID = projectID;
            logMessage.TransactionID = transactionID;
            logMessage.ServiceID = serviceID;
            logMessage.Type = "A";
            logMessage.Flow = "N";
            logMessage.Level = "V";
            logMessage.Format = "P";
            logMessage.Message = message;
            logMessage.Properties = properties;
            logMessage.UserID = "";

            EnqueueLog(logMessage, fallbackFunction, "Transaction", null, null);
        }

        public void TransactionRequestLogging(TransactionRequest request, string userWorkID, string acknowledge, Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            logMessage.GlobalID = request.Transaction.GlobalID;
            logMessage.Acknowledge = string.IsNullOrEmpty(acknowledge) ? "N" : acknowledge;
            logMessage.ApplicationID = request.System.ProgramID;
            logMessage.ProjectID = request.Transaction.BusinessID;
            logMessage.TransactionID = request.Transaction.TransactionID;
            logMessage.ServiceID = request.Transaction.FunctionID;
            logMessage.Type = "T";
            logMessage.Flow = "I";
            logMessage.Level = "V";
            logMessage.Format = request.Transaction.DataFormat;
            logMessage.Message = JsonConvert.SerializeObject(request);
            logMessage.Properties = JsonConvert.SerializeObject(request.PayLoad.Property);
            logMessage.UserID = request.Transaction.OperatorID;

            EnqueueLog(logMessage, fallbackFunction, "Request", request, null, userWorkID);
        }

        public void TransactionResponseLogging(TransactionResponse response, string userWorkID, string acknowledge, Action<string>? fallbackFunction = null)
        {
            var logMessage = GetLogMessage();
            logMessage.GlobalID = response.Transaction.GlobalID;
            logMessage.Acknowledge = string.IsNullOrEmpty(acknowledge) ? "N" : acknowledge;
            logMessage.ApplicationID = response.System.ProgramID;
            logMessage.ProjectID = response.Transaction.BusinessID;
            logMessage.TransactionID = response.Transaction.TransactionID;
            logMessage.ServiceID = response.Transaction.FunctionID;
            logMessage.Type = "T";
            logMessage.Flow = "O";
            logMessage.Level = "V";
            logMessage.Format = "J";
            logMessage.Message = JsonConvert.SerializeObject(response);
            logMessage.Properties = JsonConvert.SerializeObject(response.Result.Property);
            logMessage.UserID = response.Transaction.OperatorID;

            EnqueueLog(logMessage, fallbackFunction, "Response", null, response, userWorkID);
        }

        #endregion

        #region Enqueue & Local Logging

        private void EnqueueLog(LogMessage logMessage, Action<string>? fallbackFunction, string logType,
            TransactionRequest? request = null, TransactionResponse? response = null, string? userWorkID = null)
        {
            if (ModuleConfiguration.IsLogServer)
            {
                var logRequest = new LogRequest
                {
                    LogMessage = logMessage,
                    FallbackFunction = fallbackFunction,
                    LogType = logType,
                    Request = request,
                    Response = response,
                    UserWorkID = userWorkID
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

            // Aggregate 처리 (비동기)
            if (request != null)
            {
                ProcessRequestAggregate(request, userWorkID.ToStringSafe());
            }
            else if (response != null)
            {
                ProcessResponseAggregate(response, userWorkID.ToStringSafe());
            }
        }

        private void LogLocally(LogMessage logMessage, string logType)
        {
            var messageForLog = logMessage.Message;
            logMessage.Message = "";

            switch (logType)
            {
                case "Request":
                case "Response":
                    transactionLogger?.Warning($"{logType} GlobalID: {logMessage.GlobalID}, JSON: {JsonConvert.SerializeObject(logMessage)}");
                    break;
                default:
                    transactionLogger?.Information($"{logType} GlobalID: {logMessage.GlobalID}, {JsonConvert.SerializeObject(logMessage)}");
                    if (!string.IsNullOrEmpty(messageForLog))
                    {
                        transactionLogger?.Information($"[{{LogCategory}}] {messageForLog}", logMessage.Properties);
                    }
                    break;
            }
        }

        #endregion

        #region Aggregate Processing

        private void ProcessRequestAggregate(TransactionRequest request, string userWorkID)
        {
            if (ModuleConfiguration.IsTransactAggregate && request.AcceptDateTime != null)
            {
                Task.Run(() =>
                {
                    try
                    {
                        var applicationID = request.System.ProgramID;
                        var connectionString = ModuleExtensions.GetLogDbConnectionString(userWorkID, applicationID);
                        if (!string.IsNullOrEmpty(connectionString))
                        {
                            var acceptDateTime = (DateTime)request.AcceptDateTime;
                            ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, connectionString, "TAG.TAG010.MD01", new
                            {
                                CreateDate = acceptDateTime.ToString("yyyyMMdd"),
                                CreateHour = acceptDateTime.ToString("HH"),
                                ProjectID = request.Transaction.BusinessID,
                                TransactionID = request.Transaction.TransactionID,
                                FeatureID = request.Transaction.FunctionID,
                                LatelyRequestAt = acceptDateTime.ToString("yyyy-MM-dd HH:mm:ss"),
                                LatelyResponseAt = "",
                                Acknowledge = "0",
                            });
                        }
                        else
                        {
                            logger.Error($"[{{LogCategory}}] 로그 집계 연결 문자열 확인 필요 applicationID: {applicationID}", "TransactLoggerClient/ProcessRequestAggregate");
                        }
                    }
                    catch (Exception exception)
                    {
                        logger.Error(exception, "[{LogCategory}] 로그 집계 입력 오류", "TransactLoggerClient/ProcessRequestAggregate");
                    }
                });
            }
        }

        private void ProcessResponseAggregate(TransactionResponse response, string userWorkID)
        {
            if (ModuleConfiguration.IsTransactAggregate && response.AcceptDateTime != null)
            {
                Task.Run(() =>
                {
                    try
                    {
                        var applicationID = response.System.ProgramID;
                        var connectionString = ModuleExtensions.GetLogDbConnectionString(userWorkID, applicationID);
                        if (!string.IsNullOrEmpty(connectionString))
                        {
                            var acceptDateTime = (DateTime)response.AcceptDateTime;
                            var currentDateTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                            var sqlID = response.Acknowledge == AcknowledgeType.Success ? "TAG.TAG010.UD01" : "TAG.TAG010.UD02";

                            ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, connectionString, sqlID, new
                            {
                                CreateDate = acceptDateTime.ToString("yyyyMMdd"),
                                CreateHour = acceptDateTime.ToString("HH"),
                                ProjectID = response.Transaction.BusinessID,
                                TransactionID = response.Transaction.TransactionID,
                                FeatureID = response.Transaction.FunctionID,
                                LatelyResponseAt = currentDateTime,
                                Acknowledge = ((int)response.Acknowledge).ToString()
                            });

                            if (response.Acknowledge != AcknowledgeType.Success)
                            {
                                ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, connectionString, "TAG.TAG010.ID01", new
                                {
                                    ProjectID = response.Transaction.BusinessID,
                                    TransactionID = response.Transaction.TransactionID,
                                    FeatureID = response.Transaction.FunctionID,
                                    GlobalID = response.Transaction.GlobalID,
                                    UserID = response.Transaction.OperatorID,
                                    LogType = ModuleConfiguration.IsLogServer ? "S" : "F",
                                    CreatedAt = currentDateTime
                                });
                            }
                        }
                        else
                        {
                            logger.Error($"[{{LogCategory}}] 로그 집계 연결 문자열 확인 필요 applicationID: {applicationID}", "TransactLoggerClient/ProcessResponseAggregate");
                        }
                    }
                    catch (Exception exception)
                    {
                        logger.Error(exception, "[{LogCategory}] 로그 집계 입력 오류", "TransactLoggerClient/ProcessResponseAggregate");
                    }
                });
            }
        }

        public DataSet? ReadAggregate(string userWorkID, string applicationID, string rollingID, string SQL)
        {
            DataSet? result = null;
            try
            {
                if (ModuleConfiguration.IsTransactAggregate && Directory.Exists(PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID)))
                {
                    var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    var logDbFilePath = PathExtensions.Combine(appBasePath, ".managed", "sqlite", "transact", $"log-{rollingID}.db");
                    if (Directory.Exists(appBasePath) && File.Exists(logDbFilePath))
                    {
                        var connectionString = $"URI=file:{logDbFilePath};Journal Mode=Off;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;";
                        using var dbClient = new SQLiteClient(connectionString);
                        using var dataSet = dbClient.ExecuteDataSet(SQL, CommandType.Text);
                        result = dataSet;
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, $"[{{LogCategory}}] 로그 집계 쿼리 오류 applicationID: {applicationID}, rollingID: {rollingID}", "TransactLoggerClient/ReadAggregate");
            }

            return result;
        }

        #endregion

        #region Background Processing

        private async Task ProcessLogQueueAsync(int workerId, CancellationToken cancellationToken)
        {
            logger.Information($"[Worker-{workerId}] Started");
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

            logger.Information($"[Worker-{workerId}] Stopped");
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

        #endregion

        #region Shutdown & Disposal

        public async Task ShutdownAsync(TimeSpan timeout)
        {
            logger.Information($"[Shutdown] Initiating graceful shutdown... (Queue size: {logQueue.Count})");

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

        #endregion
    }

    internal class LogRequest
    {
        public LogMessage LogMessage { get; set; } = new LogMessage();
        public Action<string>? FallbackFunction { get; set; }
        public string LogType { get; set; } = string.Empty;
        public TransactionRequest? Request { get; set; }
        public TransactionResponse? Response { get; set; }
        public string? UserWorkID { get; set; }
    }
}
