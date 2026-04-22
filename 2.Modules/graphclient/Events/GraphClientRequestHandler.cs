using System;
using System.Threading;
using System.Threading.Tasks;

using graphclient.Encapsulation;
using graphclient.Entity;
using graphclient.Extensions;

using HandStack.Web;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Newtonsoft.Json;

namespace graphclient.Events
{
    public class GraphClientRequest : IRequest<object?>
    {
        public GraphClientRequest(object? request)
        {
            Request = request;
        }

        public object? Request { get; }
    }

    public class GraphClientRequestHandler : IRequestHandler<GraphClientRequest, object?>
    {
        private readonly GraphClientLoggerClient loggerClient;
        private readonly Serilog.ILogger logger;
        private readonly IGraphDataClient dataClient;

        public GraphClientRequestHandler(Serilog.ILogger logger, IGraphDataClient dataClient, GraphClientLoggerClient loggerClient)
        {
            this.logger = logger;
            this.dataClient = dataClient;
            this.loggerClient = loggerClient;
        }

        public async Task<object?> Handle(GraphClientRequest requestQueryData, CancellationToken cancellationToken)
        {
            var request = requestQueryData.Request as DynamicRequest;
            var response = new DynamicResponse()
            {
                Acknowledge = AcknowledgeType.Failure
            };

            if (request == null)
            {
                response.ExceptionText = "빈 요청. 요청 정보 확인 필요";
                return response;
            }

            response.CorrelationID = request.GlobalID;
            if (string.IsNullOrWhiteSpace(request.RequestID))
            {
                request.RequestID = $"SELF_{GlobalConfiguration.SystemID}{GlobalConfiguration.HostName}{GlobalConfiguration.RunningEnvironment}{DateTime.Now:yyyyMMddHHmmssfff}";
            }

            if (string.IsNullOrWhiteSpace(request.GlobalID))
            {
                request.GlobalID = request.RequestID;
            }

            try
            {
                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicRequestLogging(request, "Y", GlobalConfiguration.ApplicationID, error =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Request JSON: {JsonConvert.SerializeObject(request)}", "GraphClientRequest/Handle", request.GlobalID);
                    });
                }

                await ExecuteAsync(request, response);

                if (string.IsNullOrWhiteSpace(response.ExceptionText) == false)
                {
                    logger.Error("[{LogCategory}] [{GlobalID}] " + response.ExceptionText, "GraphClientRequest/Handle", request.GlobalID);
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = exception.ToString();
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] graphclient 요청 처리 오류", "GraphClientRequest/Handle", request.GlobalID);
            }

            if (ModuleConfiguration.IsTransactionLogging == true)
            {
                var acknowledge = response.Acknowledge == AcknowledgeType.Success ? "Y" : "N";
                loggerClient.DynamicResponseLogging(
                    request.GlobalID,
                    acknowledge,
                    GlobalConfiguration.ApplicationID,
                    JsonConvert.SerializeObject(response),
                    $"GraphClientRequest/Handle ReturnType: {request.ReturnType}",
                    error => logger.Warning("[{LogCategory}] [{GlobalID}] " + $"Response JSON: {JsonConvert.SerializeObject(response)}", "GraphClientRequest/Handle", response.CorrelationID));
            }

            return response;
        }

        private Task ExecuteAsync(DynamicRequest request, DynamicResponse response)
        {
            return request.ReturnType switch
            {
                ExecuteDynamicTypeObject.Json => dataClient.ExecuteJsonAsync(request, response),
                ExecuteDynamicTypeObject.Scalar => dataClient.ExecuteScalarAsync(request, response),
                ExecuteDynamicTypeObject.NonQuery => dataClient.ExecuteNonQueryAsync(request, response),
                ExecuteDynamicTypeObject.SchemeOnly => dataClient.ExecuteSchemeOnlyAsync(request, response),
                ExecuteDynamicTypeObject.CodeHelp => dataClient.ExecuteCodeHelpAsync(request, response),
                ExecuteDynamicTypeObject.SQLText => dataClient.ExecuteSqlTextAsync(request, response),
                ExecuteDynamicTypeObject.Xml => dataClient.ExecuteXmlAsync(request, response),
                _ => Task.Run(() => response.ExceptionText = "지원하지 않는 결과 타입. 요청 정보 확인 필요")
            };
        }
    }
}

