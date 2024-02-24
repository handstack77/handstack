using System;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.Extensions;
using HandStack.Web.MessageContract.Message;

using logger.Encapsulation;

using MediatR;

using Newtonsoft.Json;

using Serilog;

namespace logger.Events
{
    /*
    MediatorRequest mediatorRequest = new MediatorRequest()
    {
        ActionModuleID = ModuleConfiguration.ModuleID,
        SubscribeEventID = "module.Events.PublishHtmlMail",
    };

    Dictionary<string, object> templateParameters = new Dictionary<string, object>();

    mediatorRequest.Parameters = new Dictionary<string, object?>();
    mediatorRequest.Parameters.Add("LogNo", 5177);
    mediatorRequest.Parameters.Add("ServerID", "ServerID");
    mediatorRequest.Parameters.Add("RunningEnvironment", "RunningEnvironment");
    // ...

    await mediatorClient.PublishAsync(mediatorRequest);
    */
    public class LoggerRequestHandler : INotificationHandler<LoggerRequest>
    {
        private ILogger logger { get; }

        private ILoggerClient loggerClient { get; }

        public LoggerRequestHandler(ILogger logger, ILoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        public async Task Handle(LoggerRequest loggerRequest, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrEmpty(loggerRequest.ApplicationID) == true || ModuleConfiguration.ApplicationIDCircuitBreakers.ContainsKey(loggerRequest.ApplicationID) == false)
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(loggerRequest));
                }

                await Task.Run(() =>
                {
                    LogMessage logMessage = new LogMessage();
                    logMessage.LogNo = loggerRequest.LogNo;
                    logMessage.ServerID = loggerRequest.ServerID;
                    logMessage.RunningEnvironment = loggerRequest.RunningEnvironment;
                    logMessage.ProgramName = loggerRequest.ProgramName;
                    logMessage.GlobalID = loggerRequest.GlobalID;
                    logMessage.Acknowledge = loggerRequest.Acknowledge;
                    logMessage.ApplicationID = loggerRequest.ApplicationID;
                    logMessage.ProjectID = loggerRequest.ProjectID;
                    logMessage.TransactionID = loggerRequest.TransactionID;
                    logMessage.ServiceID = loggerRequest.ServiceID;
                    logMessage.Type = loggerRequest.Type;
                    logMessage.Flow = loggerRequest.Flow;
                    logMessage.Level = loggerRequest.Level;
                    logMessage.Format = loggerRequest.Format;
                    logMessage.Message = loggerRequest.Message;
                    logMessage.Properties = loggerRequest.Properties;
                    logMessage.UserID = loggerRequest.UserID;
                    logMessage.CreatedAt = loggerRequest.CreatedAt;
                    logMessage.StartedAt = loggerRequest.StartedAt;
                    logMessage.EndedAt = loggerRequest.EndedAt;

                    loggerClient.InsertWithPolicy(logMessage);
                });
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "LoggerRequestHandler/Handle");
            }

            try
            {
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "LoggerRequestHandler/Handle");
            }
        }
    }
}
