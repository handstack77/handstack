using System;
using System.Linq;
using System.Threading.Tasks;

using command.Encapsulation;
using command.Entity;
using command.Events;
using command.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Common;
using HandStack.Web.MessageContract.Enumeration;
using HandStack.Web.MessageContract.Message;

using MediatR;

using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;

namespace command.Areas.command.Controllers
{
    [Area("command")]
    [Route("[area]/api/[controller]")]
    [ApiController]
    [EnableCors]
    public class ExecutionController : BaseController
    {
        private readonly CommandLoggerClient loggerClient;
        private readonly Serilog.ILogger logger;
        private readonly ICommandDataClient dataClient;
        private readonly IMediator mediator;

        public ExecutionController(Serilog.ILogger logger, ICommandDataClient dataClient, CommandLoggerClient loggerClient, IMediator mediator)
        {
            this.logger = logger;
            this.dataClient = dataClient;
            this.loggerClient = loggerClient;
            this.mediator = mediator;
        }

        // http://localhost:8421/command/api/execution/has
        [HttpGet("[action]")]
        public ActionResult Has(string applicationID, string projectID, string transactionID, string functionID)
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var value = CommandMapper.HasCommand(applicationID, projectID, transactionID, functionID);
                    result = Content(JsonConvert.SerializeObject(value), "application/json");
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] command 매핑 확인 오류", "Execution/Has");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "command 매핑 확인 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/command/api/execution/refresh?changeType=Created&filePath=HDS/TST/TST010.xml
        [HttpGet("[action]")]
        public async Task<ActionResult> Refresh(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            ActionResult result = NotFound();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    var actionResult = await mediator.Send(new CommandRefreshRequest(changeType, filePath, userWorkID, applicationID));
                    result = Content(JsonConvert.SerializeObject(actionResult), "application/json");
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] command 계약 리프레시 오류", "Execution/Refresh");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "command 계약 리프레시 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/command/api/execution/retrieve
        [HttpGet("[action]")]
        public ActionResult Retrieve(string applicationID, string? projectID, string? transactionID, string? functionID)
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    if (string.IsNullOrWhiteSpace(applicationID) || string.IsNullOrWhiteSpace(projectID))
                    {
                        return Content("필수 항목 확인", "text/html");
                    }

                    var queryResults = CommandMapper.CommandMappings.Select(p => p.Value).Where(p => p.ApplicationID == applicationID);
                    if (!string.IsNullOrWhiteSpace(projectID))
                    {
                        queryResults = queryResults.Where(p => p.ProjectID == projectID);
                    }

                    if (!string.IsNullOrWhiteSpace(transactionID))
                    {
                        queryResults = queryResults.Where(p => p.TransactionID == transactionID);
                    }

                    if (!string.IsNullOrWhiteSpace(functionID))
                    {
                        if (!TryGetFunctionIDPrefix(functionID, out var queryFunctionID))
                        {
                            return BadRequest("functionID 형식 확인 필요");
                        }

                        queryResults = queryResults.Where(p => TryGetFunctionIDPrefix(p.CommandID, out var commandID) && commandID == queryFunctionID);
                    }

                    result = Content(JsonConvert.SerializeObject(queryResults.ToList()), "application/json");
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] command 계약 조회 오류", "Execution/Retrieve");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "command 계약 조회 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/command/api/execution/meta
        [HttpGet("[action]")]
        public ActionResult Meta()
        {
            ActionResult result = BadRequest();
            if (HttpContext.IsAllowAuthorization() == false)
            {
                result = BadRequest();
            }
            else
            {
                try
                {
                    result = Content(JsonConvert.SerializeObject(CommandMapper.CommandMappings.Select(p => p.Key).ToList()), "application/json");
                }
                catch (Exception exception)
                {
                    logger.Error(exception, "[{LogCategory}] command 메타 조회 오류", "Execution/Meta");
                    result = StatusCode(StatusCodes.Status500InternalServerError, "command 메타 조회 중 오류가 발생했습니다.");
                }
            }

            return result;
        }

        // http://localhost:8421/command/api/execution
        [HttpPost]
        public async Task<ActionResult> Execute(DynamicRequest request)
        {
            ActionResult result = BadRequest();
            var response = new DynamicResponse();
            response.Acknowledge = AcknowledgeType.Failure;

            if (request == null)
            {
                response.ExceptionText = "빈 요청. 요청 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(response), "application/json");
            }

            if (HttpContext.IsAllowAuthorization() == false)
            {
                response.ExceptionText = "필수 접근 정보 확인 필요";
                return Content(JsonConvert.SerializeObject(response), "application/json");
            }

            response.CorrelationID = request.GlobalID;
            if (string.IsNullOrWhiteSpace(request.RequestID))
            {
                request.RequestID = $"SELF_{GlobalConfiguration.SystemID}{GlobalConfiguration.HostName}{GlobalConfiguration.RunningEnvironment}{DateTime.Now:yyyyMMddHHmmssfff}";
            }

            if (string.IsNullOrWhiteSpace(request.GlobalID))
            {
                request.GlobalID = request.RequestID;
                response.CorrelationID = request.GlobalID;
            }

            try
            {
                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicRequestLogging(request, "Y", GlobalConfiguration.ApplicationID, (string error) =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] Request JSON: {RequestJson}", "Execution/Execute", request.GlobalID, JsonConvert.SerializeObject(request));
                    });
                }

                await dataClient.ExecuteDynamicCommandMap(request, response);

                if (!string.IsNullOrWhiteSpace(response.ExceptionText))
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Execution/Execute", (string error) =>
                    {
                        logger.Error("[{LogCategory}] fallback error: {Error}, {ExceptionText}", "Execution/Execute", error, response.ExceptionText);
                    });
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = "command 실행 중 오류가 발생했습니다.";
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] command 실행 오류", "Execution/Execute", request.GlobalID);
            }

            try
            {
                var acknowledge = response.Acknowledge == AcknowledgeType.Success ? "Y" : "N";
                var responseData = JsonConvert.SerializeObject(response);
                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicResponseLogging(request.GlobalID, acknowledge, GlobalConfiguration.ApplicationID, responseData, "Execution/Execute ReturnType: " + request.ReturnType.ToString(), (string error) =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] Response JSON: {ResponseJson}", "Execution/Execute", response.CorrelationID, responseData);
                    });
                }

                result = Content(responseData, "application/json");
            }
            catch (Exception exception)
            {
                response.ExceptionText = "응답 생성 중 오류가 발생했습니다.";
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] command 응답 생성 오류", "Execution/Execute", request.GlobalID);
                result = Content(JsonConvert.SerializeObject(response), "application/json");
            }

            return result;
        }

        private static bool TryGetFunctionIDPrefix(string? functionID, out string functionIDPrefix)
        {
            functionIDPrefix = string.Empty;
            if (string.IsNullOrWhiteSpace(functionID) || functionID.Length < 3)
            {
                return false;
            }

            functionIDPrefix = functionID.Substring(0, functionID.Length - 2);
            return !string.IsNullOrWhiteSpace(functionIDPrefix);
        }
    }
}

