using System;
using System.Threading.Tasks;

using HandStack.Web.Common;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.Message;

using logger.Encapsulation;
using logger.Entity;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

using Serilog;

namespace logger.Areas.logger.Controllers
{
    [Area("logger")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class LogController : BaseController
    {
        private ILogger logger { get; }

        private ILoggerClient loggerClient { get; }

        public LogController(ILogger logger, ILoggerClient loggerClient)
        {
            this.logger = logger;
            this.loggerClient = loggerClient;
        }

        // logMessage.ServerID = "WEB01";
        // logMessage.RunningEnvironment = "D";
        // logMessage.ProgramName = "HANDSTACK";
        // logMessage.GlobalID = "HDSSYSSYS010LF01D20230918131830863LFK";
        // logMessage.Acknowledge = "1";
        // logMessage.ApplicationID = "HDS";
        // logMessage.ProjectID = "SYS";
        // logMessage.TransactionID = "SYS010";
        // logMessage.ServiceID = "LF01";
        // logMessage.Type = "T";
        // logMessage.Flow = "I";
        // logMessage.Level = "D";
        // logMessage.Format = "J";
        // logMessage.Message = "블라블라";
        // logMessage.Properties = "프롭프롭";
        // logMessage.UserID = "system";
        // logMessage.CreatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
        // logMessage.IpAddress = "system";
        // logMessage.DeviceID = "system";
        // logMessage.ProgramID = "system";
        // http://localhost:8421/logger/api/log/insert
        [HttpGet("[action]")]
        [HttpPost("[action]")]
        public async Task<ActionResult> Insert(LogMessage logMessage)
        {
            ActionResult result = BadRequest();

            try
            {
                if (string.IsNullOrEmpty(logMessage.ApplicationID) == true)
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(logMessage));
                    return result;
                }

                if (ModuleConfiguration.IsSQLiteCreateOnNotSettingRequest == true)
                {
                    if (ModuleConfiguration.CheckSQLiteCreate(logMessage.ApplicationID) == null)
                    {
                        logger.Warning("데이터 소스 생성 기능 확인 필요: " + JsonConvert.SerializeObject(logMessage));
                        return result;
                    }
                }

                if (ModuleConfiguration.ApplicationIDCircuitBreakers.ContainsKey(logMessage.ApplicationID) == false)
                {
                    logger.Warning($"ApplicationID: {logMessage.ApplicationID} 데이터 소스 확인 필요: " + JsonConvert.SerializeObject(logMessage));
                    return result;
                }

                await loggerClient.InsertWithPolicy(logMessage);

                result = Ok();
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "LogController/Insert");
            }

            return result;
        }

        // http://localhost:8421/logger/api/log/list?applicationID=HDS
        [HttpGet("[action]")]
        public async Task<ActionResult> List(string applicationID, string? serverID, string? globalID, string? environment, string? projectID, string? serviceID, string? transactionID, string? startedAt, string? endedAt)
        {
            ActionResult result = BadRequest();

            try
            {
                if (string.IsNullOrEmpty(applicationID) == true)
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(new
                    {
                        ApplicationID = applicationID,
                        ServerID = serverID,
                        GlobalID = globalID,
                        Environment = environment,
                        ProjectID = projectID,
                        ServiceID = serviceID,
                        TransactionID = transactionID,
                        StartedAt = startedAt,
                        EndedAt = endedAt
                    }));
                    return result;
                }

                if (ModuleConfiguration.IsSQLiteCreateOnNotSettingRequest == true)
                {
                    if (ModuleConfiguration.CheckSQLiteCreate(applicationID) == null)
                    {
                        logger.Warning("데이터 소스 생성 기능 확인 필요: " + JsonConvert.SerializeObject(new
                        {
                            ApplicationID = applicationID,
                            ServerID = serverID,
                            GlobalID = globalID,
                            Environment = environment,
                            ProjectID = projectID,
                            ServiceID = serviceID,
                            TransactionID = transactionID,
                            StartedAt = startedAt,
                            EndedAt = endedAt
                        }));
                        return result;
                    }
                }

                if (ModuleConfiguration.ApplicationIDCircuitBreakers.ContainsKey(applicationID) == false)
                {
                    logger.Warning($"ApplicationID: {applicationID} 데이터 소스 확인 필요");
                    return result;
                }

                using var dataSet = await loggerClient.LogList(applicationID, serverID, globalID, environment, projectID, serviceID, transactionID, startedAt, endedAt);
                result = Content(dataSet == null ? "[]" : JsonConvert.SerializeObject(dataSet.Tables[0]), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "LogController/List");
            }

            return result;
        }

        // http://localhost:8421/logger/api/log/detail?applicationID=HDS&logNo=1
        [HttpGet("[action]")]
        public async Task<ActionResult> Detail(string applicationID, string logNo)
        {
            ActionResult result = BadRequest();

            try
            {
                if (string.IsNullOrEmpty(applicationID) == true || string.IsNullOrEmpty(logNo) == true)
                {
                    logger.Warning("필수 요청 항목 확인 필요: " + JsonConvert.SerializeObject(new
                    {
                        ApplicationID = applicationID,
                        LogNo = logNo
                    }));
                    return result;
                }

                if (ModuleConfiguration.IsSQLiteCreateOnNotSettingRequest == true)
                {
                    if (ModuleConfiguration.CheckSQLiteCreate(applicationID) == null)
                    {
                        logger.Warning("데이터 소스 생성 기능 확인 필요: " + JsonConvert.SerializeObject(new
                        {
                            ApplicationID = applicationID,
                            LogNo = logNo
                        }));
                        return result;
                    }
                }

                if (ModuleConfiguration.ApplicationIDCircuitBreakers.ContainsKey(applicationID) == false)
                {
                    logger.Warning($"ApplicationID: {applicationID} 데이터 소스 확인 필요");
                    return result;
                }

                using var dataSet = await loggerClient.LogDetail(applicationID, logNo);
                result = Content(dataSet == null ? "[]" : JsonConvert.SerializeObject(dataSet.Tables[0]), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.ToMessage(), "LogController/Detail");
            }

            return result;
        }
    }
}
