using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Net;
using System.Threading.Tasks;

using HandStack.Data.Client;
using HandStack.Data.Enumeration;
using HandStack.Web;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using Newtonsoft.Json;

using Polly;
using Polly.CircuitBreaker;

using RestSharp;

namespace transact.Extensions
{
    public class TransactLoggerClient
    {
        private readonly RestClient restClient = new RestClient();

        private Serilog.ILogger logger { get; }

        private Serilog.ILogger? transactionLogger { get; }

        public CircuitBreakerPolicy<RestResponse>? circuitBreakerPolicy = null;

        public DateTime? BreakDateTime = DateTime.Now;

        public TransactLoggerClient(Serilog.ILogger logger, Serilog.ILogger? transactionLogger = null)
        {
            this.logger = logger;
            this.transactionLogger = transactionLogger;

            circuitBreakerPolicy = Policy
                .HandleResult<RestResponse>(x =>
                {
                    return x.IsSuccessStatusCode == false;
                })
                .CircuitBreaker(1, TimeSpan.FromSeconds(ModuleConfiguration.CircuitBreakResetSecond),
                onBreak: (iRestResponse, timespan, context) =>
                {
                    logger.Error("[{LogCategory}] " + $"TransactLoggerClient CircuitBreaker Error Reason: {iRestResponse.Result.Content}", "CircuitBreaker/onBreak");
                },
                onReset: (context) =>
                {
                    logger.Information("[{LogCategory}] " + $"TransactLoggerClient CircuitBreaker Reset, DateTime={DateTime.Now}", "CircuitBreaker/onReset");
                });
        }

        public RestResponse? Send(Method httpVerb, string hostUrl, LogMessage logMessage, Action<string> fallbackFunction, Dictionary<string, string>? headers = null)
        {
            RestResponse? restResponse = new RestResponse
            {
                Content = "",
                ErrorMessage = "Equivalent to HTTP status 503",
                ResponseStatus = ResponseStatus.None,
                StatusCode = HttpStatusCode.ServiceUnavailable
            };

            try
            {
                if (string.IsNullOrEmpty(hostUrl) == true)
                {
                    fallbackFunction($"hostUrl 오류: {hostUrl}");
                    return restResponse;
                }

                var restRequest = new RestRequest(hostUrl, httpVerb);
                restRequest.AddHeader("cache-control", "no-cache");
                if (headers != null && headers.Count > 0)
                {
                    foreach (var header in headers)
                    {
                        restRequest.AddHeader(header.Key, header.Value);
                    }

                    if (headers.ContainsKey("Content-Type") == false)
                    {
                        restRequest.AddHeader("Content-Type", "application/json");
                    }
                }
                else
                {
                    restRequest.AddHeader("Content-Type", "application/json");
                }

                logMessage.CreatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");

                var json = JsonConvert.SerializeObject(logMessage);
                if (httpVerb != Method.Get)
                {
                    restRequest.AddStringBody(json, DataFormat.Json);
                }

                restResponse = this.RestResponseWithPolicy(restRequest, fallbackFunction);
            }
            catch (Exception ex)
            {
                restResponse = new RestResponse
                {
                    Content = ex.Message,
                    ErrorMessage = ex.Message,
                    ResponseStatus = ResponseStatus.TimedOut,
                    StatusCode = HttpStatusCode.ServiceUnavailable
                };
            }

            return restResponse;
        }

        private RestResponse? RestResponseWithPolicy(RestRequest restRequest, Action<string> fallbackFunction)
        {
            RestResponse? result = null;
            if (circuitBreakerPolicy != null && circuitBreakerPolicy.CircuitState == CircuitState.Closed)
            {
                result = circuitBreakerPolicy.Execute(() =>
                {
                    return restClient.Execute(restRequest);
                });

                if (result.IsSuccessStatusCode == false)
                {
                    BreakDateTime = DateTime.Now;
                }
            }
            else
            {
                if (circuitBreakerPolicy == null)
                {

                }
                else
                {
                    fallbackFunction($"CircuitBreaker Error Reason: {circuitBreakerPolicy.CircuitState.ToString()}");
                }
            }

            return result;
        }

        public void ProgramMessageLogging(string globalID, string acknowledge, string message, string properties, Action<string> fallbackFunction)
        {
            LogMessage logMessage = new LogMessage();
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
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

            LogRequest logRequest = new LogRequest();
            logRequest.LogMessage = logMessage;
            logRequest.FallbackFunction = fallbackFunction;

            Task.Run(() => { BackgroundTask(logRequest); });
        }

        public void TransactionMessageLogging(string globalID, string acknowledge, string applicationID, string projectID, string transactionID, string serviceID, string message, string properties, Action<string> fallbackFunction)
        {
            LogMessage logMessage = new LogMessage();
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
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

            if (ModuleConfiguration.IsLogServer == true)
            {
                LogRequest logRequest = new LogRequest();
                logRequest.LogMessage = logMessage;
                logRequest.FallbackFunction = fallbackFunction;

                Task.Run(() => { BackgroundTask(logRequest); });
            }
            else
            {
                transactionLogger?.Information($"Transaction GlobalID: {globalID}, {JsonConvert.SerializeObject(logMessage)}");
            }
        }

        public void TransactionRequestLogging(TransactionRequest request, string userWorkID, string acknowledge, Action<string> fallbackFunction)
        {
            LogMessage logMessage = new LogMessage();
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
            logMessage.GlobalID = request.Transaction.GlobalID;
            logMessage.Acknowledge = string.IsNullOrEmpty(acknowledge) == true ? "N" : acknowledge;
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

            if (ModuleConfiguration.IsLogServer == true)
            {
                LogRequest logRequest = new LogRequest();
                logRequest.LogMessage = logMessage;
                logRequest.FallbackFunction = fallbackFunction;

                Task.Run(() => { BackgroundTask(logRequest); });
            }
            else
            {
                transactionLogger?.Warning($"Request GlobalID: {request.Transaction.GlobalID}, JSON: {JsonConvert.SerializeObject(logMessage)}");
            }

            if (ModuleConfiguration.IsTransactAggregate == true && request.AcceptDateTime != null)
            {
                try
                {
                    string applicationID = request.System.ProgramID;
                    var connectionString = ModuleExtensions.GetLogDbConnectionString(userWorkID, applicationID);
                    if (string.IsNullOrEmpty(connectionString) == false)
                    {
                        DateTime acceptDateTime = (DateTime)request.AcceptDateTime;
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
                        logger.Error($"[{{LogCategory}}] 로그 집계 연결 문자열 확인 필요 applicationID: {applicationID}, transactionRequest: {JsonConvert.SerializeObject(request)}", "TransactLoggerClient/TransactionRequestLogging");
                    }
                }
                catch (Exception exception)
                {
                    logger.Error(exception, $"[{{LogCategory}}] 로그 집계 입력 오류 transactionRequest: {JsonConvert.SerializeObject(request)}", "TransactLoggerClient/TransactionRequestLogging");
                }
            }
        }

        public void TransactionResponseLogging(TransactionResponse response, string userWorkID, string acknowledge, Action<string> fallbackFunction)
        {
            LogMessage logMessage = new LogMessage();
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
            logMessage.GlobalID = response.Transaction.GlobalID;
            logMessage.Acknowledge = string.IsNullOrEmpty(acknowledge) == true ? "N" : acknowledge;
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

            if (ModuleConfiguration.IsLogServer == true)
            {
                LogRequest logRequest = new LogRequest();
                logRequest.LogMessage = logMessage;
                logRequest.FallbackFunction = fallbackFunction;

                Task.Run(() => { BackgroundTask(logRequest); });
            }
            else
            {
                transactionLogger?.Warning($"Response GlobalID: {response.Transaction.GlobalID}, JSON: {JsonConvert.SerializeObject(logMessage)}");
            }

            if (ModuleConfiguration.IsTransactAggregate == true && response.AcceptDateTime != null)
            {
                try
                {
                    string applicationID = response.System.ProgramID;
                    var connectionString = ModuleExtensions.GetLogDbConnectionString(userWorkID, applicationID);
                    if (string.IsNullOrEmpty(connectionString) == false)
                    {
                        DateTime acceptDateTime = (DateTime)response.AcceptDateTime;
                        string currentDateTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                        if (response.Acknowledge == AcknowledgeType.Success)
                        {
                            ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, connectionString, "TAG.TAG010.UD01", new
                            {
                                CreateDate = acceptDateTime.ToString("yyyyMMdd"),
                                CreateHour = acceptDateTime.ToString("HH"),
                                ProjectID = response.Transaction.BusinessID,
                                TransactionID = response.Transaction.TransactionID,
                                FeatureID = response.Transaction.FunctionID,
                                LatelyResponseAt = currentDateTime,
                                Acknowledge = ((int)response.Acknowledge).ToString()
                            });
                        }
                        else
                        {
                            ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, connectionString, "TAG.TAG010.UD02", new
                            {
                                CreateDate = acceptDateTime.ToString("yyyyMMdd"),
                                CreateHour = acceptDateTime.ToString("HH"),
                                ProjectID = response.Transaction.BusinessID,
                                TransactionID = response.Transaction.TransactionID,
                                FeatureID = response.Transaction.FunctionID,
                                LatelyResponseAt = currentDateTime,
                                Acknowledge = ((int)response.Acknowledge).ToString()
                            });

                            ModuleExtensions.ExecuteMetaSQL(ReturnType.NonQuery, connectionString, "TAG.TAG010.ID01", new
                            {
                                ProjectID = response.Transaction.BusinessID,
                                TransactionID = response.Transaction.TransactionID,
                                FeatureID = response.Transaction.FunctionID,
                                GlobalID = response.Transaction.GlobalID,
                                UserID = response.Transaction.OperatorID,
                                LogType = ModuleConfiguration.IsLogServer == true ? "S":"F",
                                CreatedAt = currentDateTime
                            });
                        }
                    }
                    else
                    {
                        logger.Error($"[{{LogCategory}}] 로그 집계 연결 문자열 확인 필요 applicationID: {applicationID}, transactionResponse: {JsonConvert.SerializeObject(response)}", "TransactLoggerClient/TransactionResponseLogging");
                    }
                }
                catch (Exception exception)
                {
                    logger.Error(exception, $"[{{LogCategory}}] 로그 집계 입력 오류 transactionResponse: {JsonConvert.SerializeObject(response)}", "TransactLoggerClient/TransactionResponseLogging");
                }
            }
        }

        public DataSet? ReadAggregate(string userWorkID, string applicationID, string rollingID, string SQL)
        {
            DataSet? result = null;
            try
            {
                if (ModuleConfiguration.IsTransactAggregate == true && string.IsNullOrEmpty(GlobalConfiguration.TenantAppBasePath) == false && Directory.Exists(Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID)) == true)
                {
                    string appBasePath = Path.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
                    string logDbFilePath = Path.Combine(appBasePath, ".managed", "sqlite", "transact", $"log-{rollingID}.db");
                    if (Directory.Exists(appBasePath) == true && File.Exists(logDbFilePath) == true)
                    {
                        string connectionString = $"URI=file:{logDbFilePath};Journal Mode=MEMORY;Cache Size=4000;Synchronous=Normal;Page Size=4096;Pooling=True;BinaryGUID=False;DateTimeFormat=Ticks;Version=3;";
                        // 주간별 SQLite 데이터베이스 파일 생성: {프로젝트 ID}_{년도}{주2자리}.db
                        using (SQLiteClient dbClient = new SQLiteClient(connectionString))
                        {
                            using (var dataSet = dbClient.ExecuteDataSet(SQL, CommandType.Text))
                            {
                                result = dataSet;
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                logger.Error(exception, $"[{{LogCategory}}] 로그 집계 쿼리 오류 applicationID: {applicationID}, rollingID: {rollingID}, SQL: {SQL}", "TransactLoggerClient/ReadAggregate");
            }

            return result;
        }

        private void BackgroundTask(object? state)
        {
            LogRequest? logRequest = state as LogRequest;

            if (circuitBreakerPolicy != null && logRequest != null)
            {
                try
                {
                    var circuitState = circuitBreakerPolicy.CircuitState;
                    if (circuitState == CircuitState.Closed)
                    {
                        Send(Method.Post, ModuleConfiguration.LogServerUrl, logRequest.LogMessage, (string error) =>
                        {
                            BreakDateTime = DateTime.Now;
                            circuitBreakerPolicy.Isolate();

                            logger.Error("BackgroundTask CircuitBreaker 오류: " + error);

                            if (logRequest.FallbackFunction != null)
                            {
                                logRequest.FallbackFunction(error);
                            }
                        });
                    }
                    else
                    {
                        if (BreakDateTime != null && BreakDateTime.Value.Ticks < DateTime.Now.AddSeconds(-ModuleConfiguration.CircuitBreakResetSecond).Ticks)
                        {
                            BreakDateTime = null;
                            circuitBreakerPolicy.Reset();
                        }

                        if (logRequest.FallbackFunction != null)
                        {
                            logRequest.FallbackFunction("CircuitBreaker CircuitState" + circuitState.ToString());
                        }
                    }
                }
                catch (Exception exception)
                {
                    try
                    {
                        logger.Error(exception, "BackgroundTask 오류: " + JsonConvert.SerializeObject(logRequest.LogMessage));

                        BreakDateTime = DateTime.Now;
                        circuitBreakerPolicy.Isolate();
                    }
                    catch
                    {
                    }
                }
            }
        }
    }
}
