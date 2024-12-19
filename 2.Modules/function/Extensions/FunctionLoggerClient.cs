using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

using function.Entity;

using HandStack.Web;
using HandStack.Web.MessageContract.Message;

using Newtonsoft.Json;

using Polly;
using Polly.CircuitBreaker;

using RestSharp;

namespace function.Extensions
{
    public class FunctionLoggerClient
    {
        private readonly RestClient restClient = new RestClient();

        private Serilog.ILogger logger { get; }

        private Serilog.ILogger? transactionLogger { get; }

        public CircuitBreakerPolicy<RestResponse>? circuitBreakerPolicy = null;

        public DateTime? BreakDateTime = DateTime.Now;

        public FunctionLoggerClient(Serilog.ILogger logger, Serilog.ILogger? transactionLogger = null)
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
                    logger.Error("[{LogCategory}] " + $"FunctionLoggerClient CircuitBreaker Error Reason: {iRestResponse.Result.Content}", "CircuitBreaker/onBreak");
                },
                onReset: (context) =>
                {
                    logger.Information("[{LogCategory}] " + $"FunctionLoggerClient CircuitBreaker Reset, DateTime={DateTime.Now}", "CircuitBreaker/onReset");
                });
        }

        public RestResponse Send(Method httpVerb, string hostUrl, LogMessage logMessage, Action<string> fallbackFunction, Dictionary<string, string>? headers = null)
        {
            RestResponse restResponse = new RestResponse
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

        private RestResponse RestResponseWithPolicy(RestRequest restRequest, Action<string> fallbackFunction)
        {
            RestResponse result = new RestResponse
            {
                Content = "",
                ErrorMessage = "Equivalent to HTTP status 503",
                ResponseStatus = ResponseStatus.None,
                StatusCode = HttpStatusCode.ServiceUnavailable
            };

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
                    fallbackFunction($"CircuitBreaker Error Reason: Unhandled Null");
                }
                else
                {
                    fallbackFunction($"CircuitBreaker Error Reason: {circuitBreakerPolicy.CircuitState.ToString()}");
                }
            }

            return result;
        }

        public void ProgramMessageLogging(string globalID, string acknowledge, string applicationID, string message, string properties, Action<string> fallbackFunction)
        {
            LogMessage logMessage = new LogMessage();
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
            logMessage.GlobalID = globalID;
            logMessage.Acknowledge = string.IsNullOrEmpty(acknowledge) == true ? "N" : acknowledge;
            logMessage.ApplicationID = string.IsNullOrEmpty(applicationID) == true ? GlobalConfiguration.ApplicationID : applicationID;
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

            if (ModuleConfiguration.IsLogServer == true)
            {
                LogRequest logRequest = new LogRequest();
                logRequest.LogMessage = logMessage;
                logRequest.FallbackFunction = fallbackFunction;

                Task.Run(() => { BackgroundTask(logRequest); });
            }
            else
            {
                logMessage.Message = "";
                transactionLogger?.Information($"Program GlobalID: {globalID}, {JsonConvert.SerializeObject(logMessage)}");
                transactionLogger?.Information("[{LogCategory}] " + message, properties);
            }
        }

        public void TransactionMessageLogging(string globalID, string acknowledge, string applicationID, string projectID, string transactionID, string serviceID, string message, string properties, Action<string> fallbackFunction)
        {
            LogMessage logMessage = new LogMessage();
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
            logMessage.GlobalID = globalID;
            logMessage.Acknowledge = string.IsNullOrEmpty(acknowledge) == true ? "N" : acknowledge;
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
                logMessage.Message = "";
                transactionLogger?.Information($"Transaction GlobalID: {globalID}, {JsonConvert.SerializeObject(logMessage)}");
                transactionLogger?.Information("[{LogCategory}] " + message, properties);
            }
        }

        public void DynamicResponseLogging(string globalID, string acknowledge, string applicationID, string message, string properties, Action<string> fallbackFunction)
        {
            LogMessage logMessage = new LogMessage();
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
            logMessage.GlobalID = globalID;
            logMessage.Acknowledge = string.IsNullOrEmpty(acknowledge) == true ? "N" : acknowledge;
            logMessage.ApplicationID = applicationID;
            logMessage.ProjectID = "";
            logMessage.TransactionID = "";
            logMessage.ServiceID = "";
            logMessage.Type = "T";
            logMessage.Flow = "O";
            logMessage.Level = "V";
            logMessage.Format = "J";
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
                transactionLogger?.Information($"Response GlobalID: {globalID}, {JsonConvert.SerializeObject(logMessage)}");
            }
        }

        public void DynamicRequestLogging(DynamicRequest request, string acknowledge, string applicationID, Action<string> fallbackFunction)
        {
            LogMessage logMessage = new LogMessage();
            logMessage.ServerID = GlobalConfiguration.HostName;
            logMessage.RunningEnvironment = GlobalConfiguration.RunningEnvironment;
            logMessage.ProgramName = ModuleConfiguration.ModuleID;
            logMessage.GlobalID = request.GlobalID;
            logMessage.Acknowledge = string.IsNullOrEmpty(acknowledge) == true ? "N" : acknowledge;
            logMessage.ApplicationID = applicationID;
            logMessage.ProjectID = "";
            logMessage.TransactionID = "";
            logMessage.ServiceID = "";
            logMessage.Type = "T";
            logMessage.Flow = "I";
            logMessage.Level = "V";
            logMessage.Format = "J";
            logMessage.Message = JsonConvert.SerializeObject(request);
            logMessage.Properties = "";
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
                logger.Warning($"Request GlobalID: {request.GlobalID}, {JsonConvert.SerializeObject(logMessage)}");
            }
        }

        private void BackgroundTask(object? state)
        {
            if (state != null)
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
                                Console.WriteLine(error);

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
                        catch (Exception innerException)
                        {
                            logger.Error(innerException, $"BackgroundTask Inner Exception, BreakDateTime: {BreakDateTime}");
                        }
                    }
                }
            }
        }
    }
}
