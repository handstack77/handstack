using System;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
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
    public class LoggerRequest : INotification
    {
        public long LogNo { get; set; }

        public string ServerID { get; set; }

        public string RunningEnvironment { get; set; }

        public string ProgramName { get; set; }

        public string GlobalID { get; set; }

        public string Acknowledge { get; set; }

        public string ApplicationID { get; set; }

        public string ProjectID { get; set; }

        public string TransactionID { get; set; }

        public string ServiceID { get; set; }

        public string Type { get; set; }

        public string Flow { get; set; }

        public string Level { get; set; }

        public string Format { get; set; }

        public string Message { get; set; }

        public string Properties { get; set; }

        public string UserID { get; set; }

        public string CreatedAt { get; set; }

        public string StartedAt { get; set; }

        public string EndedAt { get; set; }

        public LoggerRequest(MediatorRequest request)
        {
            LogNo = request.Parameters.Get<long>("LogNo");
            ServerID = request.Parameters.Get<string>("ServerID").ToStringSafe();
            RunningEnvironment = request.Parameters.Get<string>("RunningEnvironment").ToStringSafe();
            ProgramName = request.Parameters.Get<string>("ProgramName").ToStringSafe();
            GlobalID = request.Parameters.Get<string>("GlobalID").ToStringSafe();
            Acknowledge = request.Parameters.Get<string>("Acknowledge").ToStringSafe();
            ApplicationID = request.Parameters.Get<string>("ApplicationID").ToStringSafe();
            ProjectID = request.Parameters.Get<string>("ProjectID").ToStringSafe();
            TransactionID = request.Parameters.Get<string>("TransactionID").ToStringSafe();
            ServiceID = request.Parameters.Get<string>("ServiceID").ToStringSafe();
            Type = request.Parameters.Get<string>("Type").ToStringSafe();
            Flow = request.Parameters.Get<string>("Flow").ToStringSafe();
            Level = request.Parameters.Get<string>("Level").ToStringSafe();
            Format = request.Parameters.Get<string>("Format").ToStringSafe();
            Message = request.Parameters.Get<string>("Message").ToStringSafe();
            Properties = request.Parameters.Get<string>("Properties").ToStringSafe();
            UserID = request.Parameters.Get<string>("UserID").ToStringSafe();
            CreatedAt = request.Parameters.Get<string>("CreatedAt").ToStringSafe();
            StartedAt = request.Parameters.Get<string>("StartedAt").ToStringSafe();
            EndedAt = request.Parameters.Get<string>("EndedAt").ToStringSafe();
        }
    }

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
        }
    }
}
