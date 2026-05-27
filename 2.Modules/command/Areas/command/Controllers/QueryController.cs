using System;
using System.Data;
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
    public class QueryController : BaseController
    {
        private readonly CommandLoggerClient loggerClient;
        private readonly Serilog.ILogger logger;
        private readonly ICommandDataClient dataClient;
        private readonly IMediator mediator;

        public QueryController(Serilog.ILogger logger, ICommandDataClient dataClient, CommandLoggerClient loggerClient, IMediator mediator)
        {
            this.logger = logger;
            this.dataClient = dataClient;
            this.loggerClient = loggerClient;
            this.mediator = mediator;
        }

        // http://localhost:8421/command/api/query/has
        [HttpGet("[action]")]
        public ActionResult Has(string applicationID, string projectID, string transactionID, string functionID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var value = CommandMapper.HasCommand(applicationID, projectID, transactionID, functionID);
                return Content(JsonConvert.SerializeObject(value), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] command 매핑 확인 오류", "Query/Has");
                return StatusCode(StatusCodes.Status500InternalServerError, "command 매핑 확인 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/command/api/query/refresh?changeType=Created&filePath=HDS/TST/TST010.xml
        [HttpGet("[action]")]
        public async Task<ActionResult> Refresh(string changeType, string filePath, string? userWorkID, string? applicationID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var actionResult = await mediator.Send(new CommandRefreshRequest(changeType, filePath, userWorkID, applicationID));
                return Content(JsonConvert.SerializeObject(actionResult), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] command 계약 리프레시 오류", "Query/Refresh");
                return StatusCode(StatusCodes.Status500InternalServerError, "command 계약 리프레시 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/command/api/query/retrieve
        [HttpGet("[action]")]
        public ActionResult Retrieve(string applicationID, string? projectID, string? transactionID, string? functionID)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                if (string.IsNullOrWhiteSpace(applicationID) || string.IsNullOrWhiteSpace(projectID))
                {
                    return Content("필수 항목 확인", "text/html");
                }

                var queryResults = CommandMapper.CommandMappings.Select(item => item.Value).Where(item => item.ApplicationID == applicationID);
                if (string.IsNullOrWhiteSpace(projectID) == false)
                {
                    queryResults = queryResults.Where(item => item.ProjectID == projectID);
                }

                if (string.IsNullOrWhiteSpace(transactionID) == false)
                {
                    queryResults = queryResults.Where(item => item.TransactionID == transactionID);
                }

                if (string.IsNullOrWhiteSpace(functionID) == false)
                {
                    if (TryGetFunctionIDPrefix(functionID, out var queryFunctionID) == false)
                    {
                        return BadRequest("functionID 형식 확인 필요");
                    }

                    queryResults = queryResults.Where(item => TryGetFunctionIDPrefix(item.CommandID, out var commandIDPrefix) && commandIDPrefix == queryFunctionID);
                }

                return Content(JsonConvert.SerializeObject(queryResults.ToList()), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] command 계약 조회 오류", "Query/Retrieve");
                return StatusCode(StatusCodes.Status500InternalServerError, "command 계약 조회 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/command/api/query/meta
        [HttpGet("[action]")]
        public ActionResult Meta()
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                return Content(JsonConvert.SerializeObject(CommandMapper.CommandMappings.Select(item => item.Key).ToList()), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] command 메타 조회 오류", "Query/Meta");
                return StatusCode(StatusCodes.Status500InternalServerError, "command 메타 조회 중 오류가 발생했습니다.");
            }
        }

        // http://localhost:8421/command/api/query/reports
        [HttpGet("[action]")]
        public ActionResult Reports(string? queryIDs)
        {
            if (HttpContext.IsAllowAuthorization() == false)
            {
                return BadRequest();
            }

            try
            {
                var queryResults = CommandMapper.CommandMappings.Select(item => item.Value);
                if (string.IsNullOrWhiteSpace(queryIDs) == false)
                {
                    queryResults = queryResults.Where(item => IsQueryIDMatch(queryIDs, item.ApplicationID, item.ProjectID, item.TransactionID, item.CommandID));
                }

                var reports = queryResults.Select(item => new
                {
                    CommandType = "C",
                    item.ApplicationID,
                    item.ProjectID,
                    item.TransactionID,
                    ServiceID = item.CommandID.Substring(0, item.CommandID.Length - 2),
                    item.Seq,
                    item.Description,
                    Parameters = item.Parameters.Select(parameterMap => parameterMap with
                    {
                        Name = NormalizeParameterName(parameterMap.Name)
                    }).ToList(),
                    item.OutputMetas
                }).ToList();

                return Content(JsonConvert.SerializeObject(reports), "application/json");
            }
            catch (Exception exception)
            {
                logger.Error(exception, "[{LogCategory}] command 리포트 조회 오류", "Query/Reports");
                return StatusCode(StatusCodes.Status500InternalServerError, "command 리포트 조회 중 오류가 발생했습니다.");
            }
        }

        private static string NormalizeParameterName(string parameterName)
        {
            return string.IsNullOrEmpty(parameterName) == true
                ? parameterName
                : parameterName[0] switch
                {
                    '@' or ':' or '$' or '#' => parameterName.Substring(1),
                    _ => parameterName
                };
        }

        private static bool IsQueryIDMatch(string queryIDs, string applicationID, string projectID, string transactionID, string commandID)
        {
            var filters = queryIDs.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var filter in filters)
            {
                var parts = filter.Split('|', StringSplitOptions.TrimEntries);
                if (parts.Length != 4)
                {
                    continue;
                }

                if (string.Equals(parts[0], applicationID, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(parts[1], projectID, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(parts[2], transactionID, StringComparison.OrdinalIgnoreCase) &&
                    commandID.StartsWith(parts[3], StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        // http://localhost:8421/command/api/query/execute
        [HttpPost("[action]")]
        public async Task<ActionResult> Execute(DynamicRequest request)
        {
            var response = new DynamicResponse()
            {
                Acknowledge = AcknowledgeType.Failure
            };

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
                    loggerClient.DynamicRequestLogging(request, "Y", GlobalConfiguration.ApplicationID, error =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] Request JSON: {RequestJson}", "Query/Execute", request.GlobalID, JsonConvert.SerializeObject(request));
                    });
                }

                await dataClient.ExecuteDynamicCommandMap(request, response);

                if (string.IsNullOrWhiteSpace(response.ExceptionText) == false)
                {
                    loggerClient.ProgramMessageLogging(request.GlobalID, "N", GlobalConfiguration.ApplicationID, response.ExceptionText, "Query/Execute", error =>
                    {
                        logger.Error("[{LogCategory}] fallback error: {Error}, {ExceptionText}", "Query/Execute", error, response.ExceptionText);
                    });
                }
            }
            catch (Exception exception)
            {
                response.ExceptionText = "command 실행 중 오류가 발생했습니다.";
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] command 실행 오류", "Query/Execute", request.GlobalID);
            }

            try
            {
                var acknowledge = response.Acknowledge == AcknowledgeType.Success ? "Y" : "N";
                var responseData = JsonConvert.SerializeObject(response);
                if (ModuleConfiguration.IsTransactionLogging == true)
                {
                    loggerClient.DynamicResponseLogging(request.GlobalID, acknowledge, GlobalConfiguration.ApplicationID, responseData, "Query/Execute ReturnType: " + request.ReturnType.ToString(), error =>
                    {
                        logger.Warning("[{LogCategory}] [{GlobalID}] Response JSON: {ResponseJson}", "Query/Execute", response.CorrelationID, responseData);
                    });
                }

                return Content(responseData, "application/json");
            }
            catch (Exception exception)
            {
                response.ExceptionText = "응답 생성 중 오류가 발생했습니다.";
                logger.Error(exception, "[{LogCategory}] [{GlobalID}] command 응답 생성 오류", "Query/Execute", request.GlobalID);
                return Content(JsonConvert.SerializeObject(response), "application/json");
            }
        }

        private static bool TryGetFunctionIDPrefix(string? functionID, out string functionIDPrefix)
        {
            functionIDPrefix = string.Empty;
            if (string.IsNullOrWhiteSpace(functionID) || functionID.Length < 3)
            {
                return false;
            }

            functionIDPrefix = functionID.SubstringSafe(0, functionID.Length - 2);
            return string.IsNullOrWhiteSpace(functionIDPrefix) == false;
        }
    }
}
