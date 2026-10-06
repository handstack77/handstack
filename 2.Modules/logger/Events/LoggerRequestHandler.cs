using System;
using System.Threading;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Message;

using logger.Encapsulation;
using logger.Entity;

using Mediator;

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
    public class LoggerRequest(MediatorRequest request) : INotification
    {
        public long LogNo { get; set; } = request.Parameters.Get<long>("LogNo");

        public string ServerID { get; set; } = request.Parameters.Get<string>("ServerID").ToStringSafe();

        public string RunningEnvironment { get; set; } = request.Parameters.Get<string>("RunningEnvironment").ToStringSafe();

        public string ProgramName { get; set; } = request.Parameters.Get<string>("ProgramName").ToStringSafe();

        public string GlobalID { get; set; } = request.Parameters.Get<string>("GlobalID").ToStringSafe();

        public string Acknowledge { get; set; } = request.Parameters.Get<string>("Acknowledge").ToStringSafe();

        public string ApplicationID { get; set; } = request.Parameters.Get<string>("ApplicationID").ToStringSafe();

        public string ProjectID { get; set; } = request.Parameters.Get<string>("ProjectID").ToStringSafe();

        public string TransactionID { get; set; } = request.Parameters.Get<string>("TransactionID").ToStringSafe();

        public string ServiceID { get; set; } = request.Parameters.Get<string>("ServiceID").ToStringSafe();

        public string Type { get; set; } = request.Parameters.Get<string>("Type").ToStringSafe();

        public string Flow { get; set; } = request.Parameters.Get<string>("Flow").ToStringSafe();

        public string Level { get; set; } = request.Parameters.Get<string>("Level").ToStringSafe();

        public string Format { get; set; } = request.Parameters.Get<string>("Format").ToStringSafe();

        public string Message { get; set; } = request.Parameters.Get<string>("Message").ToStringSafe();

        public string Properties { get; set; } = request.Parameters.Get<string>("Properties").ToStringSafe();

        public string UserID { get; set; } = request.Parameters.Get<string>("UserID").ToStringSafe();

        public string CreatedAt { get; set; } = request.Parameters.Get<string>("CreatedAt").ToStringSafe();

        public string StartedAt { get; set; } = request.Parameters.Get<string>("StartedAt").ToStringSafe();

        public string EndedAt { get; set; } = request.Parameters.Get<string>("EndedAt").ToStringSafe();
    }

    public class LoggerRequestHandler(ILogger logger, ILoggerClient loggerClient) : INotificationHandler<LoggerRequest>
    {
        private ILogger logger { get; } = logger;

        private ILoggerClient loggerClient { get; } = loggerClient;

        public async ValueTask Handle(LoggerRequest loggerRequest, CancellationToken cancellationToken)
        {
            try
            {
                ArgumentNullException.ThrowIfNull(loggerRequest);

                if (string.IsNullOrWhiteSpace(loggerRequest.ApplicationID))
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(loggerRequest));
                    return;
                }

                if (ModuleConfiguration.IsSQLiteCreateOnNotSettingRequest == true)
                {
                    if (ModuleConfiguration.CheckSQLiteCreate(loggerRequest.ApplicationID) == null)
                    {
                        logger.Warning("데이터 소스 생성 기능 확인 필요: " + JsonConvert.SerializeObject(loggerRequest));
                        return;
                    }
                }

                if (ModuleConfiguration.ApplicationIDCircuitBreakers.ContainsKey(loggerRequest.ApplicationID) == false)
                {
                    logger.Warning($"ApplicationID: {loggerRequest.ApplicationID} 데이터 소스 확인 필요: " + JsonConvert.SerializeObject(loggerRequest));
                    return;
                }

                var logMessage = new LogMessage
                {
                    LogNo = loggerRequest.LogNo,
                    ServerID = loggerRequest.ServerID,
                    RunningEnvironment = loggerRequest.RunningEnvironment,
                    ProgramName = loggerRequest.ProgramName,
                    GlobalID = loggerRequest.GlobalID,
                    Acknowledge = loggerRequest.Acknowledge,
                    ApplicationID = loggerRequest.ApplicationID,
                    ProjectID = loggerRequest.ProjectID,
                    TransactionID = loggerRequest.TransactionID,
                    ServiceID = loggerRequest.ServiceID,
                    Type = loggerRequest.Type,
                    Flow = loggerRequest.Flow,
                    Level = loggerRequest.Level,
                    Format = loggerRequest.Format,
                    Message = loggerRequest.Message,
                    Properties = loggerRequest.Properties,
                    UserID = loggerRequest.UserID,
                    CreatedAt = loggerRequest.CreatedAt,
                    StartedAt = loggerRequest.StartedAt,
                    EndedAt = loggerRequest.EndedAt
                };

                await loggerClient.InsertWithPolicy(logMessage);
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "LoggerRequestHandler/Handle");
            }
        }
    }
}

