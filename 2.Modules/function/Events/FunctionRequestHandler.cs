using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using function.Encapsulation;
using function.Extensions;

using HandStack.Web.Extensions;
using HandStack.Web;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Newtonsoft.Json;
using function.Entity;

namespace function.Events
{
    /*
    DynamicRequest dynamicRequest = new DynamicRequest();
    Type? type = Assembly.Load("function")?.GetType("function.Events.FunctionRequest");
    if (type != null)
    {
        object? instance = Activator.CreateInstance(type, dynamicRequest);
        if (instance != null)
        {
            object? eventResponse = await mediator.Send(instance);
            if (eventResponse != null)
            {
                response = JsonConvert.DeserializeObject<DynamicResponse>(JsonConvert.SerializeObject(eventResponse));
            }
            else
            {
                response = new DynamicResponse();
                response.ExceptionText = $"moduleEventName: function.Events.FunctionRequest 확인 필요";
            }
        }
    }
    */
    public class FunctionRequest : IRequest<object?>
    {
        public object? Request { get; set; }

        public FunctionRequest(object? request)
        {
            Request = request;
        }
    }

    public class FunctionRequestHandler : IRequestHandler<FunctionRequest, object?>
    {
        private FunctionLoggerClient loggerClient { get; }
        
        private Serilog.ILogger logger { get; }
        private IFunctionClient functionClient { get; }

        public FunctionRequestHandler(Serilog.ILogger logger, IFunctionClient nodeFunctionClient, FunctionLoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
            this.functionClient = nodeFunctionClient;
        }

        public async Task<object?> Handle(FunctionRequest requestQueryData, CancellationToken cancellationToken)
        {
            DynamicRequest? request = requestQueryData.Request as DynamicRequest;
            DynamicResponse? response = new DynamicResponse();
            response.Acknowledge = AcknowledgeType.Failure;

            if (request == null)
            {
                response.ExceptionText = "빈 요청. 요청 정보 확인 필요";
                return response;
            }

            response.CorrelationID = request.GlobalID;
            if (string.IsNullOrEmpty(request.RequestID) == true)
            {
                request.RequestID = $"SELF_{GlobalConfiguration.SystemID}{GlobalConfiguration.HostName}{GlobalConfiguration.RunningEnvironment}{DateTime.Now.ToString("yyyyMMddHHmmssfff")}";
            }

            if (string.IsNullOrEmpty(request.GlobalID) == true)
            {
                request.GlobalID = request.RequestID;
            }

            try
            {
                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicRequestLogging(request, "Y", GlobalConfiguration.ApplicationID, (string error) =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {JsonConvert.SerializeObject(request)}", "Query/Execute", request.GlobalID);
                    });
                }

                if (request.LoadOptions != null)
                {
                    Dictionary<string, string> loadOptions = request.LoadOptions;
                    if (loadOptions.Count > 0)
                    {
                    }
                }

                switch (request.ReturnType)
                {
                    case ExecuteDynamicTypeObject.Json:
                    case ExecuteDynamicTypeObject.DynamicJson:
                        await functionClient.ExecuteScriptMap(request, response);
                        break;
                    case ExecuteDynamicTypeObject.Scalar:
                    case ExecuteDynamicTypeObject.NonQuery:
                    case ExecuteDynamicTypeObject.SQLText:
                    case ExecuteDynamicTypeObject.SchemeOnly:
                    case ExecuteDynamicTypeObject.CodeHelp:
                    case ExecuteDynamicTypeObject.Xml:
                        response.ExceptionText = "지원하지 않는 결과 타입. 요청 정보 확인 필요";
                        break;
                }

                if (string.IsNullOrEmpty(response.ExceptionText) == false)
                {
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Query/Execute", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "Query/Execute");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "Query/Execute", request.GlobalID);
                    }
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();
                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Query/QueryDataClient Execute", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "Query/QueryDataClient Execute");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "Query/QueryDataClient Execute", request.GlobalID);
                }
            }

            try
            {
                string acknowledge = response.Acknowledge == AcknowledgeType.Success ? "Y" : "N";
                if (request.ReturnType == ExecuteDynamicTypeObject.Xml)
                {
                    var responseData = response.ResultObject as string;
                    if (string.IsNullOrEmpty(responseData) == true)
                    {
                        responseData = "<?xml version=\"1.0\" standalone=\"yes\"?><NewDataSet></NewDataSet>";
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        loggerClient.DynamicResponseLogging(request.GlobalID, acknowledge, GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                        {
                            logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                        });
                    }
                }
                else
                {
                    string responseData = JsonConvert.SerializeObject(response);
                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        loggerClient.DynamicResponseLogging(request.GlobalID, acknowledge, GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                        {
                            logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                        });
                    }
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToMessage();
                if (ModuleConfiguration.IsLogServer == true)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Query/DynamicResponse Execute", (string error) =>
                    {
                        logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + response.ExceptionText, "Query/DynamicResponse Execute");
                    });
                }
                else
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "Query/DynamicResponse Execute", request.GlobalID);
                }

                try
                {
                    if (request.ReturnType == ExecuteDynamicTypeObject.Json)
                    {
                        string responseData = JsonConvert.SerializeObject(response);

                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            loggerClient.DynamicResponseLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                            {
                                logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                            });
                        }
                    }
                    else if (request.ReturnType == ExecuteDynamicTypeObject.Xml)
                    {
                        var responseData = response.ExceptionText;

                        if (ModuleConfiguration.IsTransactionLogging == true)
                        {
                            loggerClient.DynamicResponseLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                            {
                                logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                            });
                        }
                    }
                }
                catch (Exception fatalException)
                {
                    var responseData = fatalException.ToMessage();
                    if (ModuleConfiguration.IsLogServer == true)
                    {
                        loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Query/QueryDataClient Execute", (string error) =>
                        {
                            logger.Error("[{LogCategory}] " + "fallback error: " + error + ", " + responseData, "Query/QueryDataClient Execute");
                        });
                    }
                    else
                    {
                        logger.Error("[{LogCategory}] [{GlobalID}] " + responseData, "Query/QueryDataClient Execute", request.GlobalID);
                    }

                    if (ModuleConfiguration.IsTransactionLogging == true)
                    {
                        loggerClient.DynamicResponseLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                        {
                            logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {responseData}", "Query/Execute", response.CorrelationID);
                        });
                    }

                    response.ExceptionText = responseData;
                }
            }

            return response;
        }
    }
}
